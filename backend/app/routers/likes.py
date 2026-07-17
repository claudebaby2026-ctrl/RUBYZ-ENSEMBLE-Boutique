from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import like as like_crud
from app.crud import product as product_crud
from app.database import get_db
from app.models.user import User
from app.schemas.product import ProductOut
from app.security import get_current_user

router = APIRouter(prefix="/likes", tags=["likes"])


@router.get("", response_model=List[ProductOut])
def list_liked_products(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Full product details for everything the signed-in customer has liked
    — used to render the wishlist page."""
    return like_crud.get_liked_products(db, current_user.id)


@router.get("/ids", response_model=List[int])
def list_liked_product_ids(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Lightweight list of just the liked product IDs — used across product
    listings/cards to render a filled-in heart without fetching full product
    payloads twice."""
    return like_crud.get_liked_product_ids(db, current_user.id)


@router.post("/{product_id}", status_code=201)
def like_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    like_crud.add_like(db, current_user.id, product_id)
    return {"liked": True}


@router.delete("/{product_id}", status_code=204)
def unlike_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    like_crud.remove_like(db, current_user.id, product_id)
    return None
