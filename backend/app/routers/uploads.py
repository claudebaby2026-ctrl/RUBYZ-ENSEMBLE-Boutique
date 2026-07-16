from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.models.user import User
from app.security import get_current_owner
from app.services.storage import save_image

router = APIRouter(prefix="/uploads", tags=["uploads"])

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
    upload real product photos. Returns a URL that can be stored on the
    product's `images` list — a full R2 URL if Cloudflare R2 is configured,
    otherwise a local /static/uploads path resolved against the API origin."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WEBP or GIF images are allowed.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 8MB.")

    extension = ALLOWED_CONTENT_TYPES[file.content_type]
    url = save_image(contents, extension, file.content_type)

    return {"url": url}