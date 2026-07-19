from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import order as order_crud
from app.crud.order import OrderError
from app.database import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from app.security import get_current_owner, get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=List[OrderOut])
def list_orders(
    db: Session = Depends(get_db), current_owner: User = Depends(get_current_owner)
):
    # Order details include customer name/phone, so only the owner dashboard
    # can list them.
    return [OrderOut.from_model(o) for o in order_crud.get_orders(db)]


@router.get("/today", response_model=List[OrderOut])
def list_today_orders(
    db: Session = Depends(get_db), current_owner: User = Depends(get_current_owner)
):
    # Same data as `list_orders`, pre-filtered to orders placed today so the
    # dashboard's "today's orders" shortcut actually shows today's orders.
    return [OrderOut.from_model(o) for o in order_crud.get_today_orders(db)]


@router.post("", response_model=OrderOut, status_code=201)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Checkout now requires a signed-in account — the frontend sends the
    # customer's bearer token, and we tie the order to that account.
    #
    # create_order does all price/stock validation server-side (never
    # trusting the client's price/total) and raises OrderError subclasses
    # for anything that should come back as a 400 — e.g. insufficient
    # stock or a product that no longer exists.
    try:
        order = order_crud.create_order(db, payload, user_id=current_user.id)
    except OrderError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return OrderOut.from_model(order)


@router.patch("/{display_id}/status", response_model=OrderOut)
def update_order_status(
    display_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    order = order_crud.get_order_by_display_id(db, display_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order = order_crud.update_order_status(db, order, payload.status)
    return OrderOut.from_model(order)