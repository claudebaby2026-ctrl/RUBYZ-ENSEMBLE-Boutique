from typing import List

from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.user import User


def get_customer_summaries(db: Session) -> List[dict]:
    """Builds one row per customer account, aggregating their order history.

    There's no separate "customers" table — every signed-in checkout ties
    an Order to the User who placed it, so customers + their stats can be
    derived straight from those two tables.
    """
    customers = db.query(User).filter(User.role == "customer").order_by(User.id.desc()).all()
    summaries: List[dict] = []
    for customer in customers:
        orders = (
            db.query(Order)
            .filter(Order.user_id == customer.id)
            .order_by(Order.created_at.desc())
            .all()
        )
        summaries.append(
            {
                "id": customer.id,
                "name": customer.name,
                "email": customer.email,
                "phone": customer.phone,
                "ordersCount": len(orders),
                "totalSpent": sum(o.total for o in orders),
                "lastOrderAt": orders[0].created_at.isoformat() if orders else None,
            }
        )
    return summaries
