# Local Development Setup

This document is about running the app **locally**. Production already has
every environment variable configured (Render for the backend, Cloudflare
Workers for the frontend, Neon Postgres, Cloudflare R2, live Razorpay keys)
— none of this is needed to deploy, only to develop against your own copy.

## Prerequisites

- Node.js 20+
- npm
- Python 3.11+
- pip

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values — see table below
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API docs: http://localhost:8000/docs

With no `.env` at all, the backend still boots: it falls back to a local
SQLite file (`backend/rubyz.db`), local-disk image storage, and a
zero-config JWT secret. You only need to fill in `.env` for the pieces
you're actually testing (e.g. Razorpay keys to test checkout, R2 creds to
test image uploads to the cloud instead of disk).

### Environment variables (`backend/.env`)

| Variable | Purpose | If unset, locally |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | Falls back to `sqlite:///./rubyz.db` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `*` |
| `DELIVERY_FEE` | Flat delivery fee in ₹, must match `frontend/lib/cart.ts`'s `DELIVERY_FEE` | `150` |
| `JWT_SECRET` | Signs auth tokens | Insecure dev-only fallback — **must** be overridden anywhere real, but production already has this handled |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `10080` (7 days) |
| `OWNER_EMAIL`, `OWNER_PASSWORD`, `OWNER_NAME` | Seeded owner account, created on first boot if no owner exists | `owner@rubyzensemble.in` / `RubyzOwner@123` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Cloudflare R2 image storage — **all five** required together | If any is missing, image uploads fall back to local disk (`backend/app/static/uploads`), served from `/static/uploads/...` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Payment gateway — use **Test Mode** keys locally | If unset, `/payments/create-razorpay-order` returns a 500 |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies `POST /payments/webhooks/razorpay` (Razorpay Dashboard → Settings → Webhooks → your webhook's secret — **not** the same value as `RAZORPAY_KEY_SECRET`) | If unset, the webhook route returns a 503; checkout itself still works, you just lose the browser-drops-after-payment fallback |

Change `OWNER_PASSWORD` from the default immediately in any environment
that isn't purely local/throwaway.

## Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

- Storefront: http://localhost:3000
- Owner dashboard: http://localhost:3000/dashboard — log in with the
  seeded owner account above

## Database & migrations

There's no Alembic. `backend/app/migrations.py` hand-rolls the handful of
`ALTER TABLE` statements needed for columns added after the initial
launch, and runs automatically on startup (see `main.py::on_startup`).
Both SQLite and Postgres go through the same code path. On a brand-new
database, `Base.metadata.create_all` alone already creates the current
schema — the migrations only matter for upgrading an existing database.

On first run, startup also seeds (in `main.py::on_startup`):

- the initial product catalog (`backend/app/seed_data.py`) — **only** if
  the `products` table is completely empty; once anything exists, the
  database is the single source of truth and this is a no-op
- default taxonomy values for category/occasion/color/fabric — runs every
  startup, but is purely additive (never resets or removes an owner's
  changes)
- the owner account — created once if no `owner`-role user exists yet

## Testing

These run automatically in CI on every push/PR to `main` (see the
[CI section of the root README](README.md#ci)). To run them locally first,
install the extra test-only dependencies (not needed for `uvicorn` itself):

```bash
cd backend
pip install -r requirements-dev.txt   # adds pytest + httpx on top of requirements.txt
```

Then:

```bash
python test_coupons.py                       # coupon-at-checkout flow (ad-hoc script)
pytest test_order_integrity.py -v            # payment idempotency, oversell protection, price-tamper protection
pytest test_razorpay_webhook.py -v           # payment.captured webhook: happy path, idempotency, signature checks
```

All three spin up a throwaway on-disk SQLite database and monkeypatch
Razorpay signature verification/API calls, so no real Razorpay credentials
or network access are needed to run them.

## Deployment

- **Backend** → Render, deployed from `backend/`. Database is Neon
  Postgres; image storage is Cloudflare R2; Razorpay is live (not Test
  Mode). None of this needs local reproduction — it's already configured
  in Render's environment.
- **Frontend** → Cloudflare Workers, via OpenNext:
  ```bash
  cd frontend
  npm run cf:deploy    # runs opennextjs-cloudflare build && ... deploy
  ```
  `NEXT_PUBLIC_API_URL` for production is set in
  `frontend/wrangler.jsonc` under `vars`, currently pointing at
  `https://rubyz-ensemble-boutique.onrender.com`. To preview a Cloudflare
  Workers build locally before deploying, use `npm run cf:preview`.
