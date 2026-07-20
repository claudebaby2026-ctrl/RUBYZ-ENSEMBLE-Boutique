"""Talks to Razorpay's REST API directly with `requests` — no `razorpay`
SDK. That package's client.py does `import pkg_resources` (from
setuptools), which recent Python builds no longer ship by default, and
which is being phased out entirely, so pinning around it is a moving
target. Everything we actually need is two things:

  - create_razorpay_order(): POST /v1/orders to open a payment intent.
  - verify_razorpay_signature(): an HMAC-SHA256 check, done with the
    stdlib `hmac`/`hashlib` — this is all the SDK's "verify_payment_signature"
    ever did under the hood.

Docs: https://razorpay.com/docs/api/orders/ and
https://razorpay.com/docs/payments/server-integration/python/payment-gateway/build-integration/#step-3-verify-payment-signature
"""

import hashlib
import hmac

import requests

from app.config import settings

RAZORPAY_API_BASE = "https://api.razorpay.com/v1"


class RazorpayNotConfiguredError(RuntimeError):
    def __init__(self) -> None:
        super().__init__(
            "Razorpay is not configured. Set RAZORPAY_KEY_ID and "
            "RAZORPAY_KEY_SECRET in backend/.env (use your Test Mode keys "
            "from the Razorpay Dashboard while developing)."
        )


class RazorpayApiError(RuntimeError):
    """Raised when Razorpay's API itself rejects or fails a request (bad
    keys, network issue, malformed payload, etc) — distinct from a
    signature verification failure, which is a normal/expected outcome
    for a tampered payment and not an error state."""


def _auth() -> tuple[str, str]:
    if not settings.RAZORPAY_ENABLED:
        raise RazorpayNotConfiguredError()
    return (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)


def create_razorpay_order(amount_rupees: int, receipt: str) -> dict:
    """Create a Razorpay order for `amount_rupees` (converted to paise,
    since Razorpay's API is paise-denominated) and return the parsed JSON
    response (has ["id"], ["amount"], ["currency"], ...).
    """
    try:
        resp = requests.post(
            f"{RAZORPAY_API_BASE}/orders",
            auth=_auth(),
            json={
                "amount": amount_rupees * 100,
                "currency": "INR",
                "receipt": receipt,
                "payment_capture": 1,  # auto-capture on successful auth
            },
            timeout=15,
        )
    except requests.RequestException as exc:
        raise RazorpayApiError(f"Could not reach Razorpay: {exc}") from exc

    if not resp.ok:
        # Razorpay's error body is {"error": {"description": "...", ...}}
        try:
            detail = resp.json().get("error", {}).get("description", resp.text)
        except ValueError:
            detail = resp.text
        raise RazorpayApiError(f"Razorpay order creation failed: {detail}")

    return resp.json()


def verify_razorpay_signature(
    razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str
) -> bool:
    """Return True iff the signature genuinely came from Razorpay for this
    exact (order_id, payment_id) pair. This is the ONLY thing that should
    ever be trusted as proof of payment — never a bare "success" flag from
    the frontend, which anyone can send with devtools regardless of
    whether they actually paid.

    Razorpay signs `"{order_id}|{payment_id}"` with HMAC-SHA256 keyed on
    your key secret; we just redo that computation and compare.
    """
    if not settings.RAZORPAY_ENABLED:
        raise RazorpayNotConfiguredError()

    payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode()
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()

    # Constant-time comparison — avoids leaking signature-match info via
    # response-timing side channels.
    return hmac.compare_digest(expected, razorpay_signature)