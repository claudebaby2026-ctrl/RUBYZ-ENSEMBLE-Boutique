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
    # Structured billing address — required by Shiprocket for shipment
    # creation (the free-text `address` above can't be reliably parsed
    # into these). Optional here (e.g. Pickup mode doesn't need them), but
    # the frontend requires `pincode` whenever mode == "Delivery".
    pincode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    mode: str = "Delivery"
    items: List[OrderItemCreate]
    total: int
    # Optional coupon code from checkout. NEVER trust a client-computed
    # discount — only the code is accepted here; create_order re-validates
    # it server-side (same rules as GET /coupons/validate/{code}) and
    # computes the discount itself from the DB-sourced subtotal.
    couponCode: Optional[str] = None
    # Razorpay payment proof from checkout.js's success handler. All three
    # are required — create_order() verifies razorpaySignature server-side
    # (HMAC over razorpayOrderId + razorpayPaymentId, keyed with
    # RAZORPAY_KEY_SECRET) via the Razorpay SDK before the order is ever
    # written to the DB. A client cannot forge a valid signature without
    # the secret, so a successful create_order call is proof payment was
    # actually captured — never trust these fields for anything other than
    # feeding them into that verification call.
    razorpayOrderId: str
    razorpayPaymentId: str
    razorpaySignature: str


class ManualOrderCreate(BaseModel):
    """Body for POST /orders/manual — owner-only. Used when the owner has

    confirmed a sale over WhatsApp (or in person) and is logging it into
    the system themselves, instead of the old customer-facing Razorpay
    checkout. No payment proof is collected here — the owner has already
    settled payment with the customer through whatever channel they used
    (WhatsApp, cash, UPI) before logging the order. Stock is still
    validated and decremented exactly like the automated path (see
    create_manual_order), so this is what keeps online and in-person
    inventory in sync and prevents overselling limited stock.
    """

    customerName: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    mode: str = "Delivery"
    items: List[OrderItemCreate]
    couponCode: Optional[str] = None


class RazorpayOrderCreate(BaseModel):
    """Body for POST /payments/create-razorpay-order. Mirrors the parts of
    OrderCreate needed to compute the amount to charge — everything else
    (name/phone/address) is collected later, only once payment succeeds."""

    mode: str = "Delivery"
    items: List[OrderItemCreate]
    couponCode: Optional[str] = None
    # Optional customer/address fields. Not required by the existing
    # frontend flow (which only sends these later, to POST /orders) — but
    # if present, they're snapshotted into PendingCheckout so the
    # payment.captured webhook can create a real order even if the
    # browser never makes it back to POST /orders. See
    # app/crud/pending_checkout.py.
    customerName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class RazorpayOrderOut(BaseModel):
    razorpayOrderId: str
    amount: int  # in paise, as Razorpay expects
    currency: str = "INR"
    keyId: str


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
    paymentStatus: str = "paid"
    razorpayPaymentId: Optional[str] = None
    createdAt: datetime
    items: List[OrderItemOut]
    # --- Shiprocket shipment tracking ---
    # Included here (rather than a second endpoint) so both the owner
    # dashboard's Orders table and the customer-facing GET /orders/me
    # response are enough on their own to render tracking status.
    shipmentStatus: str = "not_created"
    awbCode: Optional[str] = None
    courierName: Optional[str] = None

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
            paymentStatus=order.payment_status or "paid",
            razorpayPaymentId=order.razorpay_payment_id,
            createdAt=order.created_at,
            items=[OrderItemOut.model_validate(i) for i in order.items],
            shipmentStatus=order.shipment_status or "not_created",
            awbCode=order.awb_code,
            courierName=order.courier_name,
        )
