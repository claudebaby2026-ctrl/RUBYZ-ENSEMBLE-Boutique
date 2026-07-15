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
- `POST /products` — create
- `PUT /products/{id}` / `PATCH /products/{id}` — update
- `DELETE /products/{id}` — delete
- `GET /orders`, `POST /orders`, `PATCH /orders/{id}/status`
- `GET /admin/dashboard` — live stats (orders, revenue, low stock) computed from the DB

## Known limitations / next steps
- Cart and checkout pages are still static mockups (no shared cart state or
  payment integration) — they weren't part of the CRUD/database scope of
  this pass, but `POST /orders` is ready to be wired up whenever cart state
  is added.
- Customers/Coupons/Homepage Editor tabs remain placeholders — no backing
  data model was requested for these yet.
