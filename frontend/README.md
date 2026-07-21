# RUBYZ Ensemble — Frontend

Next.js 16 (App Router) + React 19 storefront and owner dashboard. Talks
to the FastAPI backend in `../backend` entirely over HTTP, through
`lib/api.ts` — see the [root README](../README.md) for the overall
architecture and [../docs/API.md](../docs/API.md) for the endpoints this
calls.

## Stack

- **Next.js 16 / React 19 / TypeScript**
- **Tailwind CSS v4**
- `framer-motion` — page/element animation
- `recharts` — dashboard analytics charts
- `lucide-react` — icons
- `react-hook-form` + `zod` — form handling/validation
- Deployed to **Cloudflare Workers** via `@opennextjs/cloudflare`
  (`wrangler.jsonc`), not Vercel

## Getting started

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local   # point at your backend
npm run dev
```

Open http://localhost:3000. See [../SETUP.md](../SETUP.md) for running
the backend alongside this.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` / `npm run start` | Standard Next.js production build / serve |
| `npm run lint` | ESLint |
| `npm run cf:preview` | Build for Cloudflare Workers (OpenNext) and preview locally |
| `npm run cf:deploy` | Build and deploy to Cloudflare Workers (production) |

## Structure

- `app/` — routed pages (App Router): storefront pages, `/dashboard`
  (owner-only), `/login`, legal/compliance pages
- `components/` — UI components grouped by feature (`layout`, `product`,
  `collections`, `tailoring`, `ui` primitives)
- `lib/` — framework-agnostic browser helpers and the API client:
  - `api.ts` — typed fetch wrapper covering every backend endpoint;
    throws `ApiError` (with `.status`) on non-2xx responses
  - `auth.ts` / `useAuth.ts` — JWT session stored in `localStorage`,
    with a reactive hook that verifies against `/auth/me` in the
    background
  - `cart.ts` / `useCart.ts` — cart stored in `localStorage`, namespaced
    per signed-in account
  - `useLikes.ts` — wishlist state, backed by the API (not
    `localStorage` — likes are tied to the account)
  - `content.ts` — static site copy and taxonomy (categories, business/
    legal entity details for the compliance pages). **Not** product
    data — products only ever come from the API.

## Things worth knowing before you change something

- All product/order/coupon/homepage data comes from the API. The only
  hardcoded content is in `lib/content.ts` (brand copy, static category
  tags, legal-entity placeholder text, customer review quotes).
- The cart is namespaced per account (`lib/cart.ts`'s `cartKey()`), so a
  login/logout in the same browser tab points reads/writes at a different
  `localStorage` key — this is why `useCart` also listens for the
  `rubyz-auth-changed` event, not just its own cart event.
- Checkout (`app/checkout/page.tsx`) requires a signed-in account and
  redirects to `/login?redirect=/checkout` otherwise. It talks to
  Razorpay's `checkout.js` (loaded via `next/script`) — the two-step flow
  is: `POST /payments/create-razorpay-order` to get a priced Razorpay
  order, then `POST /orders` with the payment proof once Razorpay's modal
  reports success. The server, not this code, is what actually verifies
  the payment.
- The owner dashboard (`app/dashboard/page.tsx`) is one large client
  component (~1500 lines) with a section per feature (Home, Add Product,
  Inventory, Orders, Customers, Analytics, Coupons, Homepage Editor). It
  redirects non-owner sessions to `/login`, but the real access control is
  server-side (every mutating endpoint it calls requires an owner JWT).
