from sqlalchemy import TypeDecorator, String
from cryptography.fernet import Fernet
from app.config import settings
import base64

# Generate a consistent key based on SECRET_KEY
# Fernet requires a 32-url-safe-base64-encoded bytes key.
def _get_fernet() -> Fernet | None:
    if not settings.SECRET_KEY:
        return None
    # We pad or truncate the secret key to 32 bytes then base64 encode it
    key_bytes = settings.SECRET_KEY.encode('utf-8')
    padded_key = key_bytes.ljust(32, b'0')[:32]
    url_safe_key = base64.urlsafe_b64encode(padded_key)
    return Fernet(url_safe_key)


class EncryptedString(TypeDecorator):
    """
    Encrypts string data on the way in, decrypts on the way out.
    """
    impl = String
    cache_ok = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fernet = _get_fernet()

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if not self.fernet:
            return value
        # Encrypt the string
        return self.fernet.encrypt(value.encode('utf-8')).decode('utf-8')

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not self.fernet:
            return value
        try:
            return self.fernet.decrypt(value.encode('utf-8')).decode('utf-8')
        except Exception:
            # Fallback for plain text that existed before encryption
            return value
