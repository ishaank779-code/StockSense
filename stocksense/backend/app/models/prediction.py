from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from sqlalchemy.types import JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    model_type = Column(String(50), nullable=False)  # xgboost, arima, lstm, ensemble
    forecast_days = Column(Integer, nullable=False)
    predicted_prices = Column(Text, nullable=False)  # list of {date, price, lower, upper}
    metrics = Column(Text, nullable=True)  # mae, rmse, mape etc
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ModelPerformance(Base):
    __tablename__ = "model_performance"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    model_type = Column(String(50), nullable=False)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    r2 = Column(Float, nullable=True)
    direction_accuracy = Column(Float, nullable=True)
    train_samples = Column(Integer, nullable=True)
    test_samples = Column(Integer, nullable=True)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
