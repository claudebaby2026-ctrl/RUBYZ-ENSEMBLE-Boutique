from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    slug: str
    name: str
    category: str
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
    availability: str = "In stock"
    is_featured: bool = Field(default=False, alias="isFeatured")
    is_new: bool = Field(default=False, alias="isNew")
    is_bestseller: bool = Field(default=False, alias="isBestseller")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    """All fields optional — used for partial updates (PATCH)."""

    model_config = ConfigDict(populate_by_name=True)

    slug: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
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
    availability: Optional[str] = None
    is_featured: Optional[bool] = Field(default=None, alias="isFeatured")
    is_new: Optional[bool] = Field(default=None, alias="isNew")
    is_bestseller: Optional[bool] = Field(default=None, alias="isBestseller")


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
