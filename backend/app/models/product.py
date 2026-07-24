from sqlalchemy import Boolean, Column, Float, Integer, String
from sqlalchemy.types import JSON

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    # Primary category — kept as a plain string (not derived) so every bit
    # of existing single-category logic keeps working untouched: storefront
    # filtering by a single category, shipping-default resolution
    # (app/services/shiprocket.py, app/services/shipment_creation.py, the
    # Shipping Defaults dashboard page), and the Attribute taxonomy sync.
    # Always kept equal to categories[0].
    category = Column(String, nullable=False, index=True)
    # Full set of categories a product belongs to (adds multi-category
    # support). Always contains at least `category` as its first element.
    # Additive — nothing that reads `category` needs to change; only
    # code that wants "all categories a product is in" reads this instead.
    categories = Column(JSON, default=list)
    fabric = Column(String, nullable=False)
    occasion = Column(String, nullable=False)
    color = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    mrp = Column(Integer, nullable=False)
    rating = Column(Float, default=0.0)
    sold = Column(Integer, default=0)
    stock = Column(Integer, default=0)
    badge = Column(String, default="")
    description = Column(String, default="")
    care = Column(JSON, default=list)
    sizes = Column(JSON, default=list)
    images = Column(JSON, default=list)
    videos = Column(JSON, default=list)
    availability = Column(String, default="In stock")
    is_featured = Column(Boolean, default=False)
    is_new = Column(Boolean, default=False)
    is_bestseller = Column(Boolean, default=False)
    # --- Optional per-product Shiprocket shipping override ---
    # Nullable, no default: absence means "fall through to the category/
    # store-wide shipping default" (see app/models/shipping_defaults.py),
    # NOT "zero weight/dimensions". Only ever set via the Edit Product
    # form's collapsed "Shipping override" section — never required, and
    # never surfaced in the Add Product flow.
    weight = Column(Float, nullable=True)  # kg
    length = Column(Float, nullable=True)  # cm
    breadth = Column(Float, nullable=True)  # cm
    height = Column(Float, nullable=True)  # cm
