from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import attribute as attribute_crud
from app.database import get_db
from app.models.user import User
from app.schemas.attribute import ATTRIBUTE_TYPES, AttributeCreate, AttributeOut
from app.security import get_current_owner

router = APIRouter(prefix="/attributes", tags=["attributes"])


@router.get("", response_model=List[AttributeOut])
def list_attributes(type: Optional[str] = None, db: Session = Depends(get_db)):
    """Public — the storefront's filter sidebar reads these too, not just
    the owner dashboard."""
    if type and type not in ATTRIBUTE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid attribute type")
    return attribute_crud.get_attributes(db, type=type)


@router.post("", response_model=AttributeOut, status_code=201)
def create_attribute(
    payload: AttributeCreate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    """Owner-only — lets the dashboard's "Add new…" option persist a fresh
    category/occasion/color/fabric so it shows up everywhere afterwards."""
    if payload.type not in ATTRIBUTE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid attribute type")
    if not payload.value:
        raise HTTPException(status_code=400, detail="Value cannot be empty")
    return attribute_crud.create_attribute(db, payload.type, payload.value)
