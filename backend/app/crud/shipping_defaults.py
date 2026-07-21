from typing import List

from sqlalchemy.orm import Session

from app.models.shipping_defaults import STORE_WIDE_FALLBACK_KEY, ShippingDefault
from app.schemas.shipping import ShippingDefaultsUpdate

# RUBYZ's real catalog categories (Tailoring Services excluded — see
# SHIPROCKET_INTEGRATION_SPEC.md #4). These are the placeholder starting
# points seeded on first boot; the owner must correct them after actually
# weighing one representative item per category (see
# app/models/shipping_defaults.py's docstring).
_SEED_ROWS = {
    "Summer Collection": (0.35, 30, 25, 5),
    "Pakistani Suits": (0.5, 30, 25, 5),
    "Party Wear": (0.7, 35, 28, 8),
    "Luxury Edit": (0.9, 35, 28, 8),
    "Wedding Collection": (1.35, 40, 30, 12),
    # Store-wide fallback, used for any category without its own row
    # (e.g. a future category added after this table was seeded).
    STORE_WIDE_FALLBACK_KEY: (0.5, 30, 25, 5),
}


def seed_defaults(db: Session) -> None:
    """Additive seed, safe to call on every startup (mirrors
    seed_attributes' style) — only inserts rows that don't exist yet, never
    overwrites an owner's corrections."""
    existing = {row.category for row in db.query(ShippingDefault.category).all()}
    added = False
    for category, (weight, length, breadth, height) in _SEED_ROWS.items():
        if category in existing:
            continue
        db.add(
            ShippingDefault(
                category=category,
                weight=weight,
                length=length,
                breadth=breadth,
                height=height,
            )
        )
        added = True
    if added:
        db.commit()


def get_all(db: Session) -> List[ShippingDefault]:
    return db.query(ShippingDefault).order_by(ShippingDefault.category).all()


def get_for_category(db: Session, category: str) -> ShippingDefault | None:
    return (
        db.query(ShippingDefault)
        .filter(ShippingDefault.category == category)
        .first()
    )


def get_fallback(db: Session) -> ShippingDefault | None:
    return get_for_category(db, STORE_WIDE_FALLBACK_KEY)


def replace_all(db: Session, payload: ShippingDefaultsUpdate) -> List[ShippingDefault]:
    """Full replace, same style as HomepageConfig's PUT — the dashboard's
    "Shipping Defaults" section always sends every row back together."""
    existing = {row.category: row for row in db.query(ShippingDefault).all()}
    for incoming in payload.rows:
        row = existing.get(incoming.category)
        if row:
            row.weight = incoming.weight
            row.length = incoming.length
            row.breadth = incoming.breadth
            row.height = incoming.height
        else:
            db.add(ShippingDefault(**incoming.model_dump()))
    db.commit()
    return get_all(db)
