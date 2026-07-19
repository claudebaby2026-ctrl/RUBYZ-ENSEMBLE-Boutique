from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.security import get_current_owner
from app.services.dashboard import get_dashboard_stats
from app.services.customers import get_customer_summaries

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
) -> dict:
    return get_dashboard_stats(db)


@router.get("/customers")
def admin_customers(
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
) -> List[dict]:
    # Customer accounts are derived from users + their orders rather than a
    # separate table, so this always reflects real checkout activity.
    return get_customer_summaries(db)
