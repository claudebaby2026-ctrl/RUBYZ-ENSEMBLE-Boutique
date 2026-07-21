"""pytest suite for the three checkout flows where a bug would cost real
money or stock:

  (a) Payment-replay idempotency — the same (razorpayOrderId,
      razorpayPaymentId, razorpaySignature) submitted twice must produce
      exactly one Order, one stock decrement, and the second call must
      return the same order rather than erroring or duplicating it.
  (b) No overselling under concurrent orders — two near-simultaneous
      order-creation calls against a product with stock=1 must result in
      exactly one success and one OutOfStockError, and stock must never
      go negative.
  (c) Server-side price recomputation — a tampered client-supplied
      price/total must never make it into the persisted Order; the DB
      price always wins.

Uses a throwaway on-disk SQLite DB (in-memory won't do for the
concurrency test, which needs two connections seeing the same data) and
FastAPI's TestClient for setup (owner/customer accounts, products) via
the real HTTP API, matching the style of test_coupons.py. The
concurrency and idempotency flows call app.crud.order.create_order()
directly (with separate DB sessions, like separate requests would each
get via the get_db dependency) since they need control that the HTTP
layer doesn't expose (firing two calls at once, reusing one payment ID).

verify_razorpay_signature is monkeypatched to always succeed so none of
this needs real Razorpay credentials or network access.
"""
import os
import sys
import threading

os.environ["DATABASE_URL"] = "sqlite:///./test_order_integrity.db"

if os.path.exists("test_order_integrity.db"):
    os.remove("test_order_integrity.db")

sys.path.insert(0, os.path.dirname(__file__))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import event  # noqa: E402

import app.crud.order as order_crud  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.order import Order  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.user import User  # noqa: E402
from app.schemas.order import OrderCreate, OrderItemCreate  # noqa: E402
from main import app as fastapi_app  # noqa: E402


# --- Make SQLite writers properly serialize -------------------------------
# By default SQLite's transactions are "deferred": a plain SELECT (even one
# wrapped in with_for_update(), which SQLite ignores entirely — see
# app/crud/order.py's comment on why) doesn't take any lock, so two
# connections can both read stock=1 before either has written anything.
# That's a real gap that only Postgres's SELECT...FOR UPDATE closes for
# this app in production.
#
# For the concurrency test (b) to exercise the actual invariant we care
# about — that the stock-check-then-decrement in price_cart()/create_order()
# can't be raced — we make each transaction acquire SQLite's write lock
# immediately (BEGIN IMMEDIATE) instead of on first write. This is the
# standard SQLAlchemy+pysqlite recipe for serializable writers and only
# affects this test's own engine/session usage, not application code.
@event.listens_for(engine, "connect")
def _sqlite_no_implicit_begin(dbapi_conn, _):
    dbapi_conn.isolation_level = None


@event.listens_for(engine, "begin")
def _sqlite_begin_immediate(conn):
    conn.exec_driver_sql("BEGIN IMMEDIATE")


def _fresh_signature_stub(monkeypatch):
    monkeypatch.setattr(
        "app.crud.order.verify_razorpay_signature", lambda *a, **k: True
    )


@pytest.fixture(scope="module", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def _stub_signature(monkeypatch):
    _fresh_signature_stub(monkeypatch)
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


def _register_customer(client) -> User:
    _customer_counter["n"] += 1
    email = f"integrity-customer-{_customer_counter['n']}@example.com"
    res = client.post(
        "/auth/register",
        json={
            "name": "Integrity Customer",
            "email": email,
            "password": "Password123!",
            "phone": "9999999999",
        },
    )
    assert res.status_code == 201
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        db.expunge(user)
        return user
    finally:
        db.close()


def _make_product(client, owner_hdrs, **overrides) -> dict:
    payload = {
        "slug": f"integrity-test-{overrides.get('name', 'x')}".lower().replace(" ", "-"),
        "name": "Integrity Test Saree",
        "category": "Party Wear",
        "fabric": "Silk",
        "occasion": "Wedding",
        "color": "Red",
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


def _order_create(product: dict, user: User, *, payment_id: str, qty: int = 1,
                   price: int = None, total: int = None, mode: str = "Pickup") -> OrderCreate:
    item_price = product["price"] if price is None else price
    computed_total = product["price"] * qty if total is None else total
    return OrderCreate(
        customerName=user.name,
        phone="9876543210",
        mode=mode,
        items=[
            OrderItemCreate(
                productId=product["id"], name=product["name"], quantity=qty, price=item_price
            )
        ],
        total=computed_total,
        razorpayOrderId=f"order_{payment_id}",
        razorpayPaymentId=payment_id,
        razorpaySignature="sig_irrelevant_because_mocked",
    )


# ---------------------------------------------------------------------------
# (a) Idempotency
# ---------------------------------------------------------------------------
def test_duplicate_payment_id_creates_only_one_order(client):
    owner_hdrs = _owner_headers(client)
    product = _make_product(client, owner_hdrs, name="Idempotency Saree", price=1000, stock=5)
    user = _register_customer(client)

    payload = _order_create(product, user, payment_id="pay_replay_test", qty=2)

    db1 = SessionLocal()
    try:
        order1 = order_crud.create_order(db1, payload, user_id=user.id)
        order1_id, order1_display_id = order1.id, order1.display_id
    finally:
        db1.close()

    # Simulate a retry: a fresh session, the exact same payload (as a
    # client retrying after a timeout/double-click would send).
    db2 = SessionLocal()
    try:
        order2 = order_crud.create_order(db2, payload, user_id=user.id)
        assert order2.id == order1_id, "retry must return the SAME order, not a new one"
        assert order2.display_id == order1_display_id
    finally:
        db2.close()

    db = SessionLocal()
    try:
        matching_orders = (
            db.query(Order).filter(Order.razorpay_payment_id == "pay_replay_test").all()
        )
        assert len(matching_orders) == 1, (
            f"expected exactly one Order row for this payment, found {len(matching_orders)}"
        )

        refreshed_product = db.query(Product).filter(Product.id == product["id"]).first()
        assert refreshed_product.stock == 3, (
            "stock must be decremented exactly once (5 - 2 = 3), "
            f"got {refreshed_product.stock}"
        )
        assert refreshed_product.sold == 2, "sold must be incremented exactly once"
    finally:
        db.close()


# ---------------------------------------------------------------------------
# (b) No overselling under concurrent orders
# ---------------------------------------------------------------------------
def test_no_overselling_under_concurrent_orders(client):
    owner_hdrs = _owner_headers(client)
    product = _make_product(client, owner_hdrs, name="Last Unit Saree", price=1000, stock=1)
    buyer_a = _register_customer(client)
    buyer_b = _register_customer(client)

    payload_a = _order_create(product, buyer_a, payment_id="pay_concurrent_a", qty=1)
    payload_b = _order_create(product, buyer_b, payment_id="pay_concurrent_b", qty=1)

    barrier = threading.Barrier(2)
    results = {}

    def _attempt(name, payload, user):
        db = SessionLocal()
        try:
            barrier.wait(timeout=5)
            try:
                order = order_crud.create_order(db, payload, user_id=user.id)
                results[name] = ("ok", order.id)
            except order_crud.OutOfStockError as exc:
                db.rollback()
                results[name] = ("out_of_stock", str(exc))
        finally:
            db.close()

    t_a = threading.Thread(target=_attempt, args=("a", payload_a, buyer_a))
    t_b = threading.Thread(target=_attempt, args=("b", payload_b, buyer_b))
    t_a.start()
    t_b.start()
    t_a.join(timeout=10)
    t_b.join(timeout=10)

    outcomes = [results["a"][0], results["b"][0]]
    assert outcomes.count("ok") == 1, f"exactly one attempt should succeed, got {results}"
    assert outcomes.count("out_of_stock") == 1, f"exactly one attempt should fail with OutOfStockError, got {results}"

    db = SessionLocal()
    try:
        refreshed_product = db.query(Product).filter(Product.id == product["id"]).first()
        assert refreshed_product.stock == 0, f"stock must be exactly 0, got {refreshed_product.stock}"
        assert refreshed_product.stock >= 0, "stock must never go negative"

        orders_for_product = (
            db.query(Order)
            .join(Order.items)
            .filter(Order.razorpay_payment_id.in_(["pay_concurrent_a", "pay_concurrent_b"]))
            .all()
        )
        assert len(orders_for_product) == 1, "only the winning attempt should have created an order"
    finally:
        db.close()


# ---------------------------------------------------------------------------
# (c) Server-side price recomputation
# ---------------------------------------------------------------------------
def test_tampered_client_price_is_ignored(client):
    owner_hdrs = _owner_headers(client)
    product = _make_product(client, owner_hdrs, name="Tamper Test Saree", price=1500, stock=5)
    user = _register_customer(client)

    # Client claims the item costs 1 rupee and the total is 1 rupee — the
    # real DB price is 1500. Mode is Delivery so the server-side delivery
    # fee also has to be reflected correctly, another number the client
    # never gets to set.
    payload = _order_create(
        product, user, payment_id="pay_tamper_test", qty=1, price=1, total=1, mode="Delivery"
    )

    db = SessionLocal()
    try:
        order = order_crud.create_order(db, payload, user_id=user.id)
        from app.config import settings

        expected_total = product["price"] * 1 + settings.DELIVERY_FEE
        assert order.total == expected_total, (
            f"total must reflect the real DB price + delivery fee ({expected_total}), "
            f"not the tampered client value (got {order.total})"
        )
        assert order.items[0].price == product["price"], (
            "persisted line price must be the DB price, not the client's tampered price"
        )
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
