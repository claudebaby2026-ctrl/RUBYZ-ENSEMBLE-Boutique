from typing import Optional

from sqlalchemy.orm import Session

from app.models.pending_checkout import PendingCheckout
from app.schemas.order import RazorpayOrderCreate


def save_pending_checkout(
    db: Session,
    razorpay_order_id: str,
    payload: RazorpayOrderCreate,
    user_id: Optional[int],
) -> PendingCheckout:
    """Upsert on razorpay_order_id — a customer can reopen the same
    checkout modal for the same cart before paying, which must overwrite
    rather than duplicate."""
    snapshot = payload.model_dump_json()
    existing = get_pending_checkout(db, razorpay_order_id)
    if existing:
        existing.snapshot = snapshot
        existing.user_id = user_id
        existing.consumed = False
        db.commit()
        db.refresh(existing)
        return existing

    record = PendingCheckout(
        razorpay_order_id=razorpay_order_id,
        user_id=user_id,
        snapshot=snapshot,
        consumed=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_pending_checkout(db: Session, razorpay_order_id: str) -> Optional[PendingCheckout]:
    return (
        db.query(PendingCheckout)
        .filter(PendingCheckout.razorpay_order_id == razorpay_order_id)
        .first()
    )


def mark_consumed(db: Session, record: PendingCheckout) -> None:
    record.consumed = True
    db.commit()
