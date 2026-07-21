# RUBYZ Ensemble Boutique

A luxury ethnic-fashion e-commerce platform: a Next.js storefront + owner
dashboard backed by a FastAPI API. **This is live in production**, not a
demo — real customer accounts, real Razorpay payments, real inventory.

## Live architecture

| Layer | Technology | Where it runs |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19 | Cloudflare Workers, via OpenNext (`frontend/wrangler.jsonc`) |
| Backend | FastAPI + SQLAlchemy | Render (`https://rubyz-ensemble-boutique.onrender.com`) |
| Database | Postgres | Neon |
| Image storage | Cloudflare R2 | product photos uploaded from the owner dashboard |
| Payments | Razorpay | signature-verified server-side before any order is written |

The frontend talks to the backend entirely over HTTP through
`frontend/lib/api.ts` — there is no server-side rendering that touches the
database directly, and no shared code between the two beyond the API
contract.

## Repository structure

```
backend/
  main.py               FastAPI app setup, startup hooks (migrations + seeding)
  app/
    config.py            Settings loaded from environment
    database.py           SQLAlchemy engine/session (SQLite locally, Postgres in prod)
    migrations.py         Hand-rolled ALTER TABLE migrations (no Alembic)
    models/                SQLAlchemy models (User, Product, Order/OrderItem, Coupon, Like, Attribute, HomepageConfig)
    schemas/                Pydantic request/response models
    crud/                    DB access + business rules per resource
    routers/                  FastAPI route handlers, one file per resource
    services/                 Razorpay client, Cloudflare R2 / local file storage, dashboard + customer aggregation
    seed_data.py               Initial product catalog + default taxonomy + owner account, seeded on first boot
  test_coupons.py, test_order_integrity.py   Ad-hoc integration tests (see SETUP.md)

frontend/
  app/                    Routed pages (storefront + /dashboard + /login + legal pages)
  components/             UI components, grouped by feature
  lib/                    Framework-agnostic API client + localStorage-backed auth/cart + React hooks
```

## Features (verified against the current code)

### Storefront
- Product browsing by category, with a filter/attribute system (category,
  occasion, color, fabric) that's owner-editable, not hardcoded
- Product detail pages with an image gallery, size/quantity picker
- Cart, persisted in `localStorage`, namespaced per signed-in account (a
  "guest" cart when logged out) so switching accounts never leaks a
  cart between customers
- Customer accounts (JWT-based) — required to check out
- Wishlist ("likes"), tied to the account, not `localStorage`
- Coupons at checkout (percent or flat, with usage limits and expiry),
  validated the same way both when previewed and when the order is placed
- Real Razorpay checkout — not a stub. The backend independently prices
  the cart from the database and verifies Razorpay's payment signature
  before an order is ever written
- Legal pages (Privacy Policy, Terms & Conditions, Shipping Policy,
  Cancellation & Refund Policy) for Razorpay/Shiprocket verification.
  **Note:** `frontend/lib/content.ts`'s `legalEntity` object still has
  placeholder text (`[Legal / registered business name...]`, `[GSTIN, if
  registered]`) — these need to be filled in with the real registered
  business details before those pages will pass verification.

### Owner dashboard (`/dashboard`, owner-role accounts only)
- Home: at-a-glance stats (today's orders, pending orders, revenue, low stock)
- Add Product: multi-step form, image upload to R2, size/attribute pickers
- Inventory: edit/delete existing products
- Orders: full order list and "today" view, status updates
- Customers: derived from order history (no separate customers table)
- Analytics: charts over product/order data (via `recharts`)
- Coupons: full CRUD
- Homepage Editor: hero copy + which products are featured on the homepage

Access is gated both client-side (redirects non-owners away from
`/dashboard`) and — the part that actually matters for security —
server-side, via a `get_current_owner` dependency on every admin/product/
order-mutation endpoint.

### Backend safeguards worth knowing about
- **Nothing about price or stock is ever trusted from the client.** Every
  checkout re-prices the cart from the database and re-checks stock under
  a row lock immediately before writing the order.
- **Payment proof is cryptographically verified**, not taken on the
  client's word — `POST /orders` HMAC-verifies the Razorpay signature
  server-side before anything is written.
- **Idempotent order creation** — the same Razorpay payment can only ever
  produce one order, even if the client retries (double-click, timeout).
- **No overselling under concurrent checkouts** on Postgres, via
  `SELECT ... FOR UPDATE` on the product rows a checkout touches.
- **Rate limiting** on `/auth/login` and `/auth/register`, both per-IP and
  per-email, to blunt brute-force and credential-stuffing attempts.

## Getting started locally

See [SETUP.md](SETUP.md) for full local development instructions
(backend + frontend, environment variables, running the test scripts).

## API reference

See [docs/API.md](docs/API.md) for the full endpoint list, grouped by
resource, with auth requirements.
