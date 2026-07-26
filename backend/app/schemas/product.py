from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    slug: str
    name: str
    category: str
    # Full multi-category selection. Optional on input: if omitted, it's
    # derived from `category` (see crud/product.py's _resolve_categories),
    # so any existing caller that only ever sent `category` keeps working
    # exactly as before. When provided, `category` is re-derived from this
    # list's first element instead — the dropdown is the source of truth
    # when the person actually used it.
    categories: Optional[List[str]] = None
    fabric: str
    occasion: str
    color: str
    price: int
    mrp: int
    rating: float = 0.0
    sold: int = 0
    stock: int = 0
    badge: str = ""
    description: str = ""
    care: List[str] = []
    sizes: List[str] = []
    images: List[str] = []
    videos: List[str] = []
    availability: str = "In stock"
    is_featured: bool = Field(default=False, alias="isFeatured")
    is_new: bool = Field(default=False, alias="isNew")
    is_bestseller: bool = Field(default=False, alias="isBestseller")
    # Optional per-product Shiprocket shipping override. Left out of the
    # Add Product flow entirely; only ever set via Edit Product's
    # collapsed "Shipping override" section. None means "use the
    # category/store-wide default" — never treated as zero.
    weight: Optional[float] = None
    length: Optional[float] = None
    breadth: Optional[float] = None
    height: Optional[float] = None

    # RUBYZ keeps exactly one piece per suit — every product is either
    # in stock (1) or sold (0), never a multi-unit count. Clamp here so
    # this holds no matter what a client sends.
    @field_validator("stock")
    @classmethod
    def _cap_stock_at_one(cls, value: int) -> int:
        return max(0, min(1, value))


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    """All fields optional — used for partial updates (PATCH)."""

    model_config = ConfigDict(populate_by_name=True)

    slug: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    categories: Optional[List[str]] = None
    fabric: Optional[str] = None
    occasion: Optional[str] = None
    color: Optional[str] = None
    price: Optional[int] = None
    mrp: Optional[int] = None
    rating: Optional[float] = None
    sold: Optional[int] = None
    stock: Optional[int] = None
    badge: Optional[str] = None
    description: Optional[str] = None
    care: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    images: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    availability: Optional[str] = None
    is_featured: Optional[bool] = Field(default=None, alias="isFeatured")
    is_new: Optional[bool] = Field(default=None, alias="isNew")
    is_bestseller: Optional[bool] = Field(default=None, alias="isBestseller")
    weight: Optional[float] = None
    length: Optional[float] = None
    breadth: Optional[float] = None
    height: Optional[float] = None

    @field_validator("stock")
    @classmethod
    def _cap_stock_at_one(cls, value: Optional[int]) -> Optional[int]:
        if value is None:
            return value
        return max(0, min(1, value))


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
