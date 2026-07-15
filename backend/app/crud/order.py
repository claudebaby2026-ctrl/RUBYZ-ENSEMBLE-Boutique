import uuid
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem
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


def create_order(db: Session, order: OrderCreate) -> Order:
    display_id = f"#{uuid.uuid4().hex[:6].upper()}"
    db_order = Order(
        display_id=display_id,
        customer_name=order.customerName,
        phone=order.phone,
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
