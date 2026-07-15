from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    phone: Optional[str] = ""
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    phone: str = ""
    role: Literal["owner", "customer"]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
