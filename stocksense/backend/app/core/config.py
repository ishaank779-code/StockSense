from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "StockSense"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database - MySQL (change for production)
    # For local demo we also support SQLite fallback
    DATABASE_URL: str = "mysql+pymysql://stocksense:stocksense123@localhost:3306/stocksense"
    # Fallback SQLite for easy local run without MySQL
    DATABASE_URL_SQLITE: str = "sqlite:////tmp/stocksense.db"
    USE_SQLITE: bool = True  # Set False when MySQL is available

    # JWT
    SECRET_KEY: str = "stocksense-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    # ML
    DEFAULT_FORECAST_DAYS: int = 7
    MAX_FORECAST_DAYS: int = 30
    DEFAULT_LOOKBACK_DAYS: int = 365

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
