from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate


def get_coupons(db: Session) -> List[Coupon]:
    return db.query(Coupon).order_by(Coupon.id.desc()).all()


def get_coupon(db: Session, coupon_id: int) -> Optional[Coupon]:
    return db.query(Coupon).filter(Coupon.id == coupon_id).first()


def get_coupon_by_code(db: Session, code: str) -> Optional[Coupon]:
    return db.query(Coupon).filter(Coupon.code == code.strip().upper()).first()


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
