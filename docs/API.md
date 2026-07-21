# API Reference

Base URL: `https://rubyz-ensemble-boutique.onrender.com` in production,
`http://localhost:8000` locally. Interactive docs are also available at
`/docs` (Swagger UI) on either.

Auth is a JWT bearer token (`Authorization: Bearer <token>`), obtained
from `/auth/login` or `/auth/register`. Two roles: `owner` and
`customer`. "Owner" below means the endpoint requires an owner-role
token; "Customer" means any signed-in account; "Public" means no token
needed.

## Auth (`/auth`)

| Method & path | Auth | Notes |
|---|---|---|
| `POST /auth/register` | Public | Creates a `customer` account. Rate-limited (5/15min per-IP and per-email) to prevent enumeration/abuse. Returns a token immediately. |
| `POST /auth/login` | Public | Same rate limiting as register. |
| `GET /auth/me` | Customer | Returns the current user for the given token. |

Owner accounts are **not** created through `/auth/register` — the single
owner account is seeded on backend startup from `OWNER_EMAIL`/
`OWNER_PASSWORD` (see SETUP.md).

## Products (`/products`)

| Method & path | Auth | Notes |
|---|---|---|
| `GET /products` | Public | Optional `?category=` filter. |
| `GET /products/slug/{slug}` | Public | Used by product detail pages. |
| `GET /products/{id}` | Public | |
| `POST /products` | Owner | 409 if the slug already exists. |
| `PUT /products/{id}` / `PATCH /products/{id}` | Owner | Both accepted; body fields are all optional (partial update). |
| `DELETE /products/{id}` | Owner | |

Creating/updating a product with a new `category`/`occasion`/`color`/
`fabric` value automatically adds it to the attribute taxonomy (see
below) — no separate step needed.

## Attributes (`/attributes`)

Taxonomy values (category/occasion/color/fabric) that power both the
storefront's filters and the dashboard's dropdowns.

| Method & path | Auth | Notes |
|---|---|---|
| `GET /attributes` | Public | Optional `?type=category\|occasion\|color\|fabric`. |
| `POST /attributes` | Owner | Adds a new value; no-ops (returns the existing row) if it already exists. |

## Orders (`/orders`)

| Method & path | Auth | Notes |
|---|---|---|
| `GET /orders` | Owner | Full order list, newest first. |
| `GET /orders/today` | Owner | Same data, filtered to orders placed today (UTC day boundary). |
| `POST /orders` | Customer | See "Checkout flow" below — this is where an order actually gets written. |
| `PATCH /orders/{display_id}/status` | Owner | Updates fulfillment status (e.g. `Pending` → `Confirmed` → `Shipped`). |

### Checkout flow

Checkout is two calls, both required in order:

1. **`POST /payments/create-razorpay-order`** (Customer) — body:
   `{ mode, items, couponCode? }`. The backend prices the cart from the
   database (ignoring anything the client claims about price), opens a
   matching Razorpay order, and returns `{ razorpayOrderId, amount,
   currency, keyId }`. Nothing is written to the `orders` table yet.
2. Frontend hands that to Razorpay's `checkout.js` modal. Once the
   customer completes payment, Razorpay's success handler fires with
   `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
3. **`POST /orders`** (Customer) — body: everything from step 1 plus
   customer details and the three Razorpay fields above. The backend:
   - HMAC-verifies the signature server-side (a forged/tampered
     signature is rejected — `400`)
   - Re-prices the cart from the DB again (never trusts the client's
     `total`/`price` fields)
   - Re-checks stock under a row lock and rejects (`400`) if it's no
     longer available
   - Is idempotent: replaying the same `razorpayPaymentId` returns the
     existing order rather than erroring or double-charging stock

A `400` from `POST /orders` after Razorpay already captured payment
(e.g. someone else bought the last unit while checkout was open) is
expected to be rare but possible — the payment auto-refunds via
Razorpay in that case; the frontend surfaces this to the customer.

If the browser never makes it back to `POST /orders` at all after
payment (closed tab, dropped connection, killed app), the money is
still captured but no order exists yet on our side. `POST
/payments/create-razorpay-order` snapshots the cart at step 1 for
exactly this case, and `POST /payments/webhooks/razorpay` (see below)
creates the order from that snapshot once Razorpay's `payment.captured`
webhook arrives.

## Payments (`/payments`)

| Method & path | Auth | Notes |
|---|---|---|
| `POST /payments/create-razorpay-order` | Customer | See checkout flow above. Returns `500` if Razorpay isn't configured, `502` if Razorpay's API itself errors. |
| `POST /payments/webhooks/razorpay` | Public, signature-verified | Reconciliation fallback for `payment.captured` events — creates the order if the customer's browser never made it back to `POST /orders` after Razorpay captured payment (e.g. tab closed, network drop). Verified via the `X-Razorpay-Signature` header, HMAC-SHA256 over the raw body keyed with `RAZORPAY_WEBHOOK_SECRET` (a different secret from `RAZORPAY_KEY_SECRET`). Returns `503` if unconfigured, `401` on a bad/missing signature. Idempotent against `POST /orders` already having created the order (same `razorpayPaymentId` uniqueness check), and against Razorpay's own retries on non-2xx (this route always returns `200` for anything it can't act on — unmatched event, no pending checkout, already exists). Configure in the Razorpay Dashboard: Settings → Webhooks → add `payment.captured` pointed at this URL. |

## Coupons (`/coupons`)

| Method & path | Auth | Notes |
|---|---|---|
| `GET /coupons` | Owner | |
| `POST /coupons` | Owner | `400` if the code already exists. Code is normalized to uppercase. |
| `PATCH /coupons/{id}` | Owner | Partial update. |
| `DELETE /coupons/{id}` | Owner | |
| `GET /coupons/validate/{code}` | Public | Used by checkout to preview a coupon. Returns `404` for unknown/inactive (deliberately not distinguished, to avoid leaking which codes exist), `400` for expired/limit-reached. `POST /orders` re-runs these exact same checks server-side — a coupon can never be honored on an order under conditions this endpoint would reject. |

## Likes / wishlist (`/likes`)

| Method & path | Auth | Notes |
|---|---|---|
| `GET /likes` | Customer | Full product details for everything liked. |
| `GET /likes/ids` | Customer | Just the product IDs — lighter weight, used to render filled-in hearts on listings. |
| `POST /likes/{product_id}` | Customer | `404` if the product doesn't exist. |
| `DELETE /likes/{product_id}` | Customer | |

## Homepage editor (`/homepage`)

| Method & path | Auth | Notes |
|---|---|---|
| `GET /homepage` | Public | Hero heading/subheading, banner text, featured product IDs. |
| `PUT /homepage` | Owner | Full replace (not partial). |

## Uploads (`/uploads`)

| Method & path | Auth | Notes |
|---|---|---|
| `POST /uploads/image` | Owner | Multipart `file` field. JPEG/PNG/WEBP/GIF only, 8MB max. Returns `{ url }` — a full R2 URL in production, or a `/static/uploads/...` path locally (falls back to disk if R2 env vars aren't set). |

## Admin (`/admin`)

| Method & path | Auth | Notes |
|---|---|---|
| `GET /admin/dashboard` | Owner | `{ todayOrders, pendingOrders, revenueToday, lowStockItems }`. |
| `GET /admin/customers` | Owner | One row per customer account, aggregated from their order history — there's no separate customers table. |

## Health

| Method & path | Auth | Notes |
|---|---|---|
| `GET /health` / `HEAD /health` | Public | `{ status: "ok", service: "rubyz-ensemble-api" }` — used for uptime checks. |
