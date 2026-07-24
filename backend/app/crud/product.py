from typing import List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.crud.attribute import ensure_attribute
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

# Product fields that double as taxonomy values (see app/models/attribute.py).
# NOTE: category is handled separately below (every entry in the plural
# `categories` list is synced under the same "category" attribute type),
# so it isn't repeated in this tuple.
_ATTRIBUTE_FIELDS = ("occasion", "color", "fabric")


def _clean_categories(values: List[str]) -> List[str]:
    seen: List[str] = []
    for value in values:
        value = (value or "").strip()
        if value and value not in seen:
            seen.append(value)
    return seen


def _resolve_categories(values: dict) -> None:
    """Keep `category` (singular, legacy) and `categories` (plural, new)
    in sync in-place on `values` before it hits the ORM.

    - If `categories` was provided (multi-select actually used), it wins:
      clean it up, and re-derive `category` as its first item so every
      existing single-category code path (shipping defaults, the
      storefront's single-category filter, TAILORING_CATEGORY checks,
      etc.) keeps seeing exactly what it always has.
    - If only `category` was provided (old-style caller, or the
      multi-select wasn't touched), derive `categories` from it so the
      column is never left null/out of sync.
    """
    if "categories" in values and values["categories"] is not None:
        cleaned = _clean_categories(values["categories"])
        if not cleaned and values.get("category"):
            # Guard against an accidental empty multi-select payload wiping
            # out an otherwise-valid single category.
            cleaned = [values["category"].strip()]
        if cleaned:
            values["categories"] = cleaned
            values["category"] = cleaned[0]
    elif "category" in values and values["category"]:
        values["categories"] = [values["category"].strip()]


def _sync_attributes(db: Session, values: dict) -> None:
    for category in values.get("categories") or []:
        ensure_attribute(db, "category", category)
    for field in _ATTRIBUTE_FIELDS:
        if field in values:
            ensure_attribute(db, field, values[field])


def get_products(db: Session, category: Optional[str] = None) -> List[Product]:
    query = db.query(Product)
    if category:
        # JSON containment isn't portable across SQLite/Postgres here, so
        # match on the legacy single `category` column (always kept as
        # categories[0]) OR a LIKE scan of the serialized `categories`
        # list — cheap and good enough at this catalog's scale, and keeps
        # a product findable by ANY of its categories, not just its first.
        query = query.filter(
            or_(
                Product.category == category,
                Product.categories.like(f'%"{category}"%'),
            )
        )
    return query.order_by(Product.id).all()


def get_product(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def get_product_by_slug(db: Session, slug: str) -> Optional[Product]:
    return db.query(Product).filter(Product.slug == slug).first()


def create_product(db: Session, product: ProductCreate) -> Product:
    data = product.model_dump()
    _resolve_categories(data)
    db_product = Product(**data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    _sync_attributes(db, data)
    return db_product


def update_product(
    db: Session, db_product: Product, updates: ProductUpdate
) -> Product:
    changes = updates.model_dump(exclude_unset=True)
    _resolve_categories(changes)
    for field, value in changes.items():
        setattr(db_product, field, value)
    db.commit()
    db.refresh(db_product)
    _sync_attributes(db, changes)
    return db_product


def delete_product(db: Session, db_product: Product) -> None:
    db.delete(db_product)
    db.commit()


def count_low_stock(db: Session, threshold: int = 3) -> int:
    return db.query(Product).filter(Product.stock <= threshold).count()
