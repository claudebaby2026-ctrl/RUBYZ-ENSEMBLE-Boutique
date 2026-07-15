from sqlalchemy import Boolean, Column, Float, Integer, String
from sqlalchemy.types import JSON

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    fabric = Column(String, nullable=False)
    occasion = Column(String, nullable=False)
    color = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    mrp = Column(Integer, nullable=False)
    rating = Column(Float, default=0.0)
    sold = Column(Integer, default=0)
    stock = Column(Integer, default=0)
    badge = Column(String, default="")
    description = Column(String, default="")
    care = Column(JSON, default=list)
    sizes = Column(JSON, default=list)
    availability = Column(String, default="In stock")
    is_featured = Column(Boolean, default=False)
    is_new = Column(Boolean, default=False)
    is_bestseller = Column(Boolean, default=False)
