from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserLogin, UserOut, UserRegister
from app.security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Storefront customer sign-up. Owner accounts are seeded separately and
    cannot be created through this public endpoint."""
    if user_crud.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = user_crud.create_user(db, payload, role="customer")
    token = create_access_token(subject=str(user.id), role=user.role)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = user_crud.get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(subject=str(user.id), role=user.role)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
