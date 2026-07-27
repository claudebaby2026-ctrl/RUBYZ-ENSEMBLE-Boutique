from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class HomepageConfigUpdate(BaseModel):
    hero_heading: str
    hero_subheading: str
    banner_text: str = ""
    hero_image: Optional[str] = None
    hero_image_2: Optional[str] = None
    hero_image_3: Optional[str] = None
    hero_image_4: Optional[str] = None
    featured_product_ids: List[int] = []


class HomepageConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hero_heading: str
    hero_subheading: str
    banner_text: str
    hero_image: Optional[str] = None
    hero_image_2: Optional[str] = None
    hero_image_3: Optional[str] = None
    hero_image_4: Optional[str] = None
    featured_product_ids: List[int]
