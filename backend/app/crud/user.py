from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRegister
from app.security import hash_password


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower()).first()


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, payload: UserRegister, role: str = "customer") -> User:
    db_user = User(
        name=payload.name,
        email=payload.email.lower(),
        phone=payload.phone or "",
        hashed_password=hash_password(payload.password),
        role=role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
