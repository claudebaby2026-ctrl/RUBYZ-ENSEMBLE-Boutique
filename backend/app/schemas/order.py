from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class OrderItemCreate(BaseModel):
    productId: Optional[int] = None
    name: str
    quantity: int = 1
    price: int


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    quantity: int
    price: int


class OrderCreate(BaseModel):
    customerName: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    mode: str = "Delivery"
    items: List[OrderItemCreate]
    total: int
    # Optional coupon code from checkout. NEVER trust a client-computed
    # discount — only the code is accepted here; create_order re-validates
    # it server-side (same rules as GET /coupons/validate/{code}) and
    # computes the discount itself from the DB-sourced subtotal.
    couponCode: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customerName: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    mode: str
    status: str
    total: int
    couponCode: Optional[str] = None
    discount: int = 0
    createdAt: datetime
    items: List[OrderItemOut]

    @classmethod
    def from_model(cls, order) -> "OrderOut":
        return cls(
            id=order.display_id,
            customerName=order.customer_name,
            phone=order.phone,
            email=order.email,
            address=order.address,
            mode=order.mode,
            status=order.status,
            total=order.total,
            couponCode=order.coupon_code,
            discount=order.discount or 0,
            createdAt=order.created_at,
            items=[OrderItemOut.model_validate(i) for i in order.items],
        )
