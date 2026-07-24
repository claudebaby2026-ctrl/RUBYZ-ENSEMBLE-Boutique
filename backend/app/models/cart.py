from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class CartItem(Base):
    """One line item in a signed-in customer's cart, replacing the old
    localStorage-only cart (see lib/cart.ts on the frontend). Snapshots the
    same fields the old localStorage entry carried (name/image/price/mrp/
    category at add-to-cart time) instead of always joining Product, so
    behavior matches exactly (price shown in cart doesn't silently change
    if the product's price changes later) — same reasoning as OrderItem.

    One row per user/product/size combo; adding the same product+size again
    bumps `quantity` instead of creating a duplicate row.
    """

    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    slug = Column(String, nullable=False)
    name = Column(String, nullable=False)
    image = Column(String, nullable=True)
    price = Column(Integer, nullable=False)
    mrp = Column(Integer, nullable=False)
    size = Column(String, nullable=False)
    stock = Column(Integer, nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    # Product category at add-to-cart time — same purpose as the frontend's
    # CartItem.category (checkout's live shipping-rate lookup).
    category = Column(String, nullable=True)

    user = relationship("User")
    product = relationship("Product")

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", "size", name="uq_cart_user_product_size"),
    )
