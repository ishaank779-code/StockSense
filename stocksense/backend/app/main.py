from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.database import engine, Base
from app.api import api_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "StockSense — ML Market Analyzer\n\n"
        "Educational tool for historical stock analysis, trend detection and "
        "time-series forecasting using XGBoost, ARIMA and ensemble models.\n\n"
        "**Disclaimer:** All predictions are uncertain estimates for research purposes only. "
        "They are NOT financial advice and should never be used for actual trading decisions."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "disclaimer": (
            "Predictions are educational estimates only. "
            "Not financial advice. Past performance does not guarantee future results."
        ),
        "learn_ml": [
            {
                "title": "Machine Learning Training Course in Delhi",
                "url": "https://uncodemy.com/course/machine-learning-training-course-in-delhi",
            },
            {
                "title": "Machine Learning Training Course in Noida",
                "url": "https://uncodemy.com/course/machine-learning-training-course-in-noida",
            },
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok"}
