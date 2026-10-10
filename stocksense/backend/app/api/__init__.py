from fastapi import APIRouter
from app.api import auth, stocks, watchlist, performance

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
api_router.include_router(watchlist.router, prefix="/watchlist", tags=["Watchlist"])
api_router.include_router(performance.router, prefix="/performance", tags=["Performance"])
