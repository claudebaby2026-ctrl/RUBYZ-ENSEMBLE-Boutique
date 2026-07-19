from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    discount_type = Column(String, default="percent", nullable=False)  # "percent" | "flat"
    discount_value = Column(Integer, default=0, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    usage_limit = Column(Integer, nullable=True)  # None = unlimited
    used_count = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
