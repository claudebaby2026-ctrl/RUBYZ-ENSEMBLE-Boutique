from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import order as order_crud
from app.database import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from app.security import get_current_owner

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=List[OrderOut])
def list_orders(
    db: Session = Depends(get_db), current_owner: User = Depends(get_current_owner)
):
    # Order details include customer name/phone, so only the owner dashboard
    # can list them.
    return [OrderOut.from_model(o) for o in order_crud.get_orders(db)]


@router.post("", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # Left open for guest checkout (storefront cart/checkout isn't wired to
    # customer accounts yet) — anyone can place an order, same as any public
    # e-commerce checkout form.
    order = order_crud.create_order(db, payload)
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
