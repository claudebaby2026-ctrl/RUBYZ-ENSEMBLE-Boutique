from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import order as order_crud
from app.crud.order import OrderError
from app.database import get_db
from app.models.user import User
from app.schemas.order import ManualOrderCreate, OrderCreate, OrderOut, OrderStatusUpdate
from app.security import get_current_owner, get_current_user
from app.services.shipment_creation import create_shipment_background, order_is_shippable

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/me", response_model=List[OrderOut])
def list_my_orders(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Customer-only — returns the signed-in customer's own orders, newest
    # first. Placed before any /orders/{id}-style route so a literal "me"
    # path segment is never swallowed by a path-param route.
    return [OrderOut.from_model(o) for o in order_crud.get_orders_for_user(db, current_user.id)]


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
    background_tasks: BackgroundTasks,
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

    # Shipment creation happens in the background, never synchronously in
    # the checkout request — a Shiprocket failure must never affect the
    # already-paid order. Skipped entirely for Pickup-mode orders or
    # orders made up entirely of Tailoring Services items (see
    # app/services/shipment_creation.py).
    if order_is_shippable(order, db):
        background_tasks.add_task(create_shipment_background, order.id)

    return OrderOut.from_model(order)


@router.post("/manual", response_model=OrderOut, status_code=201)
def create_manual_order(
    payload: ManualOrderCreate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    # Owner-only: logs an order the owner has already confirmed with the
    # customer over WhatsApp (or in person) — no payment gateway or
    # shipment automation involved. Stock is still validated and
    # decremented through the same row-locked price_cart() path as the
    # old automated checkout, so this is what keeps online and in-person
    # inventory from double-selling a limited-stock item.
    try:
        order = order_crud.create_manual_order(db, payload)
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