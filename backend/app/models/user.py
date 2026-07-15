from sqlalchemy import Column, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, default="")
    hashed_password = Column(String, nullable=False)
    # "owner" -> full access to the admin dashboard & CRUD endpoints.
    # "customer" -> storefront account (checkout, order history later).
    role = Column(String, default="customer", nullable=False)
