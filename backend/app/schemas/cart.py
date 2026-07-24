from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CartItemBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: int = Field(alias="productId")
    slug: str
    name: str
    image: Optional[str] = None
    price: int
    mrp: int
    size: str
    stock: Optional[int] = None
    quantity: int = 1
    category: Optional[str] = None


class CartItemCreate(CartItemBase):
    pass


class CartItemQuantityUpdate(BaseModel):
    quantity: int


class CartItemOut(CartItemBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
