from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ShippingDefaultRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category: str
    weight: float
    length: float
    breadth: float
    height: float


class ShippingDefaultsUpdate(BaseModel):
    """Full replace of every row (mirrors HomepageConfigUpdate's full-replace
    style) — five category rows plus the store-wide fallback row, all
    editable as plain number inputs from the owner dashboard's "Shipping
    Defaults" section. No code deploy required to correct a weight."""

    rows: List[ShippingDefaultRow]


class ShippingDefaultsOut(BaseModel):
    rows: List[ShippingDefaultRow]


# --- Shipping rate lookup (POST /shipping/rate) ---


class RateQuoteItem(BaseModel):
    productId: Optional[int] = None
    category: str
    quantity: int = 1


class RateQuoteRequest(BaseModel):
    pincode: str
    items: List[RateQuoteItem]


class RateQuoteResponse(BaseModel):
    fee: int
    # True when this is the live Shiprocket-computed rate; False when it's
    # the flat DELIVERY_FEE fallback (Shiprocket unconfigured/unreachable/
    # erroring, or every item in the cart is Tailoring Services).
    live: bool
    courierName: Optional[str] = None
