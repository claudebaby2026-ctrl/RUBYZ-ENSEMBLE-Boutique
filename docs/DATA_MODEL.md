# Data Model

An overview of how the tables relate. All models live in
`backend/app/models/`; the ORM is SQLAlchemy, and the same schema is used
on both SQLite (local dev) and Postgres (production/Neon) — see
`backend/app/database.py`.

```
User ──1───∞── Order ──1───∞── OrderItem
  │                              │
  │                              └──(product_id, nullable FK, no relationship)──▶ Product
  │
  └──1───∞── Like ──∞───1── Product

Coupon            (referenced from Order by code, not a real FK)
Attribute          (freeform taxonomy — see below)
HomepageConfig     (singleton row, id = 1)
```

## User

`app/models/user.py`

One account can be `role = "owner"` (exactly one exists, seeded from
`OWNER_EMAIL`/`OWNER_PASSWORD` on startup — see SETUP.md) or
`role = "customer"` (created via `POST /auth/register`). There's no
separate "customer" or "admin" table — everything customer-facing
(orders, likes) hangs off this same `users` table via `user_id`.

## Product

`app/models/product.py`

The single source of truth for the catalog. `category`, `occasion`,
`color`, and `fabric` are plain string columns on the product — **not**
foreign keys into `Attribute`. `images`, `care`, and `sizes` are stored as
JSON columns (lists), not normalized into their own tables — deliberate,
since none of them need independent querying.

`stock` and `sold` are mutated only by order creation
(`crud/order.py::create_order`) — never directly from the dashboard's
edit form in a way that bypasses the order flow.

## Order / OrderItem

`app/models/order.py`

- `Order` — one row per placed order. `user_id` is nullable (so
  pre-existing rows before accounts were required to check out still
  load), but every new order created today has one, since
  `POST /orders` requires a signed-in customer.
- `OrderItem` — one row per cart line. `product_id` is a nullable FK
  with **no `relationship()`** back to `Product` — order line items
  intentionally snapshot `name` and `price` at the moment of purchase,
  so they stay accurate even if the product is later edited, repriced,
  or deleted.
- `razorpay_payment_id` has a **unique index** — this is what makes order
  creation idempotent (a given Razorpay payment can only ever back one
  order; see `crud/order.py::create_order`'s docstring for the full
  reasoning). `razorpay_order_id` has no such constraint.
- `coupon_code` + `discount` are denormalized copies of what a `Coupon`
  produced at checkout time — there's no FK to `Coupon`, so a coupon can
  later be edited or deleted without corrupting historical orders.
- `payment_status` (`"paid"` by default) tracks the payment lifecycle;
  `status` (`"Pending"` → `"Confirmed"` → `"Shipped"` → ...) tracks
  fulfillment. These are independent columns on purpose — see the
  comment in the model.

## Like

`app/models/like.py`

Pure join table between `User` and `Product` (a customer "liking"/
wishlisting a product). Unique constraint on `(user_id, product_id)`
prevents duplicate likes; both FKs cascade on delete, so deleting a user
or product cleans up their likes automatically.

## Coupon

`app/models/coupon.py`

Standalone — not tied to any product or user. `discount_type` is
`"percent"` or `"flat"`; `usage_limit` is `None` for unlimited.
`used_count` is incremented exactly once, inside the same transaction as
order creation (`crud/order.py::create_order`), only after the order is
confirmed to actually exist — so it can never drift from real usage.

## Attribute

`app/models/attribute.py`

A denormalized convenience table: every `(type, value)` pair — one of
`category`/`occasion`/`color`/`fabric` — that's ever been used or
explicitly added, so the dashboard and storefront can offer a dropdown of
"everything in use" instead of free text. **Products do not reference
this table via FK** — a product's `category` etc. are still plain
strings. Creating or editing a product automatically upserts into
`Attribute` (`crud/product.py::_sync_attributes`) so nothing needs to be
added to both places manually. Renaming or deleting a value here does
**not** cascade to existing products — it only affects what shows up as
an option going forward.

## HomepageConfig

`app/models/homepage.py`

Singleton table (always `id = 1`) holding the storefront's editable
homepage hero copy and banner text. `featured_product_ids` is a
comma-separated string of product IDs rather than a join table —
deliberate, since this is a single editable list, not a many-to-many
relationship that needs independent querying.

## What's intentionally *not* modeled as a relation

- **Customers** — no dedicated table. `GET /admin/customers`
  (`services/customers.py`) derives one row per customer account by
  aggregating their `Order` history live, on every request.
- **Cart** — not in the database at all. It's client-side only
  (`frontend/lib/cart.ts`, `localStorage`), namespaced per account. The
  server only ever sees a cart's contents at the two checkout endpoints
  (`POST /payments/create-razorpay-order`, `POST /orders`), and it
  re-derives every price from `Product` rather than trusting what the
  client sends.
