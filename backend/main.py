from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import admin, auth, orders, products
from app.seed_data import seed_if_empty, seed_owner

# Import models so SQLAlchemy metadata knows about them before create_all
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


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
        seed_owner(db)
    finally:
        db.close()


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(admin.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "rubyz-ensemble-api"}
