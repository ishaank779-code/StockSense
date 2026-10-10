from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json

from app.core.database import get_db
from app.models.prediction import ModelPerformance, Prediction
from app.services import stock_service

router = APIRouter()


class PerformanceOut(BaseModel):
    id: int
    symbol: str
    model_type: str
    mae: Optional[float]
    rmse: Optional[float]
    mape: Optional[float]
    r2: Optional[float]
    direction_accuracy: Optional[float]
    train_samples: Optional[int]
    test_samples: Optional[int]
    evaluated_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/models", response_model=List[PerformanceOut])
def list_performance(
    symbol: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(ModelPerformance).order_by(ModelPerformance.evaluated_at.desc())
    if symbol:
        q = q.filter(ModelPerformance.symbol == symbol.upper())
    return q.limit(limit).all()


@router.post("/evaluate/{symbol}")
def evaluate_model(symbol: str, model: str = "ensemble", db: Session = Depends(get_db)):
    """Run a forecast and store performance metrics for the dashboard."""
    try:
        result = stock_service.run_forecast(symbol, days=7, model=model)
        metrics = result.get("metrics") or {}
        record = ModelPerformance(
            symbol=symbol.upper(),
            model_type=metrics.get("model_type", model),
            mae=metrics.get("mae"),
            rmse=metrics.get("rmse"),
            mape=metrics.get("mape"),
            r2=metrics.get("r2"),
            direction_accuracy=metrics.get("direction_accuracy"),
            train_samples=metrics.get("train_samples"),
            test_samples=metrics.get("test_samples"),
        )
        db.add(record)

        # Also store the prediction
        pred = Prediction(
            symbol=symbol.upper(),
            model_type=result["model_used"],
            forecast_days=result["forecast_days"],
            predicted_prices=json.dumps(result["predictions"]),
            metrics=json.dumps(metrics) if metrics else None,
        )
        db.add(pred)
        db.commit()
        db.refresh(record)
        return {
            "message": "Evaluation stored",
            "performance": {
                "id": record.id,
                "symbol": record.symbol,
                "model_type": record.model_type,
                "mae": record.mae,
                "rmse": record.rmse,
                "mape": record.mape,
                "r2": record.r2,
                "direction_accuracy": record.direction_accuracy,
            },
            "forecast_preview": result["predictions"][:3],
            "trend": result["trend"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
def performance_summary(db: Session = Depends(get_db)):
    records = db.query(ModelPerformance).order_by(ModelPerformance.evaluated_at.desc()).limit(100).all()
    if not records:
        return {
            "total_evaluations": 0,
            "by_model": {},
            "avg_metrics": {},
            "recent": [],
        }

    by_model = {}
    for r in records:
        by_model.setdefault(r.model_type, []).append(r)

    avg_metrics = {}
    for model_type, items in by_model.items():
        avg_metrics[model_type] = {
            "count": len(items),
            "avg_mae": round(sum(i.mae or 0 for i in items) / len(items), 4),
            "avg_rmse": round(sum(i.rmse or 0 for i in items) / len(items), 4),
            "avg_mape": round(sum(i.mape or 0 for i in items) / len(items), 2),
            "avg_direction_accuracy": round(
                sum(i.direction_accuracy or 0 for i in items) / len(items), 2
            ),
        }

    return {
        "total_evaluations": len(records),
        "by_model": avg_metrics,
        "recent": [
            {
                "symbol": r.symbol,
                "model_type": r.model_type,
                "mae": r.mae,
                "rmse": r.rmse,
                "mape": r.mape,
                "direction_accuracy": r.direction_accuracy,
                "evaluated_at": r.evaluated_at.isoformat() if r.evaluated_at else None,
            }
            for r in records[:10]
        ],
    }
