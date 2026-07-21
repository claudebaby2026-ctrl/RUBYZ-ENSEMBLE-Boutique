"""Builds and submits a Shiprocket shipment for an Order. Shared by the
background task scheduled from POST /orders and the owner-only manual
retry endpoint (POST /orders/{display_id}/create-shipment) — see
app/routers/orders.py and app/routers/shipping.py.
"""

import logging

from sqlalchemy.orm import Session

from app.crud import shipment as shipment_crud
from app.crud.shipping_defaults import get_fallback, get_for_category
from app.models.order import Order
from app.models.product import Product
from app.services.shiprocket import (
    ShiprocketApiError,
    ShiprocketNotConfiguredError,
    create_shipment as shiprocket_create_shipment,
    resolve_dimensions,
)

logger = logging.getLogger(__name__)

TAILORING_CATEGORY = "Tailoring Services"


def order_is_shippable(order: Order, db: Session) -> bool:
    """Skip shipment creation for Pickup-mode orders or orders made up
    entirely of Tailoring Services line items (custom-fit service, not a
    shippable physical product — see SHIPROCKET_INTEGRATION_SPEC.md #4)."""
    if order.mode != "Delivery":
        return False
    return any(_item_category(item, db) != TAILORING_CATEGORY for item in order.items)


def _item_category(item, db: Session | None = None) -> str | None:
    # OrderItem doesn't snapshot category (only name/price — see
    # docs/DATA_MODEL.md), so this has to look the product up live. If the
    # product has since been deleted, we can't know its category anymore;
    # treat it as shippable (fail open) rather than silently dropping it
    # from the shipment.
    if db is None:
        return None
    if not item.product_id:
        return None
    product = db.query(Product).filter(Product.id == item.product_id).first()
    return product.category if product else None


def create_shipment_for_order(db: Session, order: Order) -> None:
    """Attempt to create the Shiprocket shipment for `order`. Never raises
    — on any failure this marks shipment_status = "failed" and logs, so a
    Shiprocket outage/misconfiguration can never affect the (already-paid)
    order itself. Callers that want the failure to surface synchronously
    (the manual-retry endpoint) should check order.shipment_status after
    calling this, not rely on an exception.
    """
    try:
        shippable_items = [
            item for item in order.items if _item_category(item, db) != TAILORING_CATEGORY
        ]
        if not shippable_items:
            shipment_crud.mark_shipment_failed(db, order)
            logger.warning(
                "Order %s has no shippable items (all Tailoring Services or "
                "products deleted) — skipping Shiprocket shipment.",
                order.display_id,
            )
            return

        # Resolution order per product: override -> category default ->
        # store-wide fallback. Weight is summed across the whole order
        # (heaviest realistic approximation without real dimensional-weight
        # packing logic, which is explicitly out of scope for this pass);
        # dimensions use the largest single item's box, which is a rough
        # placeholder — multi-parcel/consolidated-box logic isn't modeled.
        total_weight = 0.0
        max_l = max_b = max_h = 0.0
        line_items = []
        fallback = get_fallback(db)
        category_cache: dict[str, object] = {}
        for item in shippable_items:
            product = (
                db.query(Product).filter(Product.id == item.product_id).first()
                if item.product_id
                else None
            )
            category = product.category if product else None
            if category and category not in category_cache:
                category_cache[category] = get_for_category(db, category)
            category_default = category_cache.get(category)
            dims = resolve_dimensions(product, category_default, fallback)
            total_weight += dims["weight"] * item.quantity
            max_l = max(max_l, dims["length"])
            max_b = max(max_b, dims["breadth"])
            max_h = max(max_h, dims["height"])
            line_items.append(
                {
                    "name": item.name,
                    "sku": f"RUBYZ-{item.product_id or item.id}",
                    "units": item.quantity,
                    "selling_price": item.price,
                }
            )

        result = shiprocket_create_shipment(
            display_id=order.display_id,
            order_date=order.created_at.strftime("%Y-%m-%d %H:%M"),
            customer_name=order.customer_name,
            phone=order.phone,
            email=order.email,
            address=order.address or "",
            city=order.billing_city or "",
            state=order.billing_state or "",
            pincode=order.billing_pincode or "",
            items=line_items,
            sub_total=order.total,
            dimensions={
                "weight": round(total_weight, 3),
                "length": max_l,
                "breadth": max_b,
                "height": max_h,
            },
        )
        shipment_crud.mark_shipment_created(
            db,
            order,
            shiprocket_order_id=result["shiprocket_order_id"],
            shiprocket_shipment_id=result["shiprocket_shipment_id"],
        )
    except (ShiprocketApiError, ShiprocketNotConfiguredError) as exc:
        logger.error("Shiprocket shipment creation failed for order %s: %s", order.display_id, exc)
        shipment_crud.mark_shipment_failed(db, order)
    except Exception:  # noqa: BLE001 — never let this raise out of a background task
        logger.exception(
            "Unexpected error creating Shiprocket shipment for order %s", order.display_id
        )
        shipment_crud.mark_shipment_failed(db, order)


def create_shipment_background(order_id: int) -> None:
    """Entry point for FastAPI BackgroundTasks. Opens its own SessionLocal
    — this runs after the response is already sent, so it can't reuse the
    request-scoped session (see app/routers/orders.py)."""
    from app.database import SessionLocal  # local import avoids any import-order issues

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return
        create_shipment_for_order(db, order)
    finally:
        db.close()
