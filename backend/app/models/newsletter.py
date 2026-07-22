from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class NewsletterSubscriber(Base):
    """An email address captured from the homepage newsletter signup form.

    Intentionally minimal — this just gives the form somewhere real to
    write to instead of being purely decorative. Actually emailing this
    list (welcome email, campaigns, etc.) is a separate integration with
    an ESP (Mailchimp, Brevo, etc.) that the client needs to choose."""

    __tablename__ = "newsletter_subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
