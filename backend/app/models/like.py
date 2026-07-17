from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Like(Base):
    """A customer 'liking' (wishlisting) a product. One row per
    user/product pair — the unique constraint prevents duplicate likes."""

    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    # CASCADE so deleting a user or product cleans up their likes
    # automatically instead of blocking the delete with a FK violation.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)

    user = relationship("User")
    product = relationship("Product")

    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_like_user_product"),)
