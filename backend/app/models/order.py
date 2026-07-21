from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    display_id = Column(String, unique=True, index=True, nullable=False)
    # Orders now require a signed-in customer, so every order is tied to
    # the account that placed it (nullable so pre-existing rows still load).
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    mode = Column(String, default="Delivery")
    status = Column(String, default="Pending")
    total = Column(Integer, default=0)
    # Coupon applied at checkout, if any. Both are set together server-side
    # in crud/order.py::create_order — `total` above is already net of
    # `discount`, this just records what produced that number.
    coupon_code = Column(String, nullable=True)
    discount = Column(Integer, default=0, nullable=False)
    # --- Razorpay payment tracking ---
    # payment_status is separate from `status` (order fulfillment status:
    # Pending/Confirmed/Shipped/...) — this tracks the payment lifecycle
    # itself. "paid" is only ever set after the signature verification in
    # crud/order.py::create_order succeeds, so its presence is proof the
    # payment was verified server-side, never just client-reported.
    payment_status = Column(String, default="paid", nullable=False)
    razorpay_order_id = Column(String, nullable=True)
    # unique=True enforces the payment-replay fix at the DB level: a given
    # Razorpay payment can only ever back one Order row. Nullable is kept
    # (older/non-Razorpay rows may have it null) — a unique index treats
    # multiple NULLs as distinct on both SQLite and Postgres, so it never
    # blocks a second null. See app/crud/order.py::create_order for the
    # app-level idempotency check that makes retries return the existing
    # order instead of hitting this constraint as an error, and
    # app/migrations.py for how existing databases get the index added.
    razorpay_payment_id = Column(String, unique=True, index=True, nullable=True)
    # --- Structured billing address (Shiprocket needs these as discrete
    # fields — the free-text `address` column above can't be reliably
    # parsed into pincode/city/state). Populated at checkout when
    # mode == "Delivery"; nullable so pickup-mode/pre-existing orders still
    # load fine.
    billing_pincode = Column(String, nullable=True)
    billing_city = Column(String, nullable=True)
    billing_state = Column(String, nullable=True)
    # --- Shiprocket shipment tracking ---
    # shipment_status: "not_created" (default) -> "pending" (background
    # task scheduled/running) -> "created" (Shiprocket accepted it) or
    # "failed" (background task or manual retry errored — see
    # app/routers/orders.py and app/routers/shipping.py). This is
    # deliberately a separate column from `status` (fulfillment status,
    # e.g. Pending/Confirmed/Shipped) — see crud/shipment.py for how a
    # Shiprocket webhook update maps onto `status` where sensible, instead
    # of the owner having to cross-reference two independent status values.
    shiprocket_order_id = Column(String, nullable=True)
    shiprocket_shipment_id = Column(String, nullable=True)
    awb_code = Column(String, nullable=True)
    courier_name = Column(String, nullable=True)
    shipment_status = Column(String, default="not_created", nullable=False)
    # When the order was placed. `default` guarantees every ORM insert sets
    # this (needed because databases migrated by app/migrations.py may not
    # have a DB-level DEFAULT on this column — see there for why), while
    # `server_default` covers rows inserted outside the ORM.
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    name = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    price = Column(Integer, default=0)

    order = relationship("Order", back_populates="items")