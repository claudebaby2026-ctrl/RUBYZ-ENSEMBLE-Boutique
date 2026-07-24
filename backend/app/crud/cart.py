from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.cart import CartItem
from app.schemas.cart import CartItemCreate


def get_cart_items(db: Session, user_id: int) -> List[CartItem]:
    return db.query(CartItem).filter(CartItem.user_id == user_id).order_by(CartItem.id).all()


def _get_item(db: Session, user_id: int, product_id: int, size: str) -> Optional[CartItem]:
    return (
        db.query(CartItem)
        .filter(CartItem.user_id == user_id, CartItem.product_id == product_id, CartItem.size == size)
        .first()
    )


def add_item(db: Session, user_id: int, item: CartItemCreate) -> CartItem:
    """Upsert: bumps quantity (capped at stock) if this product+size is
    already in the cart, otherwise inserts a new row. Mirrors
    lib/cart.ts::addToCart's behavior exactly."""
    quantity = max(1, item.quantity or 1)
    existing = _get_item(db, user_id, item.product_id, item.size)
    if existing:
        cap = existing.stock if existing.stock is not None else 99
        existing.quantity = min(existing.quantity + quantity, cap)
        # Refresh the snapshot in case price/name/image/stock changed since
        # it was first added.
        existing.slug = item.slug
        existing.name = item.name
        existing.image = item.image
        existing.price = item.price
        existing.mrp = item.mrp
        existing.stock = item.stock
        existing.category = item.category
        db.commit()
        db.refresh(existing)
        return existing

    cap = item.stock if item.stock is not None else 99
    db_item = CartItem(
        user_id=user_id,
        product_id=item.product_id,
        slug=item.slug,
        name=item.name,
        image=item.image,
        price=item.price,
        mrp=item.mrp,
        size=item.size,
        stock=item.stock,
        quantity=min(quantity, cap),
        category=item.category,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_quantity(db: Session, user_id: int, product_id: int, size: str, quantity: int) -> None:
    item = _get_item(db, user_id, product_id, size)
    if not item:
        return
    if quantity <= 0:
        db.delete(item)
        db.commit()
        return
    cap = item.stock if item.stock is not None else 99
    item.quantity = min(quantity, cap)
    db.commit()


def remove_item(db: Session, user_id: int, product_id: int, size: str) -> None:
    db.query(CartItem).filter(
        CartItem.user_id == user_id, CartItem.product_id == product_id, CartItem.size == size
    ).delete()
    db.commit()


def clear_cart(db: Session, user_id: int) -> None:
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()


def merge_items(db: Session, user_id: int, items: List[CartItemCreate]) -> List[CartItem]:
    """Folds a guest's localStorage cart into the account's DB cart on
    login (see POST /cart/merge) — each incoming line is upserted the same
    way a normal add-to-cart would be."""
    for item in items:
        add_item(db, user_id, item)
    return get_cart_items(db, user_id)
