from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime


class StockInfo(BaseModel):
    symbol: str
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    current_price: Optional[float] = None
    previous_close: Optional[float] = None
    open: Optional[float] = None
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    currency: Optional[str] = "USD"
    exchange: Optional[str] = None


class OHLCV(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    adj_close: Optional[float] = None


class HistoricalData(BaseModel):
    symbol: str
    period: str
    interval: str
    data: List[OHLCV]
    indicators: Optional[Dict[str, List[Optional[float]]]] = None


class ForecastRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    days: int = Field(default=7, ge=1, le=30)
    model: str = Field(default="ensemble", pattern="^(xgboost|arima|lstm|ensemble)$")
    lookback_days: int = Field(default=365, ge=60, le=1825)


class ForecastPoint(BaseModel):
    date: str
    predicted: float
    lower: float
    upper: float


class ModelMetrics(BaseModel):
    mae: Optional[float] = None
    rmse: Optional[float] = None
    mape: Optional[float] = None
    r2: Optional[float] = None
    direction_accuracy: Optional[float] = None
    model_type: str


class ForecastResponse(BaseModel):
    symbol: str
    model_used: str
    forecast_days: int
    last_actual_price: float
    last_actual_date: str
    predictions: List[ForecastPoint]
    metrics: Optional[ModelMetrics] = None
    trend: str  # bullish, bearish, neutral
    confidence_note: str = (
        "These forecasts are educational estimates based on historical patterns. "
        "They are not guaranteed and should not be used as financial advice."
    )
    generated_at: str


class ComparisonStock(BaseModel):
    symbol: str
    name: Optional[str] = None
    current_price: Optional[float] = None
    change_pct: Optional[float] = None
    volume: Optional[int] = None


class ComparisonRequest(BaseModel):
    symbols: List[str] = Field(..., min_items=2, max_items=6)


class ComparisonResponse(BaseModel):
    stocks: List[ComparisonStock]
    historical: Dict[str, List[OHLCV]]
    correlation: Optional[Dict[str, Dict[str, float]]] = None
