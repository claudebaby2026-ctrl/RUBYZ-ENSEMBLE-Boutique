from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class HomepageConfig(Base):
    """Singleton row (id is always 1) holding the storefront's editable
    homepage content — hero copy plus which products are featured."""

    __tablename__ = "homepage_config"

    id = Column(Integer, primary_key=True, index=True)
    hero_heading = Column(String, default="Where Elegance Meets Tradition")
    hero_subheading = Column(
        String,
        default="Handcrafted ensembles for the moments that matter most.",
    )
    banner_text = Column(String, default="")
    # Uploaded via the dashboard's Homepage Editor (reuses the same
    # /uploads/image endpoint product photos use). Stored the same way as
    # product images: a path/URL resolved against the API origin by the
    # frontend's resolveImageUrl(). Null/blank means "no custom hero photo
    # set" — the storefront falls back to the original solid background.
    hero_image = Column(String, nullable=True)
    # Up to 3 additional hero photos (hero_image is always slot 1). When
    # more than one slot is filled, the storefront hero cross-fades between
    # them on a timer instead of showing a single static photo. Each slot
    # is independent and nullable so the owner can add/remove/replace any
    # one of the four without disturbing the others.
    hero_image_2 = Column(String, nullable=True)
    hero_image_3 = Column(String, nullable=True)
    hero_image_4 = Column(String, nullable=True)
    # Comma-separated product ids, kept simple since this is a single-row
    # config table (no need for a join table for one editable list).
    featured_product_ids = Column(Text, default="")
    # "Celebrity Inspired Looks" section on the storefront homepage — the two
    # designer-inspired cards. Same upload/resolve pattern as hero_image.
    look_image_manish = Column(String, nullable=True)
    look_image_sabyasachi = Column(String, nullable=True)
    # "Tailoring that feels personal" section photo. Same pattern as above.
    tailoring_image = Column(String, nullable=True)
