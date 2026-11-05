"""Auth Pydantic schemas — request/response shapes for register, login, and user info."""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.pengguna
    institution: Optional[str] = None
    invite_code: Optional[str] = None  # Required if role == admin
    referred_by: Optional[str] = None  # Personal referral code from inviter friend

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password harus minimal 8 karakter")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Nama tidak boleh kosong")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password baru harus minimal 8 karakter")
        return v


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    institution: Optional[str] = None


class CompleteOnboardingRequest(BaseModel):
    acknowledged: bool


class DeleteAccountRequest(BaseModel):
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    institution: Optional[str]
    onboarding_completed: bool
    invite_code: Optional[str] = None
    referred_by: Optional[str] = None

    model_config = {"from_attributes": True}


class InviteResponse(BaseModel):
    invite_code: str
    referral_count: int
    share_url: str



class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

