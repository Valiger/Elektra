from datetime import datetime, timedelta, timezone
from typing import Optional
import threading
import bcrypt
import jwt
from jwt import PyJWTError
from app.config import settings

# In-memory single-use token store — cleared on restart (fine for single-instance Render)
_used_tokens_lock = threading.Lock()
_used_tokens: set[str] = set()



def hash_password(password: str) -> str:
    # Hash password using bcrypt directly
    salt = bcrypt.gensalt()
    pwd_bytes = password.encode('utf-8')
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def create_token(user_id: int) -> str:
    # 15-minute expiry for access token
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": str(user_id), "exp": expire, "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def create_refresh_token(user_id: int) -> str:
    # 7-day expiry for refresh token
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode = {"sub": str(user_id), "exp": expire, "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def decode_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "access":
            # legacy tokens won't have "type", so this might reject them,
            # but we're changing security posture so it's fine.
            if "type" in payload:
                return None
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (PyJWTError, ValueError):
        return None


def decode_refresh_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            return None
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (PyJWTError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Password-Reset Token helpers
# ---------------------------------------------------------------------------

def create_reset_token(user_id: int) -> str:
    """Short-lived (15 min) JWT for password reset."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": str(user_id), "exp": expire, "type": "password_reset"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def decode_reset_token(token: str) -> Optional[int]:
    """
    Validate and decode a password-reset JWT.
    Returns the user_id on success, None on failure / wrong type.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "password_reset":
            return None
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (PyJWTError, ValueError):
        return None


def mark_token_used(token: str) -> None:
    """Record that this reset token has been consumed."""
    with _used_tokens_lock:
        _used_tokens.add(token)


def is_token_used(token: str) -> bool:
    """Return True if the reset token was already consumed."""
    with _used_tokens_lock:
        return token in _used_tokens
