from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

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