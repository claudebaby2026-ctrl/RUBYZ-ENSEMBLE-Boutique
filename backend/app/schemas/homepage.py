from typing import List

from pydantic import BaseModel, ConfigDict


class HomepageConfigUpdate(BaseModel):
    hero_heading: str
    hero_subheading: str
    banner_text: str = ""
    featured_product_ids: List[int] = []


class HomepageConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hero_heading: str
    hero_subheading: str
    banner_text: str
    featured_product_ids: List[int]
