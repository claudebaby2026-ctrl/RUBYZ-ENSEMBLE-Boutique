from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import coupon as coupon_crud
from app.crud.coupon import CouponExpiredError, CouponLimitReachedError, CouponNotFoundError
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
    applying it to the cart total. Order creation (POST /orders)
    re-runs this exact same validation server-side before applying the
    discount, so a coupon can never be honored on an order under
    conditions this endpoint would reject."""
    try:
        return coupon_crud.validate_coupon(db, code)
    except CouponNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (CouponExpiredError, CouponLimitReachedError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
