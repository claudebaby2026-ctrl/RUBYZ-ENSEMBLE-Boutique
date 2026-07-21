"""pytest suite for the payment.captured webhook — the fallback that
creates an Order when a customer's browser never makes it back to
POST /orders after Razorpay has already captured the payment (tab
closed, connection dropped, app killed mid-redirect).

Covers:

  (a) Happy path — POST /payments/create-razorpay-order snapshots the
      cart, POST /orders is never called, and a payment.captured
      webhook alone creates the Order, decrements stock, and marks the
      snapshot consumed.
  (b) Idempotency against itself — replaying the same webhook body
      returns {"already_exists": true} and does not create a second
      Order or decrement stock twice.
  (c) Idempotency against the normal flow — if POST /orders already
      created the order (the common case; the webhook is usually a
      no-op backstop), the webhook finds it via the existing
      razorpay_payment_id uniqueness check and does nothing further.
  (d) Signature verification — a missing/wrong X-Razorpay-Signature is
      rejected with 401 and never touches the DB.
  (e) Unconfigured webhook secret — 503, not a silent no-op, so a
      misconfigured deployment is loud rather than quietly accepting
      unverifiable requests.
  (f) Unknown/irrelevant events (e.g. "payment.failed") and a
      razorpay_order_id with no matching PendingCheckout both return
      200 {"status": "ignored"} rather than an error — Razorpay retries
      non-2xx responses, and neither case is an actual failure.
  (g) A cart that's no longer fulfillable by the time the webhook
      arrives (stock sold out in the meantime) is handled gracefully —
      ignored, not a 500 — since there's nothing more this endpoint can
      do about an already-captured payment for an unfulfillable cart.

Uses a throwaway on-disk SQLite DB and FastAPI's TestClient, matching
the style of test_order_integrity.py and test_coupons.py.
create_razorpay_order (the outbound call to Razorpay's API) is
monkeypatched so none of this needs real credentials or network
access. The webhook's own HMAC check is exercised for real — signatures
in these tests are computed the same way Razorpay computes them.
"""
import hashlib
import hmac
import json
import os
import sys

os.environ["DATABASE_URL"] = "sqlite:///./test_razorpay_webhook.db"

if os.path.exists("test_razorpay_webhook.db"):
    os.remove("test_razorpay_webhook.db")

sys.path.insert(0, os.path.dirname(__file__))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.config import settings  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.order import Order  # noqa: E402
from app.models.pending_checkout import PendingCheckout  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.user import User  # noqa: E402
from main import app as fastapi_app  # noqa: E402

WEBHOOK_SECRET = "test_webhook_secret"


@pytest.fixture(scope="module", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def _configure_razorpay(monkeypatch):
    # RAZORPAY_KEY_ID/SECRET only need to be non-empty for RAZORPAY_ENABLED
    # checks elsewhere (e.g. price_cart's caller) to pass; the actual
    # outbound Razorpay call is monkeypatched per-test below.
    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", "rzp_test_dummy")
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "dummy_key_secret")
    monkeypatch.setattr(settings, "RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)
    yield


@pytest.fixture(scope="module")
def client():
    with TestClient(fastapi_app) as c:
        yield c


def _owner_headers(client):
    res = client.post(
        "/auth/login",
        json={"email": "owner@rubyzensemble.in", "password": "RubyzOwner@123"},
    )
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


_customer_counter = {"n": 0}


def _register_customer(client) -> dict:
    _customer_counter["n"] += 1
    email = f"webhook-customer-{_customer_counter['n']}@example.com"
    res = client.post(
        "/auth/register",
        json={
            "name": "Webhook Customer",
            "email": email,
            "password": "Password123!",
            "phone": "9999999999",
        },
    )
    assert res.status_code == 201
    body = res.json()
    return {"token": body["access_token"], "id": body["user"]["id"], "email": email}


def _make_product(client, owner_hdrs, **overrides) -> dict:
    payload = {
        "slug": f"webhook-test-{overrides.get('name', 'x')}".lower().replace(" ", "-"),
        "name": "Webhook Test Saree",
        "category": "Party Wear",
        "fabric": "Silk",
        "occasion": "Wedding",
        "color": "Blue",
        "price": 1000,
        "mrp": 1200,
        "stock": 10,
        "sizes": ["M"],
        "images": [],
        "care": [],
    }
    payload.update(overrides)
    res = client.post("/products", json=payload, headers=owner_hdrs)
    assert res.status_code == 201
    return res.json()


def _open_checkout(client, customer, product, *, rp_order_id, qty=1, monkeypatch, **customer_fields):
    """Call POST /payments/create-razorpay-order with the outbound
    Razorpay call stubbed out, returning a fixed rp_order_id. This is
    what snapshots the PendingCheckout row the webhook later reads."""
    fake_rp_order = {"id": rp_order_id, "amount": product["price"] * qty * 100, "currency": "INR"}
    monkeypatch.setattr(
        "app.routers.payments.create_razorpay_order", lambda **kw: fake_rp_order
    )
    body = {
        "mode": "Pickup",
        "items": [
            {"productId": product["id"], "name": product["name"], "quantity": qty, "price": product["price"]}
        ],
    }
    body.update(customer_fields)
    res = client.post(
        "/payments/create-razorpay-order",
        json=body,
        headers={"Authorization": f"Bearer {customer['token']}"},
    )
    assert res.status_code == 200, res.text
    return res.json()


def _webhook_body(*, razorpay_order_id, razorpay_payment_id, event="payment.captured"):
    return {
        "event": event,
        "payload": {
            "payment": {
                "entity": {"id": razorpay_payment_id, "order_id": razorpay_order_id}
            }
        },
    }


_UNSET = object()


def _signed_post(client, body: dict, *, secret=WEBHOOK_SECRET, signature=_UNSET):
    raw = json.dumps(body).encode()
    if signature is _UNSET:
        sig = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    else:
        sig = signature
    headers = {"Content-Type": "application/json"}
    if sig is not None:
        headers["X-Razorpay-Signature"] = sig
    return client.post("/payments/webhooks/razorpay", content=raw, headers=headers)


# ---------------------------------------------------------------------------
# (a) Happy path: browser never comes back, webhook alone creates the order
# ---------------------------------------------------------------------------
def test_webhook_creates_order_when_post_orders_never_arrives(client, monkeypatch):
    owner_hdrs = _owner_headers(client)
    product = _make_product(client, owner_hdrs, name="Happy Path Saree", price=1000, stock=5)
    customer = _register_customer(client)

    _open_checkout(
        client, customer, product,
        rp_order_id="order_happy_path", qty=2, monkeypatch=monkeypatch,
        customerName="Jane Doe", phone="8888888888", email="jane@example.com",
    )

    # Browser dies here — POST /orders is deliberately never called.

    res = _signed_post(
        client,
        _webhook_body(razorpay_order_id="order_happy_path", razorpay_payment_id="pay_happy_path"),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "ok"
    assert "order_id" in body

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.razorpay_payment_id == "pay_happy_path").first()
        assert order is not None, "webhook must have created the order"
        assert order.customer_name == "Jane Doe"
        assert order.payment_status == "paid"
        assert order.total == 2000

        refreshed_product = db.query(Product).filter(Product.id == product["id"]).first()
        assert refreshed_product.stock == 3, f"stock must be decremented (5 - 2 = 3), got {refreshed_product.stock}"

        pending = (
            db.query(PendingCheckout)
            .filter(PendingCheckout.razorpay_order_id == "order_happy_path")
            .first()
        )
        assert pending.consumed is True, "snapshot must be marked consumed after use"
    finally:
        db.close()


# ---------------------------------------------------------------------------
# (b) Replaying the same webhook must not double-create or double-decrement
# ---------------------------------------------------------------------------
def test_webhook_replay_is_idempotent(client, monkeypatch):
    owner_hdrs = _owner_headers(client)
    product = _make_product(client, owner_hdrs, name="Replay Saree", price=1000, stock=5)
    customer = _register_customer(client)

    _open_checkout(
        client, customer, product,
        rp_order_id="order_replay_test", qty=1, monkeypatch=monkeypatch,
        customerName="Replay Customer", phone="7777777777",
    )

    body = _webhook_body(razorpay_order_id="order_replay_test", razorpay_payment_id="pay_replay_test")
    first = _signed_post(client, body)
    assert first.status_code == 200
    assert first.json()["status"] == "ok"

    second = _signed_post(client, body)
    assert second.status_code == 200
    assert second.json() == {"status": "ok", "already_exists": True}

    db = SessionLocal()
    try:
        matching = db.query(Order).filter(Order.razorpay_payment_id == "pay_replay_test").all()
        assert len(matching) == 1, f"replay must not create a second order, found {len(matching)}"

        refreshed_product = db.query(Product).filter(Product.id == product["id"]).first()
        assert refreshed_product.stock == 4, f"stock must be decremented exactly once, got {refreshed_product.stock}"
    finally:
        db.close()


# ---------------------------------------------------------------------------
# (c) If POST /orders already created the order, the webhook is a no-op
# ---------------------------------------------------------------------------
def test_webhook_defers_to_order_already_created_by_normal_flow(client, monkeypatch):
    owner_hdrs = _owner_headers(client)
    product = _make_product(client, owner_hdrs, name="Already Placed Saree", price=1000, stock=5)
    customer = _register_customer(client)

    _open_checkout(
        client, customer, product,
        rp_order_id="order_already_placed", qty=1, monkeypatch=monkeypatch,
        customerName="Normal Flow Customer", phone="6666666666",
    )

    # Simulate the browser making it back and completing checkout the
    # normal way — bypass real signature verification since that's not
    # what this test is about (see test_order_integrity.py for that).
    monkeypatch.setattr("app.crud.order.verify_razorpay_signature", lambda *a, **k: True)
    order_res = client.post(
        "/orders",
        json={
            "customerName": "Normal Flow Customer",
            "phone": "6666666666",
            "mode": "Pickup",
            "items": [{"productId": product["id"], "name": product["name"], "quantity": 1, "price": product["price"]}],
            "total": product["price"],
            "razorpayOrderId": "order_already_placed",
            "razorpayPaymentId": "pay_already_placed",
            "razorpaySignature": "sig_irrelevant_because_mocked",
        },
        headers={"Authorization": f"Bearer {customer['token']}"},
    )
    assert order_res.status_code == 201, order_res.text

    # Webhook arrives afterwards (Razorpay's delivery isn't instant) —
    # must recognize the order already exists and do nothing further.
    res = _signed_post(
        client,
        _webhook_body(razorpay_order_id="order_already_placed", razorpay_payment_id="pay_already_placed"),
    )
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "already_exists": True}

    db = SessionLocal()
    try:
        matching = db.query(Order).filter(Order.razorpay_payment_id == "pay_already_placed").all()
        assert len(matching) == 1
        refreshed_product = db.query(Product).filter(Product.id == product["id"]).first()
        assert refreshed_product.stock == 4, "stock must only be decremented once, by the normal flow"
    finally:
        db.close()


# ---------------------------------------------------------------------------
# (d) Signature verification
# ---------------------------------------------------------------------------
def test_webhook_rejects_bad_signature(client, monkeypatch):
    owner_hdrs = _owner_headers(client)
    product = _make_product(client, owner_hdrs, name="Bad Sig Saree", price=1000, stock=5)
    customer = _register_customer(client)
    _open_checkout(
        client, customer, product,
        rp_order_id="order_bad_sig", qty=1, monkeypatch=monkeypatch,
        customerName="Bad Sig Customer", phone="5555555555",
    )

    body = _webhook_body(razorpay_order_id="order_bad_sig", razorpay_payment_id="pay_bad_sig")
    res = _signed_post(client, body, signature="not_the_real_signature")
    assert res.status_code == 401

    res_missing = _signed_post(client, body, signature=None)
    assert res_missing.status_code == 401

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.razorpay_payment_id == "pay_bad_sig").first()
        assert order is None, "an unverified webhook must never create an order"
    finally:
        db.close()


def test_webhook_returns_503_when_unconfigured(client, monkeypatch):
    monkeypatch.setattr(settings, "RAZORPAY_WEBHOOK_SECRET", "")
    body = _webhook_body(razorpay_order_id="order_unconfigured", razorpay_payment_id="pay_unconfigured")
    res = _signed_post(client, body, secret="irrelevant")
    assert res.status_code == 503


# ---------------------------------------------------------------------------
# (f) Non-actionable events return 200 "ignored", never an error
# ---------------------------------------------------------------------------
def test_webhook_ignores_unrelated_event(client):
    body = _webhook_body(
        razorpay_order_id="order_whatever", razorpay_payment_id="pay_whatever", event="payment.failed"
    )
    res = _signed_post(client, body)
    assert res.status_code == 200
    assert res.json() == {"status": "ignored"}


def test_webhook_ignores_unknown_pending_checkout(client):
    # A payment.captured event for an order_id with no PendingCheckout row
    # at all (e.g. a checkout from before this feature existed).
    body = _webhook_body(razorpay_order_id="order_never_snapshotted", razorpay_payment_id="pay_never_snapshotted")
    res = _signed_post(client, body)
    assert res.status_code == 200
    assert res.json() == {"status": "ignored"}

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.razorpay_payment_id == "pay_never_snapshotted").first()
        assert order is None
    finally:
        db.close()


# ---------------------------------------------------------------------------
# (g) Cart no longer fulfillable by the time the webhook arrives
# ---------------------------------------------------------------------------
def test_webhook_handles_unfulfillable_cart_gracefully(client, monkeypatch):
    owner_hdrs = _owner_headers(client)
    product = _make_product(client, owner_hdrs, name="Sold Out By Webhook Saree", price=1000, stock=1)
    customer = _register_customer(client)

    _open_checkout(
        client, customer, product,
        rp_order_id="order_sold_out", qty=1, monkeypatch=monkeypatch,
        customerName="Unlucky Customer", phone="4444444444",
    )

    # Someone else buys the only unit before the webhook arrives.
    db = SessionLocal()
    try:
        p = db.query(Product).filter(Product.id == product["id"]).first()
        p.stock = 0
        db.commit()
    finally:
        db.close()

    res = _signed_post(
        client,
        _webhook_body(razorpay_order_id="order_sold_out", razorpay_payment_id="pay_sold_out"),
    )
    # Must not 500 — there's nothing more this endpoint can do for an
    # already-captured payment against a cart that's no longer fulfillable.
    assert res.status_code == 200
    assert res.json() == {"status": "ignored"}

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.razorpay_payment_id == "pay_sold_out").first()
        assert order is None, "no order should be created for an unfulfillable cart"
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
