from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import coupon as coupon_crud
from app.database import get_db
from app.models.user import User
from app.schemas.coupon import CouponCreate, CouponOut, CouponUpdate
from app.security import get_current_owner

router = APIRouter(prefix="/coupons", tags=["coupons"])


@router.get("", response_model=List[CouponOut])
def list_coupons(
    db: Session = Depends(get_db), current_owner: User = Depends(get_current_owner)
):
    return coupon_crud.get_coupons(db)


@router.post("", response_model=CouponOut, status_code=201)
def create_coupon(
    payload: CouponCreate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    if coupon_crud.get_coupon_by_code(db, payload.code):
        raise HTTPException(status_code=400, detail="A coupon with this code already exists")
    return coupon_crud.create_coupon(db, payload)


@router.patch("/{coupon_id}", response_model=CouponOut)
def update_coupon(
    coupon_id: int,
    payload: CouponUpdate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    coupon = coupon_crud.get_coupon(db, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon_crud.update_coupon(db, coupon, payload)


@router.delete("/{coupon_id}", status_code=204)
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    coupon = coupon_crud.get_coupon(db, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    coupon_crud.delete_coupon(db, coupon)


@router.get("/validate/{code}", response_model=CouponOut)
def validate_coupon(code: str, db: Session = Depends(get_db)):
    """Public — the storefront checkout calls this to check a code before
    applying it to the cart total."""
    coupon = coupon_crud.get_coupon_by_code(db, code)
    if not coupon or not coupon.active:
        raise HTTPException(status_code=404, detail="Invalid or inactive coupon")
    if coupon.expires_at:
        # SQLite doesn't preserve tzinfo, so normalize both sides to naive
        # UTC before comparing to avoid a naive/aware TypeError.
        expires = coupon.expires_at.replace(tzinfo=None)
        if expires < datetime.now(timezone.utc).replace(tzinfo=None):
            raise HTTPException(status_code=400, detail="This coupon has expired")
    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="This coupon has reached its usage limit")
    return coupon
