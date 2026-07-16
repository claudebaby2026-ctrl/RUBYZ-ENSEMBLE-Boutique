import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.models.user import User
from app.security import get_current_owner

router = APIRouter(prefix="/uploads", tags=["uploads"])

# backend/app/static/uploads — served publicly at /static/uploads/<file> so
# the storefront and dashboard can render images directly by URL.
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_FILE_SIZE = 8 * 1024 * 1024  # 8 MB


@router.post("/image")
async def upload_image(
    file: UploadFile,
    current_owner: User = Depends(get_current_owner),
) -> dict:
    """Owner-only endpoint used by the dashboard's Add/Edit Product forms to
    upload real product photos. Returns a relative URL that can be stored on
    the product's `images` list and resolved against the API origin."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WEBP or GIF images are allowed.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 8MB.")

    extension = ALLOWED_CONTENT_TYPES[file.content_type]
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename
    destination.write_bytes(contents)

    return {"url": f"/static/uploads/{filename}"}
