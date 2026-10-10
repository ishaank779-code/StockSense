"""
StockSense ML Forecaster
Educational time-series forecasting using XGBoost, ARIMA and a simple ensemble.
Predictions are uncertain estimates — NOT financial advice.
"""

from __future__ import annotations

import warnings
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingRegressor

warnings.filterwarnings("ignore")

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from statsmodels.tsa.arima.model import ARIMA
    HAS_ARIMA = True
except ImportError:
    HAS_ARIMA = False


def _safe_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    mask = y_true != 0
    if not mask.any():
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def _direction_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    if len(y_true) < 2:
        return 0.0
    true_dir = np.diff(y_true) > 0
    pred_dir = np.diff(y_pred) > 0
    return float(np.mean(true_dir == pred_dir) * 100)


def create_features(df: pd.DataFrame, target_col: str = "Close") -> pd.DataFrame:
    """Create lag and technical features for XGBoost."""
    data = df.copy()
    data["return"] = data[target_col].pct_change()
    data["log_return"] = np.log(data[target_col] / data[target_col].shift(1))

    for lag in [1, 2, 3, 5, 7, 10, 14, 21]:
        data[f"lag_{lag}"] = data[target_col].shift(lag)
        data[f"return_lag_{lag}"] = data["return"].shift(lag)

    data["sma_5"] = data[target_col].rolling(5).mean()
    data["sma_10"] = data[target_col].rolling(10).mean()
    data["sma_20"] = data[target_col].rolling(20).mean()
    data["sma_50"] = data[target_col].rolling(50).mean()
    data["ema_12"] = data[target_col].ewm(span=12).mean()
    data["ema_26"] = data[target_col].ewm(span=26).mean()
    data["volatility_10"] = data["return"].rolling(10).std()
    data["volatility_20"] = data["return"].rolling(20).std()
    data["rsi"] = _compute_rsi(data[target_col], 14)
    data["momentum_10"] = data[target_col] / data[target_col].shift(10) - 1
    data["volume_sma"] = data["Volume"].rolling(10).mean() if "Volume" in data.columns else 0
    data["day_of_week"] = data.index.dayofweek if hasattr(data.index, "dayofweek") else 0
    data["month"] = data.index.month if hasattr(data.index, "month") else 1

    data = data.dropna()
    return data


def _compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(window=period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


class StockForecaster:
    def __init__(self, lookback_days: int = 365):
        self.lookback_days = lookback_days
        self.scaler = StandardScaler()

    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty or len(df) < 60:
            raise ValueError("Insufficient historical data (need at least 60 trading days)")
        df = df.copy()
        df.index = pd.to_datetime(df.index)
        df = df.sort_index()
        # Keep last lookback_days
        if len(df) > self.lookback_days:
            df = df.iloc[-self.lookback_days :]
        return df

    def train_xgboost(
        self, df: pd.DataFrame, test_size: float = 0.2
    ) -> Tuple[Any, Dict[str, float], pd.DataFrame]:
        featured = create_features(df)
        feature_cols = [c for c in featured.columns if c not in ["Open", "High", "Low", "Close", "Volume", "Adj Close", "return", "log_return"]]
        # Prefer only numeric feature columns that exist
        feature_cols = [c for c in feature_cols if c in featured.columns and featured[c].dtype in [np.float64, np.int64, float, int]]

        X = featured[feature_cols]
        y = featured["Close"]

        split = int(len(X) * (1 - test_size))
        X_train, X_test = X.iloc[:split], X.iloc[split:]
        y_train, y_test = y.iloc[:split], y.iloc[split:]

        if HAS_XGB:
            model = xgb.XGBRegressor(
                n_estimators=150,
                max_depth=5,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1,
                verbosity=0,
            )
        else:
            model = GradientBoostingRegressor(
                n_estimators=120,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.8,
                random_state=42,
            )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        metrics = {
            "mae": float(mean_absolute_error(y_test, y_pred)),
            "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
            "mape": _safe_mape(y_test.values, y_pred),
            "r2": float(r2_score(y_test, y_pred)),
            "direction_accuracy": _direction_accuracy(y_test.values, y_pred),
            "model_type": "xgboost" if HAS_XGB else "gbr",
            "train_samples": len(X_train),
            "test_samples": len(X_test),
        }
        return model, metrics, featured

    def forecast_xgboost(
        self, df: pd.DataFrame, days: int = 7
    ) -> Tuple[List[Dict], Dict[str, float]]:
        model, metrics, featured = self.train_xgboost(df)
        feature_cols = [c for c in featured.columns if c not in ["Open", "High", "Low", "Close", "Volume", "Adj Close", "return", "log_return"]]
        feature_cols = [c for c in feature_cols if c in featured.columns]

        last_row = featured.iloc[-1:].copy()
        last_price = float(df["Close"].iloc[-1])
        last_date = df.index[-1]
        if not isinstance(last_date, pd.Timestamp):
            last_date = pd.Timestamp(last_date)

        predictions = []
        current_features = last_row[feature_cols].copy()
        hist_closes = list(df["Close"].values[-30:])

        for i in range(days):
            pred = float(model.predict(current_features)[0])
            # Simple residual-based uncertainty
            residual_std = metrics["rmse"] * (1 + 0.15 * i)
            lower = max(0.01, pred - 1.64 * residual_std)
            upper = pred + 1.64 * residual_std

            next_date = last_date + timedelta(days=i + 1)
            # Skip weekends roughly
            while next_date.weekday() >= 5:
                next_date += timedelta(days=1)

            predictions.append(
                {
                    "date": next_date.strftime("%Y-%m-%d"),
                    "predicted": round(pred, 2),
                    "lower": round(lower, 2),
                    "upper": round(upper, 2),
                }
            )

            # Update features for next step (simplified recursive)
            hist_closes.append(pred)
            # Shift lags roughly
            for lag in [1, 2, 3, 5, 7, 10, 14, 21]:
                col = f"lag_{lag}"
                if col in current_features.columns:
                    if lag == 1:
                        current_features[col] = pred
                    else:
                        # approximate
                        idx = -lag if lag < len(hist_closes) else 0
                        current_features[col] = hist_closes[idx] if hist_closes else pred

            # Update SMAs approximately
            if "sma_5" in current_features.columns:
                current_features["sma_5"] = np.mean(hist_closes[-5:])
            if "sma_10" in current_features.columns:
                current_features["sma_10"] = np.mean(hist_closes[-10:])
            if "sma_20" in current_features.columns:
                current_features["sma_20"] = np.mean(hist_closes[-20:]) if len(hist_closes) >= 20 else pred

        return predictions, metrics

    def forecast_arima(
        self, df: pd.DataFrame, days: int = 7
    ) -> Tuple[List[Dict], Dict[str, float]]:
        if not HAS_ARIMA:
            return self.forecast_xgboost(df, days)

        series = df["Close"].astype(float)
        train_size = int(len(series) * 0.85)
        train, test = series.iloc[:train_size], series.iloc[train_size:]

        try:
            model = ARIMA(train, order=(5, 1, 2))
            fitted = model.fit()
            forecast_obj = fitted.get_forecast(steps=len(test) + days)
            conf = forecast_obj.conf_int(alpha=0.1)
            pred_mean = forecast_obj.predicted_mean

            # Metrics on test
            test_pred = pred_mean.iloc[: len(test)]
            metrics = {
                "mae": float(mean_absolute_error(test, test_pred)),
                "rmse": float(np.sqrt(mean_squared_error(test, test_pred))),
                "mape": _safe_mape(test.values, test_pred.values),
                "r2": float(r2_score(test, test_pred)) if len(test) > 1 else 0.0,
                "direction_accuracy": _direction_accuracy(test.values, test_pred.values),
                "model_type": "arima",
                "train_samples": len(train),
                "test_samples": len(test),
            }

            last_date = series.index[-1]
            if not isinstance(last_date, pd.Timestamp):
                last_date = pd.Timestamp(last_date)

            predictions = []
            next_date = last_date
            for i in range(days):
                idx = len(test) + i
                pred = float(pred_mean.iloc[idx])
                lower = float(conf.iloc[idx, 0])
                upper = float(conf.iloc[idx, 1])
                next_date = next_date + timedelta(days=1)
                while next_date.weekday() >= 5:
                    next_date += timedelta(days=1)
                predictions.append(
                    {
                        "date": next_date.strftime("%Y-%m-%d"),
                        "predicted": round(pred, 2),
                        "lower": round(max(0.01, lower), 2),
                        "upper": round(upper, 2),
                    }
                )
            return predictions, metrics
        except Exception:
            # Fallback
            return self.forecast_xgboost(df, days)

    def forecast_ensemble(
        self, df: pd.DataFrame, days: int = 7
    ) -> Tuple[List[Dict], Dict[str, float]]:
        xgb_preds, xgb_metrics = self.forecast_xgboost(df, days)
        arima_preds, arima_metrics = self.forecast_arima(df, days)

        predictions = []
        for i in range(days):
            x = xgb_preds[i]
            a = arima_preds[i]
            # Weighted average (XGBoost usually stronger on equities)
            pred = 0.6 * x["predicted"] + 0.4 * a["predicted"]
            lower = 0.6 * x["lower"] + 0.4 * a["lower"]
            upper = 0.6 * x["upper"] + 0.4 * a["upper"]
            predictions.append(
                {
                    "date": x["date"],
                    "predicted": round(pred, 2),
                    "lower": round(lower, 2),
                    "upper": round(upper, 2),
                }
            )

        metrics = {
            "mae": round(0.6 * xgb_metrics["mae"] + 0.4 * arima_metrics.get("mae", xgb_metrics["mae"]), 4),
            "rmse": round(0.6 * xgb_metrics["rmse"] + 0.4 * arima_metrics.get("rmse", xgb_metrics["rmse"]), 4),
            "mape": round(0.6 * xgb_metrics["mape"] + 0.4 * arima_metrics.get("mape", xgb_metrics["mape"]), 4),
            "r2": round(0.6 * xgb_metrics.get("r2", 0) + 0.4 * arima_metrics.get("r2", 0), 4),
            "direction_accuracy": round(
                0.6 * xgb_metrics.get("direction_accuracy", 50)
                + 0.4 * arima_metrics.get("direction_accuracy", 50),
                2,
            ),
            "model_type": "ensemble",
            "train_samples": xgb_metrics.get("train_samples"),
            "test_samples": xgb_metrics.get("test_samples"),
        }
        return predictions, metrics

    def detect_trend(self, df: pd.DataFrame, predictions: List[Dict]) -> str:
        last_price = float(df["Close"].iloc[-1])
        future_avg = np.mean([p["predicted"] for p in predictions])
        change_pct = (future_avg - last_price) / last_price * 100

        # Also look at recent SMA
        sma20 = df["Close"].rolling(20).mean().iloc[-1]
        sma50 = df["Close"].rolling(50).mean().iloc[-1] if len(df) >= 50 else sma20

        if change_pct > 2 and last_price > sma20:
            return "bullish"
        elif change_pct < -2 and last_price < sma20:
            return "bearish"
        return "neutral"

    def run(
        self, df: pd.DataFrame, days: int = 7, model: str = "ensemble"
    ) -> Dict[str, Any]:
        df = self.prepare_data(df)
        model = model.lower()

        if model == "xgboost":
            preds, metrics = self.forecast_xgboost(df, days)
        elif model == "arima":
            preds, metrics = self.forecast_arima(df, days)
        else:
            preds, metrics = self.forecast_ensemble(df, days)

        trend = self.detect_trend(df, preds)
        last_price = float(df["Close"].iloc[-1])
        last_date = df.index[-1]
        if hasattr(last_date, "strftime"):
            last_date_str = last_date.strftime("%Y-%m-%d")
        else:
            last_date_str = str(last_date)[:10]

        return {
            "predictions": preds,
            "metrics": metrics,
            "trend": trend,
            "last_actual_price": round(last_price, 2),
            "last_actual_date": last_date_str,
            "model_used": metrics.get("model_type", model),
        }
