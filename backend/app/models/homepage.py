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
    # Comma-separated product ids, kept simple since this is a single-row
    # config table (no need for a join table for one editable list).
    featured_product_ids = Column(Text, default="")
