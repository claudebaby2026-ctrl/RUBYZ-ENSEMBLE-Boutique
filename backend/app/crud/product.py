from typing import List, Optional

from sqlalchemy.orm import Session

from app.crud.attribute import ensure_attribute
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

# Product fields that double as taxonomy values (see app/models/attribute.py).
_ATTRIBUTE_FIELDS = ("category", "occasion", "color", "fabric")


def _sync_attributes(db: Session, values: dict) -> None:
    for field in _ATTRIBUTE_FIELDS:
        if field in values:
            ensure_attribute(db, field, values[field])


def get_products(db: Session, category: Optional[str] = None) -> List[Product]:
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    return query.order_by(Product.id).all()


def get_product(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def get_product_by_slug(db: Session, slug: str) -> Optional[Product]:
    return db.query(Product).filter(Product.slug == slug).first()


def create_product(db: Session, product: ProductCreate) -> Product:
    data = product.model_dump()
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
