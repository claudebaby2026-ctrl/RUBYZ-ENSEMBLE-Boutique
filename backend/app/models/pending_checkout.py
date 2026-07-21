from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class PendingCheckout(Base):
    """Snapshot of a cart + customer details taken the moment a Razorpay
    order is opened (POST /payments/create-razorpay-order), before payment
    happens. Exists so the payment.captured webhook (to be added in
    app/routers/payments.py) can reconstruct and create an Order even if
    the customer's browser never makes it back to POST /orders after
    paying.

    Looked up by razorpay_order_id, which Razorpay includes in every
    webhook payload alongside the payment. `consumed` flips to True once
    an Order has actually been created from it (by either the normal
    POST /orders flow or the webhook fallback), so it's never used twice.
    """

    __tablename__ = "pending_checkouts"

    id = Column(Integer, primary_key=True, index=True)
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # JSON-serialized RazorpayOrderCreate (+ customer fields) — see
    # app/crud/pending_checkout.py::save_pending_checkout.
    snapshot = Column(Text, nullable=False)
    consumed = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
