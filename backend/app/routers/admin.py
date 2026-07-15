from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.security import get_current_owner
from app.services.dashboard import get_dashboard_stats

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
) -> dict:
    return get_dashboard_stats(db)
