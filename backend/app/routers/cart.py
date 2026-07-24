from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import cart as cart_crud
from app.database import get_db
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemOut, CartItemQuantityUpdate
from app.security import get_current_user

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=List[CartItemOut])
def get_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return cart_crud.get_cart_items(db, current_user.id)


@router.post("/items", response_model=List[CartItemOut], status_code=201)
def add_cart_item(
    payload: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_crud.add_item(db, current_user.id, payload)
    return cart_crud.get_cart_items(db, current_user.id)


@router.patch("/items/{product_id}/{size}", response_model=List[CartItemOut])
def update_cart_item(
    product_id: int,
    size: str,
    payload: CartItemQuantityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_crud.update_quantity(db, current_user.id, product_id, size, payload.quantity)
    return cart_crud.get_cart_items(db, current_user.id)


@router.delete("/items/{product_id}/{size}", response_model=List[CartItemOut])
def delete_cart_item(
    product_id: int,
    size: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_crud.remove_item(db, current_user.id, product_id, size)
    return cart_crud.get_cart_items(db, current_user.id)


@router.delete("", status_code=204)
def clear_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cart_crud.clear_cart(db, current_user.id)
    return None


@router.post("/merge", response_model=List[CartItemOut])
def merge_cart(
    payload: List[CartItemCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Called once right after login with whatever was in the guest's
    localStorage cart, so it isn't lost when the frontend switches over to
    the DB-backed cart for signed-in accounts."""
    return cart_crud.merge_items(db, current_user.id, payload)
