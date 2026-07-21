from sqlalchemy import Column, Float, Integer, String

from app.database import Base


class ShippingDefault(Base):
    """Per-category shipping weight/dimension defaults, editable from the
    owner dashboard (never hardcoded in Python — see SHIPROCKET_INTEGRATION_SPEC.md).

    One row per real catalog category ("category" = the exact string used
    on Product.category, e.g. "Pakistani Suits"), plus a single special row
    with category = "__default__" for the store-wide fallback used by any
    category that doesn't have its own row yet.

    Resolution order when pricing/creating a shipment (see
    app/services/shiprocket.py::resolve_dimensions): per-product override
    (Product.weight/length/breadth/height) -> this table's per-category row
    -> this table's "__default__" row.

    Values seeded here (see app/seed_data.py::seed_shipping_defaults) are
    placeholders and must be corrected by the owner after actually weighing
    one representative item per category — they are not guaranteed accurate
    and should never be presented to the owner as such.
    """

    __tablename__ = "shipping_defaults"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, unique=True, index=True, nullable=False)
    weight = Column(Float, nullable=False)  # kg
    length = Column(Float, nullable=False)  # cm
    breadth = Column(Float, nullable=False)  # cm
    height = Column(Float, nullable=False)  # cm


# The sentinel category value for the store-wide fallback row.
STORE_WIDE_FALLBACK_KEY = "__default__"
