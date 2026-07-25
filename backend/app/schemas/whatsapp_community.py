from pydantic import BaseModel, Field


class WhatsAppCommunityJoinIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    whatsapp_number: str = Field(min_length=6, max_length=20)


class WhatsAppCommunityJoinOut(BaseModel):
    joined: bool
