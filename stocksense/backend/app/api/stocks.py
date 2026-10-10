from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from app.schemas.stock import (
    StockInfo,
    HistoricalData,
    ForecastRequest,
    ForecastResponse,
    ForecastPoint,
    ModelMetrics,
    ComparisonRequest,
    ComparisonResponse,
)
from app.services import stock_service

router = APIRouter()


@router.get("/search")
def search_stocks(q: str = Query("", max_length=50)):
    return stock_service.search_symbols(q)


@router.get("/info/{symbol}", response_model=StockInfo)
def stock_info(symbol: str):
    try:
        data = stock_service.get_stock_info(symbol)
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Could not fetch info for {symbol}: {str(e)}")


@router.get("/historical/{symbol}", response_model=HistoricalData)
def historical(
    symbol: str,
    period: str = Query("1y", pattern="^(1mo|3mo|6mo|1y|2y|5y|max)$"),
    interval: str = Query("1d", pattern="^(1d|1wk|1mo)$"),
):
    try:
        return stock_service.get_historical(symbol, period=period, interval=interval)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")


@router.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    try:
        result = stock_service.run_forecast(
            symbol=req.symbol,
            days=req.days,
            model=req.model,
            lookback_days=req.lookback_days,
        )
        metrics = None
        if result.get("metrics"):
            m = result["metrics"]
            metrics = ModelMetrics(
                mae=m.get("mae"),
                rmse=m.get("rmse"),
                mape=m.get("mape"),
                r2=m.get("r2"),
                direction_accuracy=m.get("direction_accuracy"),
                model_type=m.get("model_type", req.model),
            )
        return ForecastResponse(
            symbol=result["symbol"],
            model_used=result["model_used"],
            forecast_days=result["forecast_days"],
            last_actual_price=result["last_actual_price"],
            last_actual_date=result["last_actual_date"],
            predictions=[ForecastPoint(**p) for p in result["predictions"]],
            metrics=metrics,
            trend=result["trend"],
            confidence_note=result["confidence_note"],
            generated_at=result["generated_at"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


@router.post("/compare", response_model=ComparisonResponse)
def compare(req: ComparisonRequest):
    try:
        result = stock_service.compare_stocks(req.symbols)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/popular")
def popular_stocks():
    symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "JPM"]
    results = []
    for s in symbols:
        try:
            info = stock_service.get_stock_info(s)
            results.append(info)
        except Exception:
            results.append({"symbol": s, "name": s})
    return results
