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

_token_blocklist_lock = threading.Lock()
_token_blocklist: set[str] = set()

def block_token(token: str) -> None:
    with _token_blocklist_lock:
        _token_blocklist.add(token)

def is_token_blocked(token: str) -> bool:
    with _token_blocklist_lock:
        return token in _token_blocklist




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


def create_token(user_id: int, token_version: int = 0) -> str:
    # 15-minute expiry for access token
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": str(user_id), "exp": expire, "type": "access", "tv": token_version}
    key = settings.JWT_PRIVATE_KEY or settings.SECRET_KEY
    alg = settings.ALGORITHM if settings.JWT_PRIVATE_KEY else "HS256"
    encoded_jwt = jwt.encode(to_encode, key, algorithm=alg)
    return encoded_jwt


def create_refresh_token(user_id: int, token_version: int = 0) -> str:
    # 7-day expiry for refresh token
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode = {"sub": str(user_id), "exp": expire, "type": "refresh", "tv": token_version}
    key = settings.JWT_PRIVATE_KEY or settings.SECRET_KEY
    alg = settings.ALGORITHM if settings.JWT_PRIVATE_KEY else "HS256"
    encoded_jwt = jwt.encode(to_encode, key, algorithm=alg)
    return encoded_jwt



def decode_token(token: str) -> Optional[tuple[int, int]]:
    if is_token_blocked(token):
        return None
    try:
        key = settings.JWT_PUBLIC_KEY or settings.SECRET_KEY
        alg = settings.ALGORITHM if settings.JWT_PUBLIC_KEY else "HS256"
        payload = jwt.decode(token, key, algorithms=[alg, "HS256"])
        if payload.get("type") != "access":
            if "type" in payload:
                return None
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        return (int(user_id_str), payload.get("tv", 0))
    except (PyJWTError, ValueError):
        return None


def decode_refresh_token(token: str) -> Optional[tuple[int, int]]:
    if is_token_blocked(token):
        return None
    try:
        key = settings.JWT_PUBLIC_KEY or settings.SECRET_KEY
        alg = settings.ALGORITHM if settings.JWT_PUBLIC_KEY else "HS256"
        payload = jwt.decode(token, key, algorithms=[alg, "HS256"])
        if payload.get("type") != "refresh":
            return None
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        return (int(user_id_str), payload.get("tv", 0))
    except (PyJWTError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Password-Reset Token helpers
# ---------------------------------------------------------------------------

def create_reset_token(user_id: int) -> str:
    """Short-lived (15 min) JWT for password reset."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": str(user_id), "exp": expire, "type": "password_reset"}
    key = settings.JWT_PRIVATE_KEY or settings.SECRET_KEY
    alg = settings.ALGORITHM if settings.JWT_PRIVATE_KEY else "HS256"
    return jwt.encode(to_encode, key, algorithm=alg)


def decode_reset_token(token: str) -> Optional[int]:
    """
    Validate and decode a password-reset JWT.
    Returns the user_id on success, None on failure / wrong type.
    """
    try:
        key = settings.JWT_PUBLIC_KEY or settings.SECRET_KEY
        alg = settings.ALGORITHM if settings.JWT_PUBLIC_KEY else "HS256"
        payload = jwt.decode(token, key, algorithms=[alg, "HS256"])
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
