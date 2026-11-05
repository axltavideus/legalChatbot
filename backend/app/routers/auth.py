"""Auth router — register, login, logout, me, profile update, change password, delete account."""
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import (
    RegisterRequest, LoginRequest, UserResponse, TokenResponse,
    ChangePasswordRequest, UpdateProfileRequest, CompleteOnboardingRequest,
    DeleteAccountRequest, InviteResponse,
)
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user,
)

router = APIRouter()

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # seconds


def _generate_unique_invite_code(db: Session) -> str:
    """Generate a unique personal referral code, e.g. LEX-7F3A2C."""
    for _ in range(10):
        code = "LEX-" + secrets.token_hex(3).upper()
        if not db.query(User).filter(User.invite_code == code).first():
            return code
    return "LEX-" + secrets.token_hex(4).upper()


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",          # lax allows navigation from external links
        secure=False,            # Set True behind HTTPS in production
        max_age=COOKIE_MAX_AGE,
    )


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    # Validate admin invite code
    if body.role == UserRole.admin:
        if body.invite_code != settings.ADMIN_INVITE_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kode undangan Admin tidak valid",
            )

    invite_code = _generate_unique_invite_code(db)

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
        institution=body.institution,
        invite_code=invite_code,
        referred_by=body.referred_by.strip() if body.referred_by else None,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email sudah terdaftar",
        )

    token = create_access_token({"sub": str(user.id)})
    _set_auth_cookie(response, token)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    # Constant-time comparison — always call verify_password even on miss
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Akun dinonaktifkan")

    token = create_access_token({"sub": str(user.id)})
    _set_auth_cookie(response, token)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return {"message": "Berhasil keluar"}


# ---------------------------------------------------------------------------
# Get current user (me)
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


# ---------------------------------------------------------------------------
# Update profile
# ---------------------------------------------------------------------------

@router.patch("/me", response_model=UserResponse)
def update_profile(
    body: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.name is not None:
        current_user.name = body.name.strip()
    if body.institution is not None:
        current_user.institution = body.institution
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------

@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password saat ini salah")
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password berhasil diubah"}


# ---------------------------------------------------------------------------
# Complete onboarding
# ---------------------------------------------------------------------------

@router.post("/complete-onboarding")
def complete_onboarding(
    body: CompleteOnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.acknowledged:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Harus menyetujui disclaimer")
    current_user.onboarding_completed = True
    db.commit()
    return {"message": "Onboarding selesai"}


# ---------------------------------------------------------------------------
# Invite & Referral (Undang Teman)
# ---------------------------------------------------------------------------

@router.get("/invite", response_model=InviteResponse)
def get_invite_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve or generate the user's personal invite code and referral count."""
    if not current_user.invite_code:
        current_user.invite_code = _generate_unique_invite_code(db)
        db.commit()
        db.refresh(current_user)

    count = (
        db.query(func.count(User.id))
        .filter(User.referred_by == current_user.invite_code)
        .scalar()
        or 0
    )
    return InviteResponse(
        invite_code=current_user.invite_code,
        referral_count=count,
        share_url=f"/register?ref={current_user.invite_code}",
    )


# ---------------------------------------------------------------------------
# Delete account (UU PDP compliance)
# ---------------------------------------------------------------------------

@router.delete("/me")
def delete_account(
    body: DeleteAccountRequest,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password salah")

    db.delete(current_user)  # cascade deletes conversations, saved_items, feedbacks
    db.commit()
    response.delete_cookie(COOKIE_NAME)
    return {"message": "Akun dan semua data Anda telah dihapus secara permanen"}

