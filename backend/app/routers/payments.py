from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.order import OrderError, price_cart
from app.database import get_db
from app.models.user import User
from app.schemas.order import RazorpayOrderCreate, RazorpayOrderOut
from app.security import get_current_user
from app.services.payments import (
    RazorpayApiError,
    RazorpayNotConfiguredError,
    create_razorpay_order,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/create-razorpay-order", response_model=RazorpayOrderOut)
def create_order_for_payment(
    payload: RazorpayOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Step 1 of checkout: price the cart from the DB (never the client's
    numbers) and open a matching Razorpay order. The frontend hands the
    returned razorpayOrderId straight to checkout.js. Nothing is written
    to our own `orders` table yet — that only happens in POST /orders,
    once payment is verified (see crud/order.py::create_order) — so an
    abandoned Razorpay checkout never leaves a stray row or decremented
    stock behind.
    """
    try:
        priced = price_cart(db, payload.items, payload.mode, payload.couponCode, lock=False)
    except OrderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if priced.total <= 0:
        raise HTTPException(status_code=400, detail="Order total must be greater than zero.")

    try:
        rp_order = create_razorpay_order(
            amount_rupees=priced.total, receipt=f"user{current_user.id}-{priced.total}"
        )
    except RazorpayNotConfiguredError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except RazorpayApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return RazorpayOrderOut(
        razorpayOrderId=rp_order["id"],
        amount=rp_order["amount"],
        currency=rp_order["currency"],
        keyId=settings.RAZORPAY_KEY_ID,
    )