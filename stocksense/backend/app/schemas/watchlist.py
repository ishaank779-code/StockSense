from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class WatchlistItemCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    company_name: Optional[str] = None
    notes: Optional[str] = None


class WatchlistItemOut(BaseModel):
    id: int
    symbol: str
    company_name: Optional[str] = None
    notes: Optional[str] = None
    added_at: Optional[datetime] = None
    current_price: Optional[float] = None
    change_pct: Optional[float] = None

    class Config:
        from_attributes = True


class WatchlistCreate(BaseModel):
    name: str = Field(default="My Watchlist", max_length=100)


class WatchlistOut(BaseModel):
    id: int
    name: str
    created_at: Optional[datetime] = None
    items: List[WatchlistItemOut] = []

    class Config:
        from_attributes = True
