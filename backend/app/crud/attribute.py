from typing import List, Optional

from sqlalchemy.orm import Session

from app.crud.shipping_defaults import ensure_category_row
from app.models.attribute import Attribute


def get_attributes(db: Session, type: Optional[str] = None) -> List[Attribute]:
    query = db.query(Attribute)
    if type:
        query = query.filter(Attribute.type == type)
    return query.order_by(Attribute.value).all()


def get_attribute(db: Session, type: str, value: str) -> Optional[Attribute]:
    return (
        db.query(Attribute)
        .filter(Attribute.type == type, Attribute.value == value)
        .first()
    )


def create_attribute(db: Session, type: str, value: str) -> Attribute:
    existing = get_attribute(db, type, value)
    if existing:
        return existing
    attribute = Attribute(type=type, value=value)
    db.add(attribute)
    db.commit()
    db.refresh(attribute)
    if type == "category":
        # Give the new category a shipping_defaults row immediately so it
        # shows up on the dashboard's Shipping Defaults page instead of
        # silently riding the __default__ fallback forever.
        ensure_category_row(db, value)
    return attribute


def ensure_attribute(db: Session, type: str, value: Optional[str]) -> None:
    """Upsert a taxonomy value without raising or returning anything.

    Used whenever a product is created/updated so any category, occasion,
    color, or fabric typed/selected for that product is automatically
    available as an option next time — even if it didn't go through the
    explicit "add new" flow.
    """
    value = (value or "").strip()
    if not value:
        return
    create_attribute(db, type, value)
