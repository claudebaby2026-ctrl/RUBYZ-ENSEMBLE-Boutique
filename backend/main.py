from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.migrations import run_migrations
from app.rate_limit import limiter
from app.routers import (
    admin,
    attributes,
    auth,
    coupons,
    homepage,
    likes,
    newsletter,
    orders,
    payments,
    products,
    shipping,
    shipping_defaults,
    uploads,
)
from app.seed_data import (
    seed_attributes,
    seed_if_empty,
    seed_owner,
    seed_shipping_defaults,
)

# Import models so SQLAlchemy metadata knows about them before create_all
from app.models import attribute as _attribute_models  # noqa: F401
from app.models import coupon as _coupon_models  # noqa: F401
from app.models import homepage as _homepage_models  # noqa: F401
from app.models import like as _like_models  # noqa: F401
from app.models import newsletter as _newsletter_models  # noqa: F401
from app.models import order as _order_models  # noqa: F401
from app.models import pending_checkout as _pending_checkout_models  # noqa: F401
from app.models import product as _product_models  # noqa: F401
from app.models import shipping_defaults as _shipping_defaults_models  # noqa: F401
from app.models import user as _user_models  # noqa: F401

app = FastAPI(title="RUBYZ Ensemble API", version="2.0.0")

# Rate limiting (brute-force protection on /auth/login and /auth/register —
# see app/rate_limit.py and app/routers/auth.py). Requests over the limit
# get a 429 via the handler below instead of an unhandled exception.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.app\.github\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
    db = SessionLocal()
    try:
        #seed_if_empty(db) # disabled before going customer-facing — don't reseed demo products
        seed_owner(db)
        seed_attributes(db)
        seed_shipping_defaults(db)
    finally:
        db.close()


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(uploads.router)
app.include_router(likes.router)
app.include_router(newsletter.router)
app.include_router(attributes.router)
app.include_router(coupons.router)
app.include_router(homepage.router)
app.include_router(shipping.router)
app.include_router(shipping_defaults.router)

@app.head("/health")    
@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "rubyz-ensemble-api"}
