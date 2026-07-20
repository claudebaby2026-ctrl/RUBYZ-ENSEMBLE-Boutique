"""Thin wrapper around the Razorpay Python SDK.

Two things live here:
  - create_razorpay_order(): opens a Razorpay "order" (their term for a
    payment intent) for a given amount, returned to the frontend so
    checkout.js knows what to charge.
  - verify_razorpay_signature(): re-derives the HMAC-SHA256 signature
    Razorpay signs successful payments with and compares it to what the
    client sent, so a forged/tampered "I paid!" claim from the browser is
    rejected before an order is ever created.

Both raise a clear RuntimeError if RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET
aren't configured, instead of failing confusingly deep inside the SDK.
"""

import razorpay
from razorpay.errors import SignatureVerificationError

from app.config import settings


class RazorpayNotConfiguredError(RuntimeError):
    def __init__(self) -> None:
        super().__init__(
            "Razorpay is not configured. Set RAZORPAY_KEY_ID and "
            "RAZORPAY_KEY_SECRET in backend/.env (use your Test Mode keys "
            "from the Razorpay Dashboard while developing)."
        )


_client: razorpay.Client | None = None


def _get_client() -> razorpay.Client:
    global _client
    if not settings.RAZORPAY_ENABLED:
        raise RazorpayNotConfiguredError()
    if _client is None:
        _client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    return _client


def create_razorpay_order(amount_rupees: int, receipt: str) -> dict:
    """Create a Razorpay order for `amount_rupees` (converted to paise,
    since Razorpay's API is paise-denominated) and return the raw SDK
    response dict (has ["id"], ["amount"], ["currency"], ...).
    """
    client = _get_client()
    return client.order.create(
        {
            "amount": amount_rupees * 100,
            "currency": "INR",
            "receipt": receipt,
            "payment_capture": 1,  # auto-capture on successful auth
        }
    )


def verify_razorpay_signature(
    razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str
) -> bool:
    """Return True iff the signature genuinely came from Razorpay for this
    exact (order_id, payment_id) pair. This is the ONLY thing that should
    ever be trusted as proof of payment — never a bare "success" flag from
    the frontend, which anyone can send with devtools regardless of
    whether they actually paid.
    """
    client = _get_client()
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )
        return True
    except SignatureVerificationError:
        return False
