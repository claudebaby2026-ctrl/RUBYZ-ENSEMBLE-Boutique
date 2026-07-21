from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import shipping_defaults as shipping_defaults_crud
from app.database import get_db
from app.models.user import User
from app.schemas.shipping import (
    ShippingDefaultRow,
    ShippingDefaultsOut,
    ShippingDefaultsUpdate,
)
from app.security import get_current_owner

router = APIRouter(prefix="/shipping-defaults", tags=["shipping"])


@router.get("", response_model=ShippingDefaultsOut)
def get_shipping_defaults(
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    """Owner-only. Backs the dashboard's "Shipping Defaults" section — five
    per-category rows plus the store-wide fallback row. Values shown here
    may still be the seeded placeholders (see
    SHIPROCKET_INTEGRATION_SPEC.md) until the owner corrects them."""
    rows = shipping_defaults_crud.get_all(db)
    return ShippingDefaultsOut(rows=[ShippingDefaultRow.model_validate(r) for r in rows])


@router.put("", response_model=ShippingDefaultsOut)
def update_shipping_defaults(
    payload: ShippingDefaultsUpdate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(get_current_owner),
):
    """Full replace, same style as PUT /homepage — the dashboard always
    sends every row back together. No code deploy needed to correct a
    weight."""
    rows = shipping_defaults_crud.replace_all(db, payload)
    return ShippingDefaultsOut(rows=[ShippingDefaultRow.model_validate(r) for r in rows])
