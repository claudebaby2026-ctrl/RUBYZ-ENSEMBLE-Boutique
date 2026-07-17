from typing import List

from sqlalchemy.orm import Session

from app.models.like import Like
from app.models.product import Product


def get_liked_product_ids(db: Session, user_id: int) -> List[int]:
    rows = db.query(Like.product_id).filter(Like.user_id == user_id).all()
    return [row[0] for row in rows]


def get_liked_products(db: Session, user_id: int) -> List[Product]:
    return (
        db.query(Product)
        .join(Like, Like.product_id == Product.id)
        .filter(Like.user_id == user_id)
        .order_by(Like.id.desc())
        .all()
    )


def is_liked(db: Session, user_id: int, product_id: int) -> bool:
    return (
        db.query(Like)
        .filter(Like.user_id == user_id, Like.product_id == product_id)
        .first()
        is not None
    )


def add_like(db: Session, user_id: int, product_id: int) -> None:
    if is_liked(db, user_id, product_id):
        return
    db.add(Like(user_id=user_id, product_id=product_id))
    db.commit()


def remove_like(db: Session, user_id: int, product_id: int) -> None:
    db.query(Like).filter(Like.user_id == user_id, Like.product_id == product_id).delete()
    db.commit()
