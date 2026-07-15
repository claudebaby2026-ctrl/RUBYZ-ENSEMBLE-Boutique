from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import product as product_crud
from app.database import get_db
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.security import get_current_owner

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductOut])
def list_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    return product_crud.get_products(db, category=category)


@router.get("/slug/{slug}", response_model=ProductOut)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = product_crud.get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = product_crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductOut, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    if product_crud.get_product_by_slug(db, payload.slug):
        raise HTTPException(status_code=409, detail="Slug already exists")
    return product_crud.create_product(db, payload)


@router.put("/{product_id}", response_model=ProductOut)
@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    product = product_crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_crud.update_product(db, product, payload)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    product = product_crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product_crud.delete_product(db, product)
    return None
