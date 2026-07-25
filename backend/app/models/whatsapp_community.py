from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class WhatsAppCommunityMember(Base):
    """A name + WhatsApp number captured from the homepage "Join our WhatsApp
    community" form.

    Every submission also triggers a notification email (see
    app/services/email.py) so the store owner can manually add the number to
    the WhatsApp broadcast list / status audience and save it for future
    order updates. This table is just the durable record of who signed up.
    """

    __tablename__ = "whatsapp_community_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    whatsapp_number = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
