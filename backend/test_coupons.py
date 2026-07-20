"""Ad-hoc integration test for the coupon-at-checkout flow (fix #1).

Runs against a throwaway SQLite DB via FastAPI's TestClient. Not wired into
a test framework — just meant to be run directly with `python
test_coupons.py` to sanity-check the flow end-to-end.
"""
import os
import sys

os.environ["DATABASE_URL"] = "sqlite:///./test_coupons.db"

# Clean slate every run.
if os.path.exists("test_coupons.db"):
    os.remove("test_coupons.db")

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)
client.__enter__()


def expect(condition, message):
    if not condition:
        raise AssertionError(message)
    print(f"  OK: {message}")


def owner_headers():
    res = client.post(
        "/auth/login",
        json={"email": "owner@rubyzensemble.in", "password": "RubyzOwner@123"},
    )
    expect(res.status_code == 200, "owner login succeeds")
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def customer_headers(email):
    res = client.post(
        "/auth/register",
        json={"name": "Test Customer", "email": email, "password": "Password123!", "phone": "9999999999"},
    )
    expect(res.status_code == 201, "customer registers")
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def make_product(owner_hdrs, **overrides):
    payload = {
        "slug": f"test-product-{overrides.get('name', 'x')}".lower().replace(" ", "-"),
        "name": "Test Saree",
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
    expect(res.status_code == 201, f"product '{payload['name']}' created")
    return res.json()


print("=== Setup ===")
owner_hdrs = owner_headers()
product = make_product(owner_hdrs, name="Coupon Test Saree", price=1000, stock=5)

print("\n=== Coupon CRUD ===")
res = client.post(
    "/coupons",
    json={"code": "SAVE20", "discount_type": "percent", "discount_value": 20, "usage_limit": 1},
    headers=owner_hdrs,
)
expect(res.status_code == 201, "percent coupon SAVE20 (20%, usage_limit=1) created")
res = client.post(
    "/coupons",
    json={"code": "FLAT500", "discount_type": "flat", "discount_value": 500},
    headers=owner_hdrs,
)
expect(res.status_code == 201, "flat coupon FLAT500 (₹500 off) created")
res = client.post(
    "/coupons",
    json={"code": "INACTIVE10", "discount_type": "percent", "discount_value": 10, "active": False},
    headers=owner_hdrs,
)
expect(res.status_code == 201, "inactive coupon INACTIVE10 created")

print("\n=== GET /coupons/validate/{code} ===")
res = client.get("/coupons/validate/SAVE20")
expect(res.status_code == 200, "SAVE20 validates OK (public, no auth)")
res = client.get("/coupons/validate/save20")
expect(res.status_code == 200, "validate is case-insensitive")
res = client.get("/coupons/validate/NOPE")
expect(res.status_code == 404, "unknown code -> 404")
res = client.get("/coupons/validate/INACTIVE10")
expect(res.status_code == 404, "inactive coupon -> 404 (not silently ignored)")

print("\n=== POST /orders with a valid coupon (percent) ===")
cust_hdrs = customer_headers("coupon-customer@example.com")
order_payload = {
    "customerName": "Coupon Customer",
    "phone": "9876543210",
    "mode": "Pickup",
    "items": [{"productId": product["id"], "name": product["name"], "quantity": 2, "price": 999999}],
    # Deliberately wrong client-side total/price — server must ignore both.
    "total": 1,
    "couponCode": "save20",
}
res = client.post("/orders", json=order_payload, headers=cust_hdrs)
expect(res.status_code == 201, "order with valid coupon created")
order = res.json()
# subtotal = 1000 * 2 = 2000, 20% off = 400 discount, Pickup => no delivery fee
expect(order["total"] == 1600, f"total is subtotal(2000) - discount(400) = 1600 (got {order['total']})")
expect(order["discount"] == 400, f"discount recorded as 400 (got {order['discount']})")
expect(order["couponCode"] == "SAVE20", f"couponCode recorded as SAVE20 (got {order['couponCode']})")

print("\n=== used_count increments ===")
res = client.get("/coupons", headers=owner_hdrs)
save20 = next(c for c in res.json() if c["code"] == "SAVE20")
expect(save20["used_count"] == 1, f"SAVE20 used_count is now 1 (got {save20['used_count']})")

print("\n=== Coupon at its usage limit is rejected, order still blocked ===")
res = client.get("/coupons/validate/SAVE20")
expect(res.status_code == 400, "SAVE20 now over its usage_limit -> validate returns 400")
cust2_hdrs = customer_headers("coupon-customer-2@example.com")
order_payload2 = dict(order_payload)
order_payload2["items"] = [{"productId": product["id"], "name": product["name"], "quantity": 1, "price": 1}]
res = client.post("/orders", json=order_payload2, headers=cust2_hdrs)
expect(res.status_code == 400, "order creation blocked when coupon is over its usage limit")
expect(
    "usage limit" in res.json()["detail"].lower(),
    f"error message is clear about why: {res.json()['detail']}",
)

# Confirm stock/sold were NOT touched by the rejected order (nothing should
# be written on a failed coupon check).
res = client.get(f"/products/{product['id']}")
expect(res.json()["stock"] == 3, f"stock still 3 after rejected order (got {res.json()['stock']})")

print("\n=== Flat discount, and discount never exceeds subtotal ===")
product2 = make_product(owner_hdrs, name="Cheap Dupatta", price=200, stock=5)
order_payload3 = {
    "customerName": "Flat Coupon Customer",
    "phone": "9876500000",
    "mode": "Pickup",
    "items": [{"productId": product2["id"], "name": product2["name"], "quantity": 1, "price": 200}],
    "total": 200,
    "couponCode": "FLAT500",
}
res = client.post("/orders", json=order_payload3, headers=cust2_hdrs)
expect(res.status_code == 201, "order with flat coupon larger than subtotal still succeeds")
order3 = res.json()
expect(order3["total"] == 0, f"total clamped to 0, never negative (got {order3['total']})")
expect(order3["discount"] == 200, f"discount clamped to subtotal (200), not the full ₹500 (got {order3['discount']})")

print("\n=== Invalid/unknown coupon code blocks the order (not silently ignored) ===")
order_payload4 = {
    "customerName": "Bad Coupon Customer",
    "phone": "9876511111",
    "mode": "Pickup",
    "items": [{"productId": product2["id"], "name": product2["name"], "quantity": 1, "price": 200}],
    "total": 200,
    "couponCode": "DOES-NOT-EXIST",
}
res = client.post("/orders", json=order_payload4, headers=cust2_hdrs)
expect(res.status_code == 400, "unknown coupon code -> order rejected with 400")

print("\n=== Order with no coupon still works exactly as before ===")
order_payload5 = {
    "customerName": "No Coupon Customer",
    "phone": "9876522222",
    "mode": "Pickup",
    "items": [{"productId": product2["id"], "name": product2["name"], "quantity": 1, "price": 200}],
    "total": 200,
}
res = client.post("/orders", json=order_payload5, headers=cust2_hdrs)
expect(res.status_code == 201, "order without a coupon still succeeds")
order5 = res.json()
expect(order5["discount"] == 0, "discount is 0 when no coupon applied")
expect(order5["couponCode"] is None, "couponCode is null when no coupon applied")
expect(order5["total"] == 200, f"total is plain subtotal (got {order5['total']})")

print("\nAll coupon checkout tests passed.")
