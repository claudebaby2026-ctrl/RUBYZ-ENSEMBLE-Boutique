from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.whatsapp_community import WhatsAppCommunityMember
from app.schemas.whatsapp_community import (
    WhatsAppCommunityJoinIn,
    WhatsAppCommunityJoinOut,
)
from app.services.email import send_email

router = APIRouter(prefix="/whatsapp-community", tags=["whatsapp-community"])


@router.post("/join", response_model=WhatsAppCommunityJoinOut, status_code=201)
def join(payload: WhatsAppCommunityJoinIn, db: Session = Depends(get_db)):
    member = WhatsAppCommunityMember(
        name=payload.name.strip(),
        whatsapp_number=payload.whatsapp_number.strip(),
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    # Best-effort notification — send_email() logs and swallows its own
    # failures, so a broken/missing SMTP setup never blocks the sign-up.
    send_email(
        subject="New WhatsApp community sign-up — RUBYZ Ensemble",
        body=(
            "A new visitor joined the WhatsApp community from the homepage form.\n\n"
            f"Name: {member.name}\n"
            f"WhatsApp number: {member.whatsapp_number}\n"
            f"Submitted at: {member.created_at.isoformat()} UTC\n\n"
            "Add this number to the WhatsApp broadcast list / status audience "
            "so they can view your status updates, and save it for future order "
            "communication."
        ),
    )

    return WhatsAppCommunityJoinOut(joined=True)
