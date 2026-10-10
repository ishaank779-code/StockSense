from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.watchlist import Watchlist, WatchlistItem
from app.schemas.watchlist import (
    WatchlistCreate,
    WatchlistOut,
    WatchlistItemCreate,
    WatchlistItemOut,
)
from app.services import stock_service

router = APIRouter()


@router.get("/", response_model=List[WatchlistOut])
def get_watchlists(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    lists = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    result = []
    for wl in lists:
        items_out = []
        for item in wl.items:
            price = None
            change = None
            try:
                info = stock_service.get_stock_info(item.symbol)
                price = info.get("current_price")
                prev = info.get("previous_close")
                if price and prev:
                    change = round((price - prev) / prev * 100, 2)
            except Exception:
                pass
            items_out.append(
                WatchlistItemOut(
                    id=item.id,
                    symbol=item.symbol,
                    company_name=item.company_name,
                    notes=item.notes,
                    added_at=item.added_at,
                    current_price=price,
                    change_pct=change,
                )
            )
        result.append(
            WatchlistOut(
                id=wl.id,
                name=wl.name,
                created_at=wl.created_at,
                items=items_out,
            )
        )
    return result


@router.post("/", response_model=WatchlistOut, status_code=201)
def create_watchlist(
    data: WatchlistCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    wl = Watchlist(user_id=current_user.id, name=data.name)
    db.add(wl)
    db.commit()
    db.refresh(wl)
    return WatchlistOut(id=wl.id, name=wl.name, created_at=wl.created_at, items=[])


@router.post("/{watchlist_id}/items", response_model=WatchlistItemOut, status_code=201)
def add_item(
    watchlist_id: int,
    item: WatchlistItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    wl = (
        db.query(Watchlist)
        .filter(Watchlist.id == watchlist_id, Watchlist.user_id == current_user.id)
        .first()
    )
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    existing = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.watchlist_id == watchlist_id, WatchlistItem.symbol == item.symbol.upper())
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Symbol already in watchlist")

    name = item.company_name
    if not name:
        try:
            info = stock_service.get_stock_info(item.symbol)
            name = info.get("name")
        except Exception:
            name = item.symbol.upper()

    new_item = WatchlistItem(
        watchlist_id=watchlist_id,
        symbol=item.symbol.upper(),
        company_name=name,
        notes=item.notes,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    price = None
    change = None
    try:
        info = stock_service.get_stock_info(new_item.symbol)
        price = info.get("current_price")
        prev = info.get("previous_close")
        if price and prev:
            change = round((price - prev) / prev * 100, 2)
    except Exception:
        pass

    return WatchlistItemOut(
        id=new_item.id,
        symbol=new_item.symbol,
        company_name=new_item.company_name,
        notes=new_item.notes,
        added_at=new_item.added_at,
        current_price=price,
        change_pct=change,
    )


@router.delete("/{watchlist_id}/items/{item_id}", status_code=204)
def remove_item(
    watchlist_id: int,
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    wl = (
        db.query(Watchlist)
        .filter(Watchlist.id == watchlist_id, Watchlist.user_id == current_user.id)
        .first()
    )
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    item = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.id == item_id, WatchlistItem.watchlist_id == watchlist_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return None


@router.delete("/{watchlist_id}", status_code=204)
def delete_watchlist(
    watchlist_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    wl = (
        db.query(Watchlist)
        .filter(Watchlist.id == watchlist_id, Watchlist.user_id == current_user.id)
        .first()
    )
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    db.delete(wl)
    db.commit()
    return None
