"""
Stock data fetching and indicator calculation using yfinance.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import yfinance as yf
from functools import lru_cache
import time

from app.ml.forecaster import StockForecaster, create_features, _compute_rsi


# Simple in-memory cache to avoid hammering Yahoo
_CACHE: Dict[str, Any] = {}
_CACHE_TTL = 300  # 5 minutes


def _cache_get(key: str):
    entry = _CACHE.get(key)
    if entry and time.time() - entry["ts"] < _CACHE_TTL:
        return entry["data"]
    return None


def _cache_set(key: str, data: Any):
    _CACHE[key] = {"data": data, "ts": time.time()}


def get_stock_info(symbol: str) -> Dict[str, Any]:
    cache_key = f"info:{symbol.upper()}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    ticker = yf.Ticker(symbol.upper())
    info = ticker.info or {}

    result = {
        "symbol": symbol.upper(),
        "name": info.get("longName") or info.get("shortName") or symbol.upper(),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose"),
        "previous_close": info.get("previousClose") or info.get("regularMarketPreviousClose"),
        "open": info.get("open") or info.get("regularMarketOpen"),
        "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh"),
        "day_low": info.get("dayLow") or info.get("regularMarketDayLow"),
        "volume": info.get("volume") or info.get("regularMarketVolume"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "currency": info.get("currency", "USD"),
        "exchange": info.get("exchange"),
    }
    _cache_set(cache_key, result)
    return result


def get_historical(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
    include_indicators: bool = True,
) -> Dict[str, Any]:
    cache_key = f"hist:{symbol.upper()}:{period}:{interval}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    ticker = yf.Ticker(symbol.upper())
    df = ticker.history(period=period, interval=interval, auto_adjust=True)

    if df.empty:
        # Try with different period
        df = ticker.history(period="6mo", interval=interval, auto_adjust=True)

    if df.empty:
        raise ValueError(f"No historical data found for {symbol}")

    df = df.reset_index()
    # Normalize column names
    date_col = "Date" if "Date" in df.columns else "Datetime"
    df[date_col] = pd.to_datetime(df[date_col]).dt.strftime("%Y-%m-%d")

    records = []
    for _, row in df.iterrows():
        records.append(
            {
                "date": row[date_col],
                "open": round(float(row["Open"]), 4),
                "high": round(float(row["High"]), 4),
                "low": round(float(row["Low"]), 4),
                "close": round(float(row["Close"]), 4),
                "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
                "adj_close": round(float(row.get("Close", row["Close"])), 4),
            }
        )

    indicators = None
    if include_indicators and len(df) > 50:
        closes = df["Close"].astype(float)
        indicators = {
            "sma_20": [round(x, 4) if pd.notna(x) else None for x in closes.rolling(20).mean()],
            "sma_50": [round(x, 4) if pd.notna(x) else None for x in closes.rolling(50).mean()],
            "ema_12": [round(x, 4) if pd.notna(x) else None for x in closes.ewm(span=12).mean()],
            "rsi_14": [round(x, 2) if pd.notna(x) else None for x in _compute_rsi(closes, 14)],
        }

    result = {
        "symbol": symbol.upper(),
        "period": period,
        "interval": interval,
        "data": records,
        "indicators": indicators,
    }
    _cache_set(cache_key, result)
    return result


def get_dataframe_for_ml(symbol: str, lookback_days: int = 365) -> pd.DataFrame:
    period_map = {
        60: "3mo",
        90: "6mo",
        180: "6mo",
        365: "1y",
        730: "2y",
        1095: "3y",
        1825: "5y",
    }
    # Find closest period
    period = "1y"
    for days, p in sorted(period_map.items()):
        if lookback_days <= days:
            period = p
            break
    else:
        period = "5y"

    ticker = yf.Ticker(symbol.upper())
    df = ticker.history(period=period, interval="1d", auto_adjust=True)
    if df.empty:
        raise ValueError(f"No data available for {symbol}")
    df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()
    return df


def run_forecast(
    symbol: str,
    days: int = 7,
    model: str = "ensemble",
    lookback_days: int = 365,
) -> Dict[str, Any]:
    df = get_dataframe_for_ml(symbol, lookback_days)
    forecaster = StockForecaster(lookback_days=lookback_days)
    result = forecaster.run(df, days=days, model=model)
    result["symbol"] = symbol.upper()
    result["forecast_days"] = days
    result["generated_at"] = datetime.utcnow().isoformat() + "Z"
    result["confidence_note"] = (
        "These forecasts are educational estimates based on historical patterns. "
        "They are not guaranteed and should not be used as financial advice."
    )
    return result


def compare_stocks(symbols: List[str], period: str = "6mo") -> Dict[str, Any]:
    stocks = []
    historical = {}
    closes_for_corr = {}

    for sym in symbols:
        try:
            info = get_stock_info(sym)
            hist = get_historical(sym, period=period, include_indicators=False)
            stocks.append(
                {
                    "symbol": info["symbol"],
                    "name": info.get("name"),
                    "current_price": info.get("current_price"),
                    "change_pct": None,
                    "volume": info.get("volume"),
                }
            )
            if hist["data"]:
                first = hist["data"][0]["close"]
                last = hist["data"][-1]["close"]
                if first:
                    stocks[-1]["change_pct"] = round((last - first) / first * 100, 2)
                historical[sym.upper()] = hist["data"]
                closes_for_corr[sym.upper()] = pd.Series(
                    {r["date"]: r["close"] for r in hist["data"]}
                )
        except Exception as e:
            stocks.append({"symbol": sym.upper(), "name": None, "error": str(e)})

    correlation = None
    if len(closes_for_corr) >= 2:
        corr_df = pd.DataFrame(closes_for_corr).dropna()
        if not corr_df.empty:
            correlation = corr_df.corr().round(3).to_dict()

    return {"stocks": stocks, "historical": historical, "correlation": correlation}


def search_symbols(query: str) -> List[Dict[str, str]]:
    """Basic popular symbols filter (yfinance has no free search API)."""
    popular = [
        ("AAPL", "Apple Inc."),
        ("MSFT", "Microsoft Corporation"),
        ("GOOGL", "Alphabet Inc."),
        ("AMZN", "Amazon.com Inc."),
        ("TSLA", "Tesla Inc."),
        ("META", "Meta Platforms Inc."),
        ("NVDA", "NVIDIA Corporation"),
        ("JPM", "JPMorgan Chase & Co."),
        ("V", "Visa Inc."),
        ("JNJ", "Johnson & Johnson"),
        ("WMT", "Walmart Inc."),
        ("PG", "Procter & Gamble"),
        ("MA", "Mastercard Inc."),
        ("UNH", "UnitedHealth Group"),
        ("HD", "Home Depot Inc."),
        ("DIS", "Walt Disney Co."),
        ("NFLX", "Netflix Inc."),
        ("AMD", "Advanced Micro Devices"),
        ("INTC", "Intel Corporation"),
        ("BA", "Boeing Company"),
        ("RELIANCE.NS", "Reliance Industries (NSE)"),
        ("TCS.NS", "Tata Consultancy Services"),
        ("INFY.NS", "Infosys Limited"),
        ("HDFCBANK.NS", "HDFC Bank"),
        ("ICICIBANK.NS", "ICICI Bank"),
        ("SBIN.NS", "State Bank of India"),
        ("BHARTIARTL.NS", "Bharti Airtel"),
        ("ITC.NS", "ITC Limited"),
        ("WIPRO.NS", "Wipro Limited"),
        ("LT.NS", "Larsen & Toubro"),
    ]
    q = query.upper().strip()
    if not q:
        return [{"symbol": s, "name": n} for s, n in popular[:15]]
    results = [{"symbol": s, "name": n} for s, n in popular if q in s or q in n.upper()]
    return results[:20]
