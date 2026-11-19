import base64
import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from .config import ALGORITHM, SECRET_KEY, TOKEN_HOURS


def _prep(password: str) -> bytes:
    # Pre-hash so bcrypt's 72-byte limit never silently truncates a password.
    return base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prep(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prep(password), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        return int(jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
