from passlib.context import CryptContext  # type: ignore

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    print(pwd_context.hash("test"))
except Exception as e:
    print("ERROR:", repr(e))
