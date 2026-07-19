from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import homepage as homepage_crud
from app.database import get_db
from app.models.user import User
from app.schemas.homepage import HomepageConfigOut, HomepageConfigUpdate
from app.security import get_current_owner

router = APIRouter(prefix="/homepage", tags=["homepage"])


@router.get("", response_model=HomepageConfigOut)
def get_homepage(db: Session = Depends(get_db)):
    """Public — the storefront homepage reads this to render hero copy and
    the featured products module."""
    config = homepage_crud.get_config(db)
    return homepage_crud.to_out_dict(config)


@router.put("", response_model=HomepageConfigOut)
def update_homepage(
    payload: HomepageConfigUpdate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    config = homepage_crud.update_config(db, payload)
    return homepage_crud.to_out_dict(config)
