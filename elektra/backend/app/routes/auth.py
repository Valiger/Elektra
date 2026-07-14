from fastapi import APIRouter, Depends, HTTPException, Request

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.config import settings
from app.schemas.auth_schema import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    ResetPasswordRequest,
    SignupRequest,
    UserOut,
    RefreshTokenRequest,
)
from app.services.auth_service import (
    create_token,
    create_refresh_token,
    create_reset_token,
    decode_refresh_token,
    decode_reset_token,
    hash_password,
    is_token_used,
    mark_token_used,
    verify_password,
)
from app.services.email_service import send_password_reset_email
from app.routes.deps import get_current_user
from app.limiter import limiter

router = APIRouter()


@router.post("/signup", response_model=AuthResponse)
@limiter.limit("5/minute")
def signup(
    request: Request,
    payload: SignupRequest,
    db: Session = Depends(get_db),
):
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=400, detail="Passwords do not match"
        )
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long",
        )

    existing_user = (
        db.query(User).filter(User.email == payload.email).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=400, detail="Email already registered"
        )

    hashed_pwd = hash_password(payload.password)

    new_user = User(
        email=payload.email,
        username=payload.username,
        password_hash=hashed_pwd,
        establishment_type=payload.establishment_type,
        location_type=payload.location_type,
        province=payload.province,
        cooperative=payload.cooperative,
        tos_accepted_version=payload.tos_accepted_version,
        privacy_accepted_version=payload.privacy_accepted_version,
        marketing_consent=payload.marketing_consent,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Refresh ALECO rates synchronously so the dashboard shows
    # the correct scraped rate immediately after signup.
    if payload.cooperative and payload.cooperative.upper() == "ALECO":
        _refresh_aleco_rates(db)

    token = create_token(new_user.id)  # type: ignore
    refresh_token = create_refresh_token(new_user.id)  # type: ignore
    return AuthResponse(access_token=token, refresh_token=refresh_token, user=new_user)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=401, detail="Invalid email or password"
        )

    if not verify_password(
        payload.password, user.password_hash  # type: ignore
    ):
        raise HTTPException(
            status_code=401, detail="Invalid email or password"
        )

    token = create_token(user.id)  # type: ignore
    refresh_token = create_refresh_token(user.id)  # type: ignore
    return AuthResponse(access_token=token, refresh_token=refresh_token, user=user)

@router.post("/refresh", response_model=AuthResponse)
@limiter.limit("20/minute")
def refresh(request: Request, payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    user_id = decode_refresh_token(payload.refresh_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    new_access_token = create_token(user.id) # type: ignore
    new_refresh_token = create_refresh_token(user.id) # type: ignore
    return AuthResponse(access_token=new_access_token, refresh_token=new_refresh_token, user=user)

@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserOut)
def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.username is not None:
        setattr(current_user, "username", request.username)
    if request.establishment_type is not None:
        setattr(current_user, "establishment_type", request.establishment_type)
    if request.location_type is not None:
        setattr(current_user, "location_type", request.location_type)
    if request.province is not None:
        setattr(current_user, "province", request.province)
    if request.cooperative is not None:
        setattr(current_user, "cooperative", request.cooperative)
    if request.budget_goal is not None:
        setattr(current_user, "budget_goal", request.budget_goal)
    if request.kwh_limit is not None:
        setattr(current_user, "kwh_limit", request.kwh_limit)

    if request.new_password:
        if not request.current_password:
            raise HTTPException(
                status_code=400,
                detail="Current password is required to change password",
            )
        if not verify_password(
            request.current_password,
            current_user.password_hash,  # type: ignore
        ):
            raise HTTPException(
                status_code=400, detail="Invalid current password"
            )
        if request.new_password != request.confirm_new_password:
            raise HTTPException(
                status_code=400, detail="New passwords do not match"
            )
        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=400,
                detail="New password must be at least 8 characters long",
            )
        current_user.password_hash = hash_password(
            request.new_password
        )  # type: ignore

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password", status_code=200)
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Request a password-reset link.
    Always returns 200 regardless of whether the email exists
    (prevents user enumeration attacks).
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = create_reset_token(user.id)  # type: ignore
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(payload.email, reset_url)
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=200)
@limiter.limit("10/minute")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Consume a password-reset token and update the user's password."""
    if is_token_used(payload.token):
        raise HTTPException(status_code=400, detail="Reset link has already been used.")

    user_id = decode_reset_token(payload.token)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    if payload.new_password != payload.confirm_new_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(payload.new_password)  # type: ignore
    db.commit()
    db.refresh(user)

    # Invalidate token so it cannot be reused
    mark_token_used(payload.token)

    return {"message": "Password updated successfully."}


def _refresh_aleco_rates(db: Session):
    """Runs in background - updates ALECO du_rates rows silently."""
    try:
        from app.services.scraper_service import scrape_aleco_rates
        from app.models.du_rate import DURate
        from datetime import datetime

        rates = scrape_aleco_rates()
        label_to_du = {
            "Residential Mainland": "ALECO",
            "Residential Island":   "ALECO-Island",
            "Low Voltage Mainland": "ALECO-LV",
            "Low Voltage Island":   "ALECO-LV-Island",
            "High Voltage":         "ALECO-HV",
        }
        for label, value in rates.items():
            du_name = label_to_du.get(label)
            if not du_name:
                continue
            row = db.query(DURate).filter(DURate.du_name == du_name).first()
            if row:
                row.rate_per_kwh = value
                row.updated_at = datetime.utcnow()  # type: ignore
        db.commit()
    except Exception:
        pass  # Silent fail - signup succeeds regardless of scrape result
