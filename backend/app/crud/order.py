import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.crud import coupon as coupon_crud
from app.crud.coupon import CouponValidationError
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderItemCreate
from app.services.payments import verify_razorpay_signature


class OrderError(Exception):
    """Base class for order-creation failures that should surface to the
    client as a 400 Bad Request. Routers catch this and translate it into
    an HTTPException so this module doesn't need to import FastAPI."""


class InvalidProductError(OrderError):
    def __init__(self, product_id: int):
        self.product_id = product_id
        super().__init__(
            f"Product #{product_id} no longer exists or is unavailable."
        )


class OutOfStockError(OrderError):
    def __init__(self, product_name: str, available: int, requested: int):
        self.product_name = product_name
        self.available = available
        self.requested = requested
        super().__init__(
            f"Only {available} unit(s) of '{product_name}' left in stock "
            f"(you requested {requested})."
        )


class CouponError(OrderError):
    """Wraps a CouponValidationError so an invalid/expired/inactive/
    limit-reached coupon at checkout surfaces as the same 400 the client
    would have seen from GET /coupons/validate/{code} — never silently
    ignored, and never trusted from the client either."""


class PaymentVerificationError(OrderError):
    """Raised when the Razorpay payment signature on an order-creation
    request doesn't check out. This is the difference between "someone
    paid" and "someone claims they paid" — a client could otherwise POST
    /orders with a made-up razorpayPaymentId and get free stock."""

    def __init__(self) -> None:
        super().__init__(
            "We couldn't verify this payment. If money was deducted, it "
            "will be auto-refunded by Razorpay within a few days — please "
            "contact us if it isn't."
        )


def _today_range_utc() -> tuple[datetime, datetime]:
    """Return the [start, end) UTC window for "today".

    Orders are timestamped in UTC (see Order.created_at), so we bucket
    "today" using UTC day boundaries to match what's actually stored.
    """
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end


def get_orders(db: Session) -> List[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.id.desc())
        .all()
    )


def get_orders_for_user(db: Session, user_id: int) -> List[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user_id)
        .order_by(Order.id.desc())
        .all()
    )


def get_order_by_display_id(db: Session, display_id: str) -> Optional[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.display_id == display_id)
        .first()
    )


def get_order_by_razorpay_payment_id(db: Session, razorpay_payment_id: str) -> Optional[Order]:
    """Look up an existing order created from this exact Razorpay payment.

    Used by create_order() to make order creation idempotent: the same
    successful-payment payload submitted twice (retry after a timeout,
    double-click, deliberate replay) must produce exactly one Order, not
    two, and not a 400 error on the retry either.
    """
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.razorpay_payment_id == razorpay_payment_id)
        .first()
    )


class _PricedCart:
    __slots__ = ("subtotal", "discount", "total", "products", "requested_qty", "coupon")

    def __init__(self, subtotal, discount, total, products, requested_qty, coupon):
        self.subtotal = subtotal
        self.discount = discount
        self.total = total
        self.products = products
        self.requested_qty = requested_qty
        self.coupon = coupon


def price_cart(
    db: Session,
    items: List[OrderItemCreate],
    mode: str,
    coupon_code: Optional[str],
    lock: bool,
) -> _PricedCart:
    """Validate stock and price a cart entirely from the DB — shared by
    POST /payments/create-razorpay-order (to know what to charge) and
    create_order() below (to know what was actually owed at the moment the
    order is written). The client's own prices/total are never consulted.

    `lock` selects row-locked reads (`with_for_update`) so writers block
    each other. Use lock=True only right before actually writing the
    order/decrementing stock (in create_order) — using it for the
    Razorpay-order preview too would hold locks for as long as the
    customer takes to complete the Razorpay checkout modal, which could be
    minutes.
    """
    if not items:
        raise OrderError("Your cart is empty.")

    # A cart can list the same product twice (e.g. two different sizes),
    # and stock is tracked per-product, not per-line — so we must validate
    # against the *summed* requested quantity per product, not each line in
    # isolation.
    requested_qty: Dict[int, int] = {}
    for item in items:
        if item.productId is None:
            raise InvalidProductError(product_id=-1)
        if item.quantity < 1:
            raise OrderError(f"Invalid quantity for '{item.name}'.")
        requested_qty[item.productId] = requested_qty.get(item.productId, 0) + item.quantity

    products: Dict[int, Product] = {}
    for product_id, qty in requested_qty.items():
        query = db.query(Product).filter(Product.id == product_id)
        if lock:
            query = query.with_for_update()
        product = query.first()
        if not product:
            raise InvalidProductError(product_id)
        available = product.stock or 0
        if qty > available:
            raise OutOfStockError(product.name, available, qty)
        products[product_id] = product

    # Recompute every line price straight from the DB — the client's
    # `item.price` is ignored entirely.
    subtotal = 0
    for item in items:
        subtotal += products[item.productId].price * item.quantity

    # Coupon: re-validate server-side against the exact same rules as
    # GET /coupons/validate/{code} (active / not expired / under its usage
    # limit) — the client only ever sends the *code*, never a discount
    # amount, so there's nothing from the client to trust here. The
    # discount itself is computed from the DB-sourced `subtotal` above,
    # not anything the client sent.
    coupon = None
    discount = 0
    if coupon_code:
        try:
            coupon = coupon_crud.validate_coupon(db, coupon_code, for_update=lock)
        except CouponValidationError as exc:
            raise CouponError(str(exc)) from exc
        if coupon.discount_type == "flat":
            discount = coupon.discount_value
        else:
            discount = (subtotal * coupon.discount_value) // 100
        # Never let a coupon push the subtotal below zero (e.g. a flat
        # discount larger than the cart).
        discount = max(0, min(discount, subtotal))

    delivery_fee = settings.DELIVERY_FEE if mode == "Delivery" else 0
    total = subtotal - discount + delivery_fee

    return _PricedCart(subtotal, discount, total, products, requested_qty, coupon)


def create_order(
    db: Session,
    order: OrderCreate,
    user_id: Optional[int] = None,
    *,
    verify_signature: bool = True,
) -> Order:
    """Verify the Razorpay payment, then create the order.

    `verify_signature` defaults to True for the normal POST /orders path,
    where `order.razorpaySignature` is the checkout.js value proving *this
    browser* completed payment (HMAC of order_id+payment_id, keyed with
    RAZORPAY_KEY_SECRET). Pass verify_signature=False only from the
    payment.captured webhook (app/routers/payments.py::razorpay_webhook),
    which has no such value to check — checkout.js never hands it to
    anything but the frontend — and instead authenticates itself via its
    own HMAC over the whole webhook body, keyed with a *different* secret
    (RAZORPAY_WEBHOOK_SECRET). That check happens before create_order() is
    ever called, so skipping the signature check here isn't skipping
    verification — it's not re-running a check that was already done a
    different, equally valid way.

    SECURITY: the client-submitted `price` on each item and the overall
    `total` are NEVER trusted — a customer could edit those in devtools
    before hitting POST /orders. Every price is recomputed here from the
    Product row in the database, and the total is the sum of those
    DB-sourced line prices (plus the delivery fee, itself a server-side
    constant, never the client's number). Similarly, payment success is
    never taken on the client's word — razorpaySignature is verified
    against Razorpay's own HMAC before anything is written (see
    app/services/payments.py).

    Stock is also re-checked here, against a row-locked read of each
    Product, before anything is written. If two checkout requests race for
    the last unit of the same product, `with_for_update()` (on Postgres —
    SQLite has no server-side locking and doesn't need it, being
    effectively single-writer) makes the second request block until the
    first commits, so it sees the already-decremented stock and correctly
    fails instead of overselling.

    IDEMPOTENCY: a given razorpayPaymentId must only ever produce one
    order — the same successful-payment payload can otherwise arrive
    twice (a client retry after a timeout, a double-click, or a
    deliberate replay) and would, without this check, create two orders
    and decrement stock twice for a single payment. If an order already
    exists for this payment, that existing order is returned as-is (a
    legitimate retry should look like success to the client, not a 400).

    This is checked twice:
      1. Once up front, before any pricing/stock work, so the common case
         (a retry arriving after the first request already committed)
         short-circuits immediately without touching stock at all.
      2. Once again after price_cart() has taken its row lock(s) on the
         affected Product rows. Two duplicate requests for the same
         payment necessarily target the same products, so the second
         request's price_cart() call only proceeds past its lock once the
         first request has committed (or rolled back) — which means this
         second check is the one that actually closes the race: without
         it, two concurrent duplicate requests could both pass check #1
         before either had committed, then both fall through to create an
         order and decrement stock a second time.
    """
    # Verify the payment BEFORE touching stock/coupons/DB rows. A forged
    # or tampered signature never gets this far. Safe to do before either
    # idempotency check: verification has no side effects, so verifying a
    # retry's already-valid signature a second time is harmless.
    if verify_signature and not verify_razorpay_signature(
        order.razorpayOrderId, order.razorpayPaymentId, order.razorpaySignature
    ):
        raise PaymentVerificationError()

    existing = get_order_by_razorpay_payment_id(db, order.razorpayPaymentId)
    if existing:
        return existing

    priced = price_cart(db, order.items, order.mode, order.couponCode, lock=True)

    # Re-check now that price_cart() holds a row lock on every Product this
    # order touches (see docstring above for why this closes the race that
    # check #1 alone can't).
    existing = get_order_by_razorpay_payment_id(db, order.razorpayPaymentId)
    if existing:
        return existing

    order_items: List[OrderItem] = [
        OrderItem(
            product_id=item.productId,
            name=item.name,
            quantity=item.quantity,
            price=priced.products[item.productId].price,
        )
        for item in order.items
    ]

    display_id = f"#{uuid.uuid4().hex[:6].upper()}"
    db_order = Order(
        display_id=display_id,
        user_id=user_id,
        customer_name=order.customerName,
        phone=order.phone,
        email=order.email,
        address=order.address,
        billing_pincode=order.pincode,
        billing_city=order.city,
        billing_state=order.state,
        mode=order.mode,
        status="Pending",
        total=priced.total,
        coupon_code=priced.coupon.code if priced.coupon else None,
        discount=priced.discount,
        payment_status="paid",
        razorpay_order_id=order.razorpayOrderId,
        razorpay_payment_id=order.razorpayPaymentId,
    )
    db_order.items = order_items
    db.add(db_order)

    # Only now that the order is guaranteed to be created do we count the
    # coupon as used — folded into the same transaction/commit as the order
    # and stock updates below, so a coupon's used_count can never increment
    # without a matching order actually existing.
    if priced.coupon:
        coupon_crud.increment_usage(db, priced.coupon)

    # Keep inventory honest: a placed order reduces available stock and
    # counts towards each product's "sold" tally. We already validated
    # `qty <= product.stock` above under a row lock, so this can no longer
    # go negative — the old max(0, ...) clamp masked oversells instead of
    # preventing them.
    for product_id, qty in priced.requested_qty.items():
        product = priced.products[product_id]
        product.stock = (product.stock or 0) - qty
        product.sold = (product.sold or 0) + qty
        product.availability = "In stock" if product.stock > 0 else "Out of stock"

    db.commit()
    db.refresh(db_order)
    return db_order


def update_order_status(db: Session, db_order: Order, status: str) -> Order:
    db_order.status = status
    db.commit()
    db.refresh(db_order)
    return db_order


def get_today_orders(db: Session) -> List[Order]:
    start, end = _today_range_utc()
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.created_at >= start, Order.created_at < end)
        .order_by(Order.id.desc())
        .all()
    )


def count_today_orders(db: Session) -> int:
    start, end = _today_range_utc()
    return (
        db.query(Order)
        .filter(Order.created_at >= start, Order.created_at < end)
        .count()
    )


def count_pending_orders(db: Session) -> int:
    return db.query(Order).filter(Order.status == "Pending").count()


def sum_revenue(db: Session) -> int:
    orders = db.query(Order).all()
    return sum(o.total for o in orders)