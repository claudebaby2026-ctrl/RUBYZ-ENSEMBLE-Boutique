"""Email sender for internal notifications (currently just the "join our
WhatsApp community" homepage form) — uses Resend's HTTPS API rather than
raw SMTP.

Why not SMTP: Render's free web services block all outbound traffic to
SMTP ports (25, 465, 587) — see
https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports.
Regular HTTPS (port 443) is not blocked, so a provider with a plain REST
API — like Resend — works, while smtplib connecting to smtp.gmail.com
does not.

If RESEND_API_KEY isn't configured (see Settings.RESEND_ENABLED in
app/config.py), sending is skipped and a warning is logged instead of
raising, so a missing/incorrect setup never breaks the sign-up form
itself — the row is still saved to the database either way.
"""

import logging

import requests

from app.config import settings

logger = logging.getLogger("app.email")

RESEND_API_URL = "https://api.resend.com/emails"


def send_email(subject: str, body: str, to: str | None = None) -> bool:
    """Send a plain-text email via Resend. Returns True on success, False
    otherwise.

    Never raises — callers (e.g. the whatsapp-community router) should not
    fail the user's request just because an email notification couldn't go
    out.
    """
    recipient = to or settings.WHATSAPP_COMMUNITY_NOTIFY_EMAIL

    if not settings.RESEND_ENABLED:
        logger.warning(
            "Resend is not configured (set RESEND_API_KEY in backend/.env "
            "or your Render environment) — skipping email to %s: %s",
            recipient,
            subject,
        )
        return False

    try:
        response = requests.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.RESEND_FROM_EMAIL,
                "to": [recipient],
                "subject": subject,
                "text": body,
            },
            timeout=10,
        )
        response.raise_for_status()
        return True
    except Exception:
        logger.exception("Failed to send email to %s", recipient)
        return False
