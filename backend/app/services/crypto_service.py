import base64
import hashlib
from cryptography.fernet import Fernet

from app.config import settings


def _fernet() -> Fernet:
    key = hashlib.sha256(settings.jwt_secret.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_text(plain_text: str) -> str:
    return _fernet().encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_text(cipher_text: str) -> str:
    return _fernet().decrypt(cipher_text.encode("utf-8")).decode("utf-8")
