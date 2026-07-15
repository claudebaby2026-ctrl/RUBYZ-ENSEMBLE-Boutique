# RUBYZ Ensemble Boutique

RUBYZ Ensemble Boutique is a polished luxury e-commerce experience built with a modern storefront and an owner-facing dashboard. The project is split into a Next.js frontend and a FastAPI backend so the UI and API can evolve independently.

## Features

- Premium boutique-style storefront experience
- Product collection and product detail pages
- Cart and checkout flow
- Owner dashboard overview
- FastAPI backend with product, order, and admin endpoints

## Project Structure

- [frontend](frontend) — Next.js app for the storefront and dashboard
- [backend](backend) — FastAPI API service
- [frontend/package.json](frontend/package.json) — frontend dependencies and scripts
- [backend/main.py](backend/main.py) — API routes and sample data

## Prerequisites

- Node.js 20+
- npm
- Python 3.11+
- pip

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open http://localhost:8000/docs for the interactive API documentation.

## API Endpoints

- GET /health
- GET /products
- GET /products/{product_id}
- GET /orders
- POST /orders
- GET /admin/dashboard

## Notes

The frontend and backend are currently separate services. The frontend can be connected to the API later for live product and order data.
