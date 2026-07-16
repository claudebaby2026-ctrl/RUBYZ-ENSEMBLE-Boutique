# RUBYZ Ensemble Boutique — Full-Stack Setup

## What changed
- **Database is now the single source of truth.** All mock/demo product and
  order arrays are gone. Data lives in SQLite via SQLAlchemy (`backend/rubyz.db`,
  auto-created on first run and seeded once with the original catalog).
- **Modular FastAPI backend**: `app/models`, `app/schemas`, `app/crud`,
  `app/routers`, `app/services`, `app/database.py`, `app/config.py`.
- **Full product CRUD** from the owner dashboard (`/dashboard` → Add Product,
  Inventory tab edit/delete) — all wired to real REST endpoints.
- **Next.js frontend talks to FastAPI** through `frontend/lib/api.ts` — no
  more static imports of product data.
- **Neon Postgres migration is a one-line change**: set `DATABASE_URL` in
  `backend/.env` to your Neon connection string. No code changes needed.

> If you have an existing `backend/rubyz.db` from before this pass, delete
> it (or point `DATABASE_URL` at a fresh database) before starting the
> server — the `products` and `orders` tables gained new columns
> (`images`, `email`, `address`) that a pre-existing SQLite file won't have.

## Run it

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # edit if needed
uvicorn main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```
Storefront: http://localhost:3000
Owner dashboard: http://localhost:3000/dashboard

## API endpoints
- `GET /products` — list all products (optional `?category=`)
- `GET /products/slug/{slug}` — single product by slug
- `GET /products/{id}` — single product by id
- `POST /products` — create (owner only, accepts an `images` array of URLs)
- `PUT /products/{id}` / `PATCH /products/{id}` — update (owner only)
- `DELETE /products/{id}` — delete (owner only)
- `POST /uploads/image` — owner-only image upload (multipart `file` field), returns `{ "url": "/static/uploads/<name>.jpg" }`; uploaded files are served back from `/static/uploads/...`
- `GET /orders`, `POST /orders` (accepts `email`/`address`), `PATCH /orders/{id}/status`
- `GET /admin/dashboard` — live stats (orders, revenue, low stock) computed from the DB

## Product photos
- The owner dashboard's **Add Product** and **Inventory → Edit** screens upload real photos via `POST /uploads/image`; files are saved to `backend/app/static/uploads/` and served publicly from `/static/uploads/...`.
- Products can have multiple photos (stored as a JSON `images` list). The storefront (product cards, product detail gallery, cart, dashboard inventory) all render the actual uploaded photo, falling back to a neutral placeholder only when a product has none.

## Cart & checkout
- The cart is now real, shared client-side state (`frontend/lib/cart.ts` + `frontend/lib/useCart.ts`), persisted to `localStorage` and kept in sync across the header badge, `/cart`, and `/checkout` via a custom event (same pattern as the existing auth state).
- Product detail pages let you pick a size/quantity and add to cart; `/cart` supports quantity changes, removal, and a delivery/pickup toggle with live totals; `/checkout` captures name/phone/email/address and calls the real `POST /orders` endpoint, which now also decrements product stock and updates `sold` counts.
- **Payment is intentionally still a stub.** The "Pay via Razorpay" button places the order in the database (status `Pending`) but does not call Razorpay — wire up `checkout.js` / order creation with Razorpay's SDK at the point marked in `frontend/app/checkout/page.tsx`.

## Known limitations / next steps
- Customers/Coupons/Homepage Editor tabs remain placeholders — no backing data model was requested for these yet.
- Razorpay payment capture itself isn't implemented (see above) — everything else in the purchase flow is.
