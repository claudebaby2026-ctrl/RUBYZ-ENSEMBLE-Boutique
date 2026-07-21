"""Talks to Shiprocket's REST API (https://apidocs.shiprocket.in/) with
`requests`, mirroring app/services/payments.py's shape.

IMPORTANT — accuracy note: this module's endpoint paths and payload field
names were confirmed against Shiprocket's public docs and third-party
integration write-ups as of when this was written (auth, adhoc order
creation, serviceability, tracking, cancel, and the webhook's shared-secret
header convention), NOT against a live sandbox — Shiprocket has no sandbox,
so this was never exercised against a real seller account. Before relying
on this in production:
  1. Re-verify every endpoint/field below against https://apidocs.shiprocket.in/
     (Shiprocket has changed field names/response shapes across API
     versions before).
  2. Use the panel's "Test Webhook" button (Settings -> API -> webhook
     config) to confirm the exact header/field name the webhook sends the
     shared secret as (see routers/shipping.py's webhook handler) — this
     was NOT confirmed against a live payload.
  3. Run create_shipment() once against a real, cheap/cancellable test
     order and immediately cancel it (cancel_shipment()), to confirm the
     adhoc-order-creation payload shape is accepted as-is.

Known endpoints (base https://apiv2.shiprocket.in/v1/external):
  POST /auth/login                        -> {"token": "..."}
  POST /orders/create/adhoc                -> order_id, shipment_id
  GET  /courier/serviceability/            -> query params, not JSON body
  GET  /courier/track/shipment/{shipment_id}
  GET  /courier/track/awb/{awb}
  POST /orders/cancel                      -> {"ids": [...]}
"""

import threading
import time
from typing import Optional

import requests

from app.config import settings

SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external"

# Shiprocket auth tokens last ~10 days (240 hours). Refresh a bit early
# rather than cutting it exactly at expiry.
_TOKEN_TTL_SECONDS = 9 * 24 * 60 * 60  # 9 days


class ShiprocketNotConfiguredError(RuntimeError):
    def __init__(self) -> None:
        super().__init__(
            "Shiprocket is not configured. Set SHIPROCKET_EMAIL, "
            "SHIPROCKET_PASSWORD, and SHIPROCKET_PICKUP_LOCATION in "
            "backend/.env. There is no Shiprocket sandbox — use real "
            "(free-tier) seller credentials and throwaway/cancellable test "
            "orders."
        )


class ShiprocketApiError(RuntimeError):
    """Raised when Shiprocket's API itself rejects or fails a request (bad
    credentials, network issue, malformed payload, unserviceable pincode,
    etc)."""


class _TokenCache:
    """In-memory token cache with an expiry, so we don't re-authenticate on
    every call. Not process-safe across multiple workers (each worker gets
    its own cache and re-authenticates independently) — acceptable here
    since Shiprocket doesn't rate-limit login calls tightly enough for that
    to matter for this app's traffic.
    """

    def __init__(self) -> None:
        self._token: Optional[str] = None
        self._expires_at: float = 0.0
        self._lock = threading.Lock()

    def get(self) -> str:
        with self._lock:
            if self._token and time.time() < self._expires_at:
                return self._token
            self._token = self._authenticate()
            self._expires_at = time.time() + _TOKEN_TTL_SECONDS
            return self._token

    def _authenticate(self) -> str:
        try:
            resp = requests.post(
                f"{SHIPROCKET_API_BASE}/auth/login",
                json={
                    "email": settings.SHIPROCKET_EMAIL,
                    "password": settings.SHIPROCKET_PASSWORD,
                },
                timeout=15,
            )
        except requests.RequestException as exc:
            raise ShiprocketApiError(f"Could not reach Shiprocket: {exc}") from exc
        if not resp.ok:
            raise ShiprocketApiError(
                f"Shiprocket authentication failed: {resp.status_code} {resp.text}"
            )
        token = resp.json().get("token")
        if not token:
            raise ShiprocketApiError("Shiprocket login response had no token.")
        return token

    def invalidate(self) -> None:
        with self._lock:
            self._token = None
            self._expires_at = 0.0


_token_cache = _TokenCache()


def _headers() -> dict:
    if not settings.SHIPROCKET_ENABLED:
        raise ShiprocketNotConfiguredError()
    return {"Authorization": f"Bearer {_token_cache.get()}"}


def _request(method: str, path: str, *, retry_on_auth_fail: bool = True, **kwargs) -> dict:
    resp = requests.request(
        method, f"{SHIPROCKET_API_BASE}{path}", headers=_headers(), timeout=20, **kwargs
    )
    if resp.status_code == 401 and retry_on_auth_fail:
        # Cached token was rejected (expired early / revoked) — refresh
        # once and retry, rather than failing a legitimate request.
        _token_cache.invalidate()
        return _request(method, path, retry_on_auth_fail=False, **kwargs)
    if not resp.ok:
        try:
            detail = resp.json()
        except ValueError:
            detail = resp.text
        raise ShiprocketApiError(f"Shiprocket API error ({resp.status_code}): {detail}")
    return resp.json()


def resolve_dimensions(product, category_default, fallback_default) -> dict:
    """Resolution order per SHIPROCKET_INTEGRATION_SPEC.md: per-product
    override -> category default -> store-wide fallback.

    `product` is a Product ORM instance (or None). `category_default` and
    `fallback_default` are ShippingDefault ORM instances (or None — e.g. if
    seeding hasn't run yet, though it should always have by startup).
    Raises ShiprocketApiError if no dimensions can be resolved at all (no
    product override AND no matching category default AND no fallback row
    — should not happen in practice once seeding has run).
    """
    if product is not None and product.weight and product.length and product.breadth and product.height:
        return {
            "weight": product.weight,
            "length": product.length,
            "breadth": product.breadth,
            "height": product.height,
        }
    for default in (category_default, fallback_default):
        if default is not None:
            return {
                "weight": default.weight,
                "length": default.length,
                "breadth": default.breadth,
                "height": default.height,
            }
    raise ShiprocketApiError(
        "No shipping dimensions available (no product override, category "
        "default, or store-wide fallback configured)."
    )


def create_shipment(
    *,
    display_id: str,
    order_date: str,
    customer_name: str,
    phone: str,
    email: Optional[str],
    address: str,
    city: str,
    state: str,
    pincode: str,
    items: list[dict],
    sub_total: int,
    dimensions: dict,
    payment_method: str = "Prepaid",
) -> dict:
    """Create an adhoc Shiprocket order for an already-paid RUBYZ order.

    `items` is a list of {"name": str, "sku": str, "units": int,
    "selling_price": int}. `dimensions` is the dict returned by
    resolve_dimensions() (weight/length/breadth/height, already summed or
    per the heaviest-item convention the caller chose).

    Returns {"shiprocket_order_id", "shiprocket_shipment_id"} on success.
    Raises ShiprocketApiError on any failure — callers (the background
    task / manual retry endpoint) are responsible for catching this and
    marking the order's shipment_status as "failed" rather than letting it
    propagate and affect the (already-paid) order itself.
    """
    if not settings.SHIPROCKET_ENABLED:
        raise ShiprocketNotConfiguredError()

    payload = {
        "order_id": display_id.lstrip("#"),
        "order_date": order_date,
        "pickup_location": settings.SHIPROCKET_PICKUP_LOCATION,
        "billing_customer_name": customer_name,
        "billing_last_name": "",
        "billing_address": address,
        "billing_city": city,
        "billing_pincode": pincode,
        "billing_state": state,
        "billing_country": "India",
        "billing_email": email or "",
        "billing_phone": phone,
        "shipping_is_billing": True,
        "order_items": [
            {
                "name": item["name"],
                "sku": item.get("sku") or item["name"][:50],
                "units": item["units"],
                "selling_price": item["selling_price"],
            }
            for item in items
        ],
        "payment_method": payment_method,
        "sub_total": sub_total,
        "length": dimensions["length"],
        "breadth": dimensions["breadth"],
        "height": dimensions["height"],
        "weight": dimensions["weight"],
    }
    data = _request("POST", "/orders/create/adhoc", json=payload)
    return {
        "shiprocket_order_id": str(data.get("order_id", "")),
        "shiprocket_shipment_id": str(data.get("shipment_id", "")),
    }


def get_serviceability(*, delivery_pincode: str, weight: float, cod: bool = False) -> dict:
    """Live rate lookup for checkout. Returns
    {"serviceable": bool, "fee": int | None, "courier_name": str | None}.

    Requires SHIPROCKET_PICKUP_PINCODE (the pickup location's actual
    pincode — SHIPROCKET_PICKUP_LOCATION is just its nickname and isn't
    accepted here). If it's not set, this returns unserviceable rather
    than sending a request Shiprocket would likely reject outright, so
    callers fall back to the flat delivery fee instead of erroring.
    """
    if not settings.SHIPROCKET_ENABLED:
        raise ShiprocketNotConfiguredError()
    if not settings.SHIPROCKET_PICKUP_PINCODE:
        return {"serviceable": False, "fee": None, "courier_name": None}
    params = {
        "pickup_postcode": settings.SHIPROCKET_PICKUP_PINCODE,
        "delivery_postcode": delivery_pincode,
        "weight": weight,
        "cod": 1 if cod else 0,
    }
    data = _request("GET", "/courier/serviceability/", params=params)
    couriers = (data.get("data") or {}).get("available_courier_companies") or []
    if not couriers:
        return {"serviceable": False, "fee": None, "courier_name": None}
    cheapest = min(couriers, key=lambda c: c.get("rate", float("inf")))
    return {
        "serviceable": True,
        "fee": int(cheapest.get("rate", 0)),
        "courier_name": cheapest.get("courier_name"),
    }


def track_shipment(shipment_id: str) -> dict:
    return _request("GET", f"/courier/track/shipment/{shipment_id}")


def cancel_shipment(shiprocket_order_id: str) -> dict:
    return _request("POST", "/orders/cancel", json={"ids": [shiprocket_order_id]})
