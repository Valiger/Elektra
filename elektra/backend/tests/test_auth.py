from app.services.auth_service import (
    hash_password,
    verify_password,
    create_token,
    decode_token
)


def test_hash_and_verify_password():
    password = "supersecretpassword"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_create_and_decode_token():
    user_id = 42
    token = create_token(user_id)

    assert isinstance(token, str)

    decoded_user_id = decode_token(token)
    assert decoded_user_id == user_id


def test_decode_invalid_token():
    invalid_token = "this.is.invalid"
    assert decode_token(invalid_token) is None
