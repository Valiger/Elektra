from typing import Optional
from pydantic import BaseModel, ConfigDict

class BaseSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

class SignupRequest(BaseSchema):
    email: str
    username: str
    password: str
    confirm_password: str
    establishment_type: str
    location_type: str
    province: str
    cooperative: str
    tos_accepted_version: str
    privacy_accepted_version: str
    marketing_consent: Optional[bool] = False


class LoginRequest(BaseSchema):
    email: str
    password: str


class UserOut(BaseSchema):
    id: int
    email: str
    username: str
    establishment_type: Optional[str] = None
    location_type: Optional[str] = None
    province: Optional[str] = None
    cooperative: Optional[str] = None
    budget_goal: Optional[float] = None
    kwh_limit: Optional[float] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseSchema):
    access_token: str
    refresh_token: str
    user: UserOut


class RefreshTokenRequest(BaseSchema):
    refresh_token: str


class ProfileUpdateRequest(BaseSchema):
    username: Optional[str] = None
    establishment_type: Optional[str] = None
    location_type: Optional[str] = None
    province: Optional[str] = None
    cooperative: Optional[str] = None
    budget_goal: Optional[float] = None
    kwh_limit: Optional[float] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    confirm_new_password: Optional[str] = None


class ForgotPasswordRequest(BaseSchema):
    email: str


class ResetPasswordRequest(BaseSchema):
    token: str
    new_password: str
    confirm_new_password: str
