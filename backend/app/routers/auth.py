from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.database import get_db
from app.models.user import User
from app.rate_limit import (
    AUTH_RATE_LIMIT,
    check_email_rate_limit,
    limiter,
    record_failed_attempt,
)
from app.schemas.user import Token, UserLogin, UserOut, UserRegister
from app.security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=201)
@limiter.limit(AUTH_RATE_LIMIT)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Storefront customer sign-up. Owner accounts are seeded separately and
    cannot be created through this public endpoint.

    Rate-limited the same as /auth/login: an unauthenticated "does this
    email already exist" 409 is itself an account-enumeration oracle, so
    register needs the same brute-force protection as login.
    """
    check_email_rate_limit(payload.email)
    if user_crud.get_user_by_email(db, payload.email):
        record_failed_attempt(payload.email)
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = user_crud.create_user(db, payload, role="customer")
    token = create_access_token(subject=str(user.id), role=user.role)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
@limiter.limit(AUTH_RATE_LIMIT)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    # Per-email limit catches credential stuffing spread across many IPs;
    # the @limiter.limit decorator above (per-IP) catches a single client
    # hammering the endpoint. Checked before verifying credentials so a
    # locked-out account doesn't even get a password comparison.
    check_email_rate_limit(payload.email)
    user = user_crud.get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        record_failed_attempt(payload.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(subject=str(user.id), role=user.role)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
