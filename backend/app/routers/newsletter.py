from fastapi import APIRouter, Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.newsletter import NewsletterSubscriber
from app.schemas.newsletter import NewsletterSubscribeIn, NewsletterSubscribeOut

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


@router.post("/subscribe", response_model=NewsletterSubscribeOut, status_code=201)
def subscribe(payload: NewsletterSubscribeIn, db: Session = Depends(get_db)):
    email = payload.email.lower()
    existing = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.email == email).first()
    if existing:
        return NewsletterSubscribeOut(subscribed=True, already_subscribed=True)

    subscriber = NewsletterSubscriber(email=email)
    db.add(subscriber)
    try:
        db.commit()
    except IntegrityError:
        # Race with a concurrent signup of the same address — either way
        # the address ends up subscribed, so treat it as success.
        db.rollback()
        return NewsletterSubscribeOut(subscribed=True, already_subscribed=True)

    return NewsletterSubscribeOut(subscribed=True, already_subscribed=False)
