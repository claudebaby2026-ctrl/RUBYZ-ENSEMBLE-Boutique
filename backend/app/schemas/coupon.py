from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

DISCOUNT_TYPES = ("percent", "flat")


class CouponBase(BaseModel):
    code: str
    discount_type: str = "percent"
    discount_value: int = 0
    active: bool = True
    usage_limit: Optional[int] = None
    expires_at: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        value = value.strip().upper()
        if not value:
            raise ValueError("Code cannot be empty")
        return value

    @field_validator("discount_type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if value not in DISCOUNT_TYPES:
            raise ValueError(f"discount_type must be one of {DISCOUNT_TYPES}")
        return value


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    discount_type: Optional[str] = None
    discount_value: Optional[int] = None
    active: Optional[bool] = None
    usage_limit: Optional[int] = None
    expires_at: Optional[datetime] = None


class CouponOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    discount_type: str
    discount_value: int
    active: bool
    usage_limit: Optional[int]
    used_count: int
    expires_at: Optional[datetime]
    created_at: datetime
