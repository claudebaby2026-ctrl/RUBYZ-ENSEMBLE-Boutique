from typing import List

from sqlalchemy.orm import Session

from app.models.homepage import HomepageConfig
from app.schemas.homepage import HomepageConfigUpdate


def _parse_ids(raw: str) -> List[int]:
    if not raw:
        return []
    return [int(x) for x in raw.split(",") if x.strip().isdigit()]


def get_config(db: Session) -> HomepageConfig:
    config = db.query(HomepageConfig).filter(HomepageConfig.id == 1).first()
    if not config:
        config = HomepageConfig(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def to_out_dict(config: HomepageConfig) -> dict:
    return {
        "hero_heading": config.hero_heading,
        "hero_subheading": config.hero_subheading,
        "banner_text": config.banner_text or "",
        "featured_product_ids": _parse_ids(config.featured_product_ids or ""),
    }


def update_config(db: Session, payload: HomepageConfigUpdate) -> HomepageConfig:
    config = get_config(db)
    config.hero_heading = payload.hero_heading
    config.hero_subheading = payload.hero_subheading
    config.banner_text = payload.banner_text
    config.featured_product_ids = ",".join(str(i) for i in payload.featured_product_ids)
    db.commit()
    db.refresh(config)
    return config
