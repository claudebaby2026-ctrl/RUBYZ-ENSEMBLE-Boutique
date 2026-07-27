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


@router.delete("/{attribute_id}", status_code=204)
def delete_attribute(
    attribute_id: int,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    """Owner-only — removes a taxonomy value (e.g. a category) from the
    dashboard's dropdowns and storefront filters. Existing products that
    already used this value keep it as plain text; only the "is offered as
    an option" entry is removed."""
    attribute = attribute_crud.get_attribute_by_id(db, attribute_id)
    if not attribute:
        raise HTTPException(status_code=404, detail="Attribute not found")
    attribute_crud.delete_attribute(db, attribute)
