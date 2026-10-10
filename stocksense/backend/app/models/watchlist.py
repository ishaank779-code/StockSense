from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False, default="My Watchlist")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")
    user = relationship("User")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), nullable=False)
    symbol = Column(String(20), nullable=False, index=True)
    company_name = Column(String(255), nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(500), nullable=True)

    watchlist = relationship("Watchlist", back_populates="items")
