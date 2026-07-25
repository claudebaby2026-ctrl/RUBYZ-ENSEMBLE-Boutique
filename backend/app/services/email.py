"""Minimal SMTP email sender used for internal notifications (currently just
the "join our WhatsApp community" homepage form).

Deliberately dependency-free — just Python's stdlib `smtplib`/`email`. If
SMTP isn't configured (see Settings.SMTP_ENABLED in app/config.py), sending
is skipped and a warning is logged instead of raising, so a missing/incorrect
SMTP setup never breaks the sign-up form itself — the row is still saved to
the database either way.
"""

import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger("app.email")


def send_email(subject: str, body: str, to: str | None = None) -> bool:
    """Send a plain-text email. Returns True on success, False otherwise.

    Never raises — callers (e.g. the whatsapp-community router) should not
    fail the user's request just because an email notification couldn't go
    out.
    """
    recipient = to or settings.WHATSAPP_COMMUNITY_NOTIFY_EMAIL

    if not settings.SMTP_ENABLED:
        logger.warning(
            "SMTP is not configured (set SMTP_HOST/SMTP_USER/SMTP_PASSWORD "
            "in backend/.env) — skipping email to %s: %s",
            recipient,
            subject,
        )
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", recipient)
        return False
