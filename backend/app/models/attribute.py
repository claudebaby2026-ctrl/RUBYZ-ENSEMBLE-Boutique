from sqlalchemy import Column, Integer, String, UniqueConstraint

from app.database import Base


class Attribute(Base):
    """A single reusable taxonomy value (e.g. category="Party Wear",
    occasion="Diwali", color="Rose", fabric="Georgette").

    Products still store these as plain strings (see app/models/product.py)
    for simplicity, but every value that's ever been picked lives here too,
    so the owner dashboard and storefront filters can offer a dropdown of
    everything in use instead of relying on free text.
    """

    __tablename__ = "attributes"

    id = Column(Integer, primary_key=True, index=True)
    # One of: "category", "occasion", "color", "fabric".
    type = Column(String, nullable=False, index=True)
    value = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("type", "value", name="uq_attribute_type_value"),
    )
