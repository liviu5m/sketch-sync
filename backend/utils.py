from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from typing import Optional
import os
import secrets
import string

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

pwd_context = CryptContext(
    schemes=["sha256_crypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

def hashPassword(password: str):
    return pwd_context.hash(password)

def verifyPassword(plainPassword, hashedPassword):
    return pwd_context.verify(plainPassword, hashedPassword)


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

def createAccessToken(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decodeToken(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def getUserIdFromToken(token: str) -> Optional[int]:
    payload = decodeToken(token)
    if payload:
        return payload.get("userId")
    return None

def generate_room_code(length: int = 6):
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))