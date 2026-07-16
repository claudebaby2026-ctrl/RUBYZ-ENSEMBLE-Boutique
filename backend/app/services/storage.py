"""Image storage backend for owner-uploaded product photos.

Uploads go to Cloudflare R2 (S3-compatible) when R2 credentials are set in
the environment. Otherwise this transparently falls back to writing the
file to backend/app/static/uploads, served by the app's own /static route
— so local dev with zero setup keeps working exactly as before.

Either way, save_image() returns a URL string ready to store on the
product's `images` list: a full https:// URL for R2, or a path like
"/static/uploads/<file>" for local storage. frontend/lib/api.ts's
resolveImageUrl() already passes full URLs through unchanged and prefixes
relative paths with the API origin, so no frontend changes are needed.
"""

import uuid
from pathlib import Path

from app.config import settings

# backend/app/static/uploads — used only when R2 isn't configured.
LOCAL_UPLOAD_DIR = Path(__file__).resolve().parent.parent / "static" / "uploads"

_r2_client = None


def _get_r2_client():
    """Lazily construct and cache the boto3 S3 client pointed at R2.

    Lazy so that `boto3` and the R2 credentials are only touched when R2 is
    actually enabled — importing this module never fails in local/SQLite-only
    setups that don't have boto3 installed configured.
    """
    global _r2_client
    if _r2_client is None:
        import boto3

        _r2_client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
    return _r2_client


def save_image(contents: bytes, extension: str, content_type: str) -> str:
    """Persist an uploaded image and return the URL to store on the product.

    `extension` should include the leading dot, e.g. ".jpg".
    """
    filename = f"{uuid.uuid4().hex}{extension}"

    if settings.R2_ENABLED:
        client = _get_r2_client()
        client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=f"uploads/{filename}",
            Body=contents,
            ContentType=content_type,
        )
        return f"{settings.R2_PUBLIC_URL}/uploads/{filename}"

    LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (LOCAL_UPLOAD_DIR / filename).write_bytes(contents)
    return f"/static/uploads/{filename}"