from typing import Optional

from sqlalchemy.orm import Session

from app.models.order import Order

# Maps Shiprocket's webhook status vocabulary onto this app's existing
# Order.status fulfillment field, so the owner never has to cross-reference
# two independent status values. Deliberately conservative — only maps
# statuses we're confident about; anything unrecognized updates
# shipment_status/awb/courier only and leaves `status` untouched (see
# apply_webhook_update below).
#
# NOTE: verify this mapping against the *actual* strings Shiprocket sends
# in its webhook payload (use the panel's "Test Webhook" button) before
# relying on it — these are the commonly-documented values, not confirmed
# against a live payload. See app/services/shiprocket.py's accuracy note.
_SHIPROCKET_STATUS_TO_ORDER_STATUS = {
    "pickup scheduled": "Confirmed",
    "picked up": "Shipped",
    "shipped": "Shipped",
    "in transit": "Shipped",
    "out for delivery": "Shipped",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
    "rto initiated": "Shipped",
    "rto delivered": "Cancelled",
}


def mark_shipment_pending(db: Session, order: Order) -> None:
    order.shipment_status = "pending"
    db.commit()


def mark_shipment_created(
    db: Session,
    order: Order,
    *,
    shiprocket_order_id: str,
    shiprocket_shipment_id: str,
) -> Order:
    order.shipment_status = "created"
    order.shiprocket_order_id = shiprocket_order_id
    order.shiprocket_shipment_id = shiprocket_shipment_id
    db.commit()
    db.refresh(order)
    return order


def mark_shipment_failed(db: Session, order: Order) -> None:
    order.shipment_status = "failed"
    db.commit()


def apply_webhook_update(
    db: Session,
    order: Order,
    *,
    awb_code: Optional[str],
    courier_name: Optional[str],
    current_status: Optional[str],
) -> Order:
    """Apply a Shiprocket webhook payload's fields onto an order. Always
    updates awb/courier when present; maps `current_status` onto the
    fulfillment `status` field only when it's a status we recognize (see
    _SHIPROCKET_STATUS_TO_ORDER_STATUS above) — an unrecognized status
    still gets recorded (so it's visible for debugging) but never
    silently overwrites a known-good fulfillment status with a guess.
    """
    if awb_code:
        order.awb_code = awb_code
    if courier_name:
        order.courier_name = courier_name
    if current_status:
        order.shipment_status = current_status.lower().replace(" ", "_")
        mapped = _SHIPROCKET_STATUS_TO_ORDER_STATUS.get(current_status.strip().lower())
        if mapped:
            order.status = mapped
    db.commit()
    db.refresh(order)
    return order


def get_order_by_shiprocket_ids(
    db: Session, *, shiprocket_order_id: Optional[str], awb_code: Optional[str]
) -> Optional[Order]:
    """Look up the order a webhook update applies to. Shiprocket webhooks
    typically identify the shipment by AWB and/or their own order id —
    confirm which field(s) are actually present against a live "Test
    Webhook" payload (see routers/shipping.py)."""
    query = db.query(Order)
    if awb_code:
        match = query.filter(Order.awb_code == awb_code).first()
        if match:
            return match
    if shiprocket_order_id:
        return query.filter(Order.shiprocket_order_id == shiprocket_order_id).first()
    return None
