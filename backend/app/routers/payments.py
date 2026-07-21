import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.crud import order as order_crud
from app.crud import pending_checkout as pending_checkout_crud
from app.crud.order import OrderError, price_cart
from app.database import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, RazorpayOrderCreate, RazorpayOrderOut
from app.security import get_current_user
from app.services.payments import (
    RazorpayApiError,
    RazorpayNotConfiguredError,
    create_razorpay_order,
)
from app.services.shipment_creation import create_shipment_background, order_is_shippable

logger = logging.getLogger(__name__)

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

    # Snapshot the cart + whatever customer details were sent, keyed by
    # this Razorpay order id. If the browser never makes it back to
    # POST /orders after paying, the payment.captured webhook uses this
    # to create the order anyway. Never fatal — a snapshot failure here
    # must not block checkout, which already works without it.
    try:
        pending_checkout_crud.save_pending_checkout(
            db, rp_order["id"], payload, user_id=current_user.id
        )
    except Exception:
        pass

    return RazorpayOrderOut(
        razorpayOrderId=rp_order["id"],
        amount=rp_order["amount"],
        currency=rp_order["currency"],
        keyId=settings.RAZORPAY_KEY_ID,
    )


@router.post("/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    x_razorpay_signature: str | None = Header(default=None, alias="X-Razorpay-Signature"),
):
    """Public, verified via the shared RAZORPAY_WEBHOOK_SECRET (Razorpay
    Dashboard -> Settings -> Webhooks). Fallback path for "payment.captured"
    events: if the customer's browser makes it back to POST /orders on its
    own, that request creates the order and this webhook later finds
    nothing left to do (idempotency check #1 below). This route only
    matters when the browser never makes it back — network drop, tab
    closed, app killed mid-redirect — after Razorpay already captured the
    money.

    Note this HMAC is over the *whole webhook body*, keyed with
    RAZORPAY_WEBHOOK_SECRET — a completely different check from the
    order_id+payment_id HMAC that checkout.js's razorpaySignature carries,
    keyed with RAZORPAY_KEY_SECRET (see app/services/payments.py). A
    webhook payload never contains that second signature, so this route
    authenticates itself here and tells create_order() to skip its own
    (inapplicable) signature check via verify_signature=False.
    """
    if not settings.RAZORPAY_WEBHOOK_ENABLED:
        raise HTTPException(status_code=503, detail="Razorpay webhook not configured")

    raw_body = await request.body()
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    if not x_razorpay_signature or not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = json.loads(raw_body)
    if payload.get("event") != "payment.captured":
        # Only "payment.captured" reconstructs an order — everything else
        # (e.g. "payment.failed", "order.paid") is a 2xx no-op so Razorpay
        # doesn't retry it.
        return {"status": "ignored"}

    try:
        entity = payload["payload"]["payment"]["entity"]
        razorpay_order_id = entity["order_id"]
        razorpay_payment_id = entity["id"]
    except (KeyError, TypeError) as exc:
        logger.warning("Malformed payment.captured webhook payload: %s", exc)
        return {"status": "ignored"}

    # 1. Idempotency: the common case is that POST /orders already beat
    # this webhook to it (Razorpay can take a little while to deliver a
    # webhook, and most browsers do make it back fine). Reuse the same
    # unique-constraint-backed lookup create_order() itself uses.
    existing = order_crud.get_order_by_razorpay_payment_id(db, razorpay_payment_id)
    if existing:
        return {"status": "ok", "already_exists": True}

    # 2. Find the snapshot taken at checkout-open time.
    pending = pending_checkout_crud.get_pending_checkout(db, razorpay_order_id)
    if not pending or pending.consumed:
        # Nothing to reconstruct from — e.g. a checkout that predates this
        # feature, or a replayed webhook for an order the other path
        # already created and marked consumed (step 1 above should
        # already have caught that second case, but this is a harmless
        # backstop).
        logger.warning(
            "No usable pending checkout for razorpay_order_id=%s", razorpay_order_id
        )
        return {"status": "ignored"}

    snapshot = json.loads(pending.snapshot)
    # This snapshot has no razorpaySignature (it was taken before payment
    # happened) and never will — checkout.js only hands that value to the
    # frontend, which is exactly the path that failed to arrive here. The
    # X-Razorpay-Signature check above is this route's own equivalent
    # proof of authenticity, so create_order() is told to skip its
    # (inapplicable) signature check rather than being fed a fake one.
    order_create = OrderCreate(
        customerName=snapshot.get("customerName") or "Customer",
        phone=snapshot.get("phone") or "",
        email=snapshot.get("email"),
        address=snapshot.get("address"),
        pincode=snapshot.get("pincode"),
        city=snapshot.get("city"),
        state=snapshot.get("state"),
        mode=snapshot.get("mode", "Delivery"),
        items=snapshot["items"],
        total=0,  # ignored by create_order — it recomputes from DB
        couponCode=snapshot.get("couponCode"),
        razorpayOrderId=razorpay_order_id,
        razorpayPaymentId=razorpay_payment_id,
        razorpaySignature="__webhook__",  # unused — verify_signature=False
    )
    try:
        order = order_crud.create_order(
            db, order_create, user_id=pending.user_id, verify_signature=False
        )
    except OrderError as exc:
        # Stock ran out / coupon became invalid / etc between checkout-open
        # and now. Nothing more this webhook can do — the payment was
        # captured but the cart it was for is no longer fulfillable.
        # Razorpay auto-refunds captured payments that are never settled
        # against an order on our side within their usual window; this is
        # the same "rare but possible" case POST /orders already documents
        # (see docs/API.md).
        db.rollback()
        logger.error(
            "payment.captured webhook could not create order for "
            "razorpay_order_id=%s: %s",
            razorpay_order_id,
            exc,
        )
        return {"status": "ignored"}

    pending_checkout_crud.mark_consumed(db, pending)

    if order_is_shippable(order, db):
        background_tasks.add_task(create_shipment_background, order.id)

    return {"status": "ok", "order_id": order.display_id}