from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


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
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(
    db: Session, db_product: Product, updates: ProductUpdate
) -> Product:
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_product, field, value)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, db_product: Product) -> None:
    db.delete(db_product)
    db.commit()


def count_low_stock(db: Session, threshold: int = 3) -> int:
    return db.query(Product).filter(Product.stock <= threshold).count()
