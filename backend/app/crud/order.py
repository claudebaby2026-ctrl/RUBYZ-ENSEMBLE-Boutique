import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


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


def get_order_by_display_id(db: Session, display_id: str) -> Optional[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.display_id == display_id)
        .first()
    )


def create_order(db: Session, order: OrderCreate, user_id: Optional[int] = None) -> Order:
    """Create an order.

    SECURITY: the client-submitted `price` on each item and the overall
    `total` are NEVER trusted — a customer could edit those in devtools
    before hitting POST /orders. Every price is recomputed here from the
    Product row in the database, and the total is the sum of those
    DB-sourced line prices (plus the delivery fee, itself a server-side
    constant, never the client's number).

    Stock is also re-checked here, against a row-locked read of each
    Product, before anything is written. If two checkout requests race for
    the last unit of the same product, `with_for_update()` (on Postgres —
    SQLite has no server-side locking and doesn't need it, being
    effectively single-writer) makes the second request block until the
    first commits, so it sees the already-decremented stock and correctly
    fails instead of overselling.
    """
    if not order.items:
        raise OrderError("Your cart is empty.")

    # A cart can list the same product twice (e.g. two different sizes),
    # and stock is tracked per-product, not per-line — so we must validate
    # against the *summed* requested quantity per product, not each line in
    # isolation.
    requested_qty: Dict[int, int] = {}
    for item in order.items:
        if item.productId is None:
            raise InvalidProductError(product_id=-1)
        if item.quantity < 1:
            raise OrderError(f"Invalid quantity for '{item.name}'.")
        requested_qty[item.productId] = requested_qty.get(item.productId, 0) + item.quantity

    # Lock + validate every distinct product referenced in the order before
    # writing anything.
    products: Dict[int, Product] = {}
    for product_id, qty in requested_qty.items():
        product = (
            db.query(Product)
            .filter(Product.id == product_id)
            .with_for_update()
            .first()
        )
        if not product:
            raise InvalidProductError(product_id)
        available = product.stock or 0
        if qty > available:
            raise OutOfStockError(product.name, available, qty)
        products[product_id] = product

    # Recompute every line price straight from the DB and build the order
    # total from that — the client's `item.price` / `order.total` are
    # ignored entirely.
    subtotal = 0
    order_items: List[OrderItem] = []
    for item in order.items:
        product = products[item.productId]
        line_price = product.price
        subtotal += line_price * item.quantity
        order_items.append(
            OrderItem(
                product_id=item.productId,
                name=item.name,
                quantity=item.quantity,
                price=line_price,
            )
        )

    delivery_fee = settings.DELIVERY_FEE if order.mode == "Delivery" else 0
    total = subtotal + delivery_fee

    display_id = f"#{uuid.uuid4().hex[:6].upper()}"
    db_order = Order(
        display_id=display_id,
        user_id=user_id,
        customer_name=order.customerName,
        phone=order.phone,
        email=order.email,
        address=order.address,
        mode=order.mode,
        status="Pending",
        total=total,
    )
    db_order.items = order_items
    db.add(db_order)

    # Keep inventory honest: a placed order reduces available stock and
    # counts towards each product's "sold" tally. We already validated
    # `qty <= product.stock` above under a row lock, so this can no longer
    # go negative — the old max(0, ...) clamp masked oversells instead of
    # preventing them.
    for product_id, qty in requested_qty.items():
        product = products[product_id]
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