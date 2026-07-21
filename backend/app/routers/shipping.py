import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.crud import order as order_crud
from app.crud import shipment as shipment_crud
from app.crud.shipping_defaults import get_fallback, get_for_category
from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.shipping import RateQuoteRequest, RateQuoteResponse
from app.security import get_current_owner
from app.services.shipment_creation import TAILORING_CATEGORY, create_shipment_for_order
from app.services.shiprocket import (
    ShiprocketApiError,
    ShiprocketNotConfiguredError,
    get_serviceability,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["shipping"])


@router.post("/shipping/rate", response_model=RateQuoteResponse)
def get_shipping_rate(payload: RateQuoteRequest, db: Session = Depends(get_db)):
    """Public. Live shipping rate for checkout. MUST fall back to the flat
    DELIVERY_FEE if Shiprocket is unconfigured, unreachable, or errors —
    checkout must never hard-fail because of this endpoint."""
    fallback_fee = settings.DELIVERY_FEE

    if not settings.SHIPROCKET_ENABLED:
        return RateQuoteResponse(fee=fallback_fee, live=False)

    # Skip Tailoring Services line items entirely (custom-fit service, not
    # shippable — see SHIPROCKET_INTEGRATION_SPEC.md #4).
    shippable = [item for item in payload.items if item.category != TAILORING_CATEGORY]
    if not shippable:
        # Nothing shippable in the cart (e.g. a Tailoring-only order) — the
        # flat fee is the sensible default rather than a live lookup for
        # zero physical weight.
        return RateQuoteResponse(fee=fallback_fee, live=False)

    try:
        fallback_default = get_fallback(db)
        total_weight = 0.0
        for item in shippable:
            product = (
                db.query(Product).filter(Product.id == item.productId).first()
                if item.productId
                else None
            )
            category_default = get_for_category(db, item.category)
            default = category_default or fallback_default
            weight = (product.weight if product and product.weight else None) or (
                default.weight if default else 0.5
            )
            total_weight += weight * item.quantity

        result = get_serviceability(delivery_pincode=payload.pincode, weight=round(total_weight, 3))
        if not result["serviceable"] or result["fee"] is None:
            return RateQuoteResponse(fee=fallback_fee, live=False)
        return RateQuoteResponse(
            fee=result["fee"], live=True, courierName=result.get("courier_name")
        )
    except (ShiprocketApiError, ShiprocketNotConfiguredError) as exc:
        logger.warning("Shiprocket rate lookup failed, falling back to flat fee: %s", exc)
        return RateQuoteResponse(fee=fallback_fee, live=False)
    except Exception:  # noqa: BLE001 — this endpoint must never hard-fail checkout
        logger.exception("Unexpected error computing shipping rate; falling back to flat fee")
        return RateQuoteResponse(fee=fallback_fee, live=False)


@router.post("/webhooks/shiprocket")
async def shiprocket_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_api_key: str | None = Header(default=None, alias="x-api-key"),
):
    """Public, verified via the shared SHIPROCKET_WEBHOOK_TOKEN.

    ACCURACY WARNING: the header name Shiprocket actually sends the shared
    secret as, and the exact payload field names below (awb/current_status/
    courier_name/order_id), were NOT confirmed against a live payload —
    only against third-party integration write-ups (see
    app/services/shiprocket.py's accuracy note at the top of that file).
    Before trusting this in production: use the Shiprocket panel's
    "Test Webhook" button (Settings -> API -> webhook config), log the
    raw request once, and adjust the header/field names below to match
    exactly what actually arrives.
    """
    if not settings.SHIPROCKET_WEBHOOK_TOKEN:
        # Webhook token not configured — refuse rather than accept
        # unverifiable updates.
        raise HTTPException(status_code=503, detail="Shiprocket webhook not configured")

    body = await request.json()
    # Try the two most commonly documented conventions: a dedicated header,
    # or a token field inside the JSON body itself. Whichever Shiprocket
    # actually uses, confirm via "Test Webhook" as noted above.
    provided_token = x_api_key or body.get("token") or body.get("webhook_token")
    if provided_token != settings.SHIPROCKET_WEBHOOK_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid webhook token")

    awb_code = body.get("awb") or body.get("awb_code")
    shiprocket_order_id = (
        str(body.get("order_id")) if body.get("order_id") is not None else None
    )
    courier_name = body.get("courier_name")
    current_status = body.get("current_status") or body.get("status")

    order = shipment_crud.get_order_by_shiprocket_ids(
        db, shiprocket_order_id=shiprocket_order_id, awb_code=awb_code
    )
    if not order:
        # Don't 404/error — Shiprocket will retry on non-2xx, and a webhook
        # for an order we can't match (e.g. a test payload from the panel's
        # "Test Webhook" button) isn't an integration failure.
        logger.info(
            "Shiprocket webhook: no matching order for order_id=%s awb=%s",
            shiprocket_order_id,
            awb_code,
        )
        return {"status": "ignored"}

    shipment_crud.apply_webhook_update(
        db,
        order,
        awb_code=awb_code,
        courier_name=courier_name,
        current_status=current_status,
    )
    return {"status": "ok"}


@router.post("/orders/{display_id}/create-shipment")
def retry_create_shipment(
    display_id: str,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    """Owner-only manual retry target for the dashboard's "Create Shipment"
    button. Synchronous is fine here — an owner clicking a button can wait
    for a response, unlike the checkout-path background task."""
    order = order_crud.get_order_by_display_id(db, display_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    shipment_crud.mark_shipment_pending(db, order)
    create_shipment_for_order(db, order)
    db.refresh(order)

    if order.shipment_status == "failed":
        raise HTTPException(
            status_code=502,
            detail="Shiprocket shipment creation failed. Check the server logs "
            "for details and try again once resolved.",
        )
    return {
        "shipmentStatus": order.shipment_status,
        "awbCode": order.awb_code,
        "courierName": order.courier_name,
    }
