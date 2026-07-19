"""Rate limiting for auth endpoints (brute-force / credential-stuffing
protection).

Two layers, deliberately kept independent:

1. Per-IP, via slowapi (`limiter`): stops a single client from hammering
   /auth/login or /auth/register. Applied with `@limiter.limit(...)` in
   app/routers/auth.py and wired up on the app in main.py.

2. Per-email, via `check_email_rate_limit` / `record_failed_attempt`:
   stops credential stuffing / account enumeration spread across many
   IPs (e.g. a botnet) targeting one victim account, which a purely
   per-IP limit would not catch.

Both are in-memory and process-local — fine for a single backend
instance/dev deployment. If you scale to multiple backend processes or
instances behind a load balancer, back both with Redis instead (slowapi
supports a `storage_uri="redis://..."` on the Limiter, and the per-email
tracker below would need swapping for a Redis sorted-set/INCR+EXPIRE
counter) so the counts are shared.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from threading import Lock

from fastapi import HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address

# --- Per-IP limiter (slowapi) --------------------------------------------

limiter = Limiter(key_func=get_remote_address)

# Shared string so the per-IP and per-email limits stay in sync; used as
# the slowapi decorator argument in app/routers/auth.py.
AUTH_RATE_LIMIT = "5/15minutes"

# --- Per-email limiter (lightweight, in-memory) --------------------------

_WINDOW = timedelta(minutes=15)
_MAX_ATTEMPTS = 5

_attempts: dict[str, list[datetime]] = defaultdict(list)
_lock = Lock()


def check_email_rate_limit(identifier: str) -> None:
    """Raise 429 if this email has already hit the attempt cap within the
    current window. Call this before verifying credentials."""
    key = identifier.strip().lower()
    now = datetime.now(timezone.utc)
    with _lock:
        attempts = [t for t in _attempts[key] if now - t < _WINDOW]
        _attempts[key] = attempts
        if len(attempts) >= _MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Too many attempts for this account. "
                    "Please try again in a few minutes."
                ),
            )


def record_failed_attempt(identifier: str) -> None:
    """Record a failed login/register attempt for this email. Only call
    this on failure — successful logins shouldn't count against the
    limit."""
    key = identifier.strip().lower()
    with _lock:
        _attempts[key].append(datetime.now(timezone.utc))
