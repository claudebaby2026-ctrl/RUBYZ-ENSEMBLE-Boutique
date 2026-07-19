from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.migrations import run_migrations
from app.routers import (
    admin,
    attributes,
    auth,
    coupons,
    homepage,
    likes,
    orders,
    products,
    uploads,
)
from app.seed_data import seed_attributes, seed_if_empty, seed_owner

# Import models so SQLAlchemy metadata knows about them before create_all
from app.models import attribute as _attribute_models  # noqa: F401
from app.models import coupon as _coupon_models  # noqa: F401
from app.models import homepage as _homepage_models  # noqa: F401
from app.models import like as _like_models  # noqa: F401
from app.models import order as _order_models  # noqa: F401
from app.models import product as _product_models  # noqa: F401
from app.models import user as _user_models  # noqa: F401

app = FastAPI(title="RUBYZ Ensemble API", version="2.0.0")

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
        seed_if_empty(db)
        seed_owner(db)
        seed_attributes(db)
    finally:
        db.close()


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(uploads.router)
app.include_router(likes.router)
app.include_router(attributes.router)
app.include_router(coupons.router)
app.include_router(homepage.router)

@app.head("/health")    
@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "rubyz-ensemble-api"}
