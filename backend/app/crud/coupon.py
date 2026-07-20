from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate


class CouponValidationError(Exception):
    """Base class for coupon-validation failures shared by the public
    /coupons/validate/{code} endpoint and server-side checkout validation
    (see crud/order.py::create_order) — keeping the rules in one place
    means a coupon can never be applied to an order under conditions the
    validate endpoint itself would reject."""


class CouponNotFoundError(CouponValidationError):
    """No coupon with that code, or it's been deactivated. Mirrors the
    original endpoint's behavior of not distinguishing "doesn't exist"
    from "inactive" to avoid leaking which codes exist."""

    def __init__(self):
        super().__init__("Invalid or inactive coupon")


class CouponExpiredError(CouponValidationError):
    def __init__(self):
        super().__init__("This coupon has expired")


class CouponLimitReachedError(CouponValidationError):
    def __init__(self):
        super().__init__("This coupon has reached its usage limit")


def get_coupons(db: Session) -> List[Coupon]:
    return db.query(Coupon).order_by(Coupon.id.desc()).all()


def get_coupon(db: Session, coupon_id: int) -> Optional[Coupon]:
    return db.query(Coupon).filter(Coupon.id == coupon_id).first()


def get_coupon_by_code(db: Session, code: str, for_update: bool = False) -> Optional[Coupon]:
    query = db.query(Coupon).filter(Coupon.code == code.strip().upper())
    if for_update:
        # Row-locked read, mirroring the product-stock lock in
        # crud/order.py::create_order — without it two concurrent checkouts
        # racing for the last use of a limited coupon could both pass
        # validation and both increment used_count past the limit.
        # SQLite has no server-side locking (effectively single-writer), so
        # this is a no-op there and only matters on Postgres.
        query = query.with_for_update()
    return query.first()


def validate_coupon(db: Session, code: str, for_update: bool = False) -> Coupon:
    """Check a coupon against the same active/expiry/usage-limit rules
    everywhere it's used. Raises a CouponValidationError subclass instead
    of an HTTP exception so this module stays framework-agnostic; callers
    (the coupons router, or order creation) translate it into whatever
    error type fits their context."""
    coupon = get_coupon_by_code(db, code, for_update=for_update)
    if not coupon or not coupon.active:
        raise CouponNotFoundError()
    if coupon.expires_at:
        # SQLite doesn't preserve tzinfo, so normalize both sides to naive
        # UTC before comparing to avoid a naive/aware TypeError.
        expires = coupon.expires_at.replace(tzinfo=None)
        if expires < datetime.now(timezone.utc).replace(tzinfo=None):
            raise CouponExpiredError()
    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        raise CouponLimitReachedError()
    return coupon


def increment_usage(db: Session, coupon: Coupon) -> None:
    """Bumps used_count on an already-validated coupon. Caller is
    responsible for committing (order creation folds this into its single
    transaction alongside the order insert and stock decrements)."""
    coupon.used_count = (coupon.used_count or 0) + 1
    db.add(coupon)


def create_coupon(db: Session, payload: CouponCreate) -> Coupon:
    coupon = Coupon(**payload.model_dump())
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


def update_coupon(db: Session, coupon: Coupon, payload: CouponUpdate) -> Coupon:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(coupon, field, value)
    db.commit()
    db.refresh(coupon)
    return coupon


def delete_coupon(db: Session, coupon: Coupon) -> None:
    db.delete(coupon)
    db.commit()
