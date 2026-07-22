from pydantic import BaseModel, EmailStr


class NewsletterSubscribeIn(BaseModel):
    email: EmailStr


class NewsletterSubscribeOut(BaseModel):
    subscribed: bool
    already_subscribed: bool = False
