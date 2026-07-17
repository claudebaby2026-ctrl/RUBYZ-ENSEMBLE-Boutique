import uuid
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


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
        total=order.total,
    )
    db_order.items = [
        OrderItem(
            product_id=item.productId,
            name=item.name,
            quantity=item.quantity,
            price=item.price,
        )
        for item in order.items
    ]
    db.add(db_order)

    # Keep inventory honest: a placed order should reduce available stock
    # and count towards each product's "sold" tally, the same way it would
    # on any real storefront.
    for item in order.items:
        if item.productId is None:
            continue
        product = db.query(Product).filter(Product.id == item.productId).first()
        if not product:
            continue
        product.stock = max(0, (product.stock or 0) - item.quantity)
        product.sold = (product.sold or 0) + item.quantity
        product.availability = "In stock" if product.stock > 0 else "Out of stock"

    db.commit()
    db.refresh(db_order)
    return db_order


def update_order_status(db: Session, db_order: Order, status: str) -> Order:
    db_order.status = status
    db.commit()
    db.refresh(db_order)
    return db_order


def count_today_orders(db: Session) -> int:
    return db.query(Order).count()


def count_pending_orders(db: Session) -> int:
    return db.query(Order).filter(Order.status == "Pending").count()


def sum_revenue(db: Session) -> int:
    orders = db.query(Order).all()
    return sum(o.total for o in orders)