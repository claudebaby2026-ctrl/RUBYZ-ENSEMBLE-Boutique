from pydantic import BaseModel, ConfigDict, field_validator

# The four product fields that are editable via dropdown + "add new" in the
# owner dashboard, and used to power storefront filters.
ATTRIBUTE_TYPES = ("category", "occasion", "color", "fabric")


class AttributeCreate(BaseModel):
    type: str
    value: str

    @field_validator("value")
    @classmethod
    def strip_value(cls, value: str) -> str:
        return value.strip()


class AttributeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    value: str
