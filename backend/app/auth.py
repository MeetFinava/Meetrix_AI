import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User, UserSession, utc_now


PBKDF2_ITERATIONS = int(os.getenv("PASSWORD_HASH_ITERATIONS", "310000"))
SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "24"))


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    )
    password_hash = base64.b64encode(digest).decode("utf-8")
    return password_hash, password_salt


def verify_password(password: str, password_hash: str, password_salt: str) -> bool:
    computed_hash, _ = hash_password(password, salt=password_salt)
    return hmac.compare_digest(computed_hash, password_hash)


def create_session_token(db: Session, user: User, user_agent: str | None = None) -> str:
    raw_token = secrets.token_urlsafe(48)
    session = UserSession(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=utc_now() + timedelta(hours=SESSION_TTL_HOURS),
        user_agent=(user_agent or "")[:512] or None,
    )
    db.add(session)
    user.last_login_at = utc_now()
    db.commit()
    return raw_token


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(password, user.password_hash, user.password_salt):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return user


def get_user_from_token(db: Session, token: str) -> tuple[User, UserSession]:
    token_hash = hash_token(token)
    session = db.query(UserSession).filter(UserSession.token_hash == token_hash).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    if session.expires_at < datetime.now(timezone.utc):
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    user = db.query(User).filter(User.id == session.user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    session.last_seen_at = utc_now()
    db.commit()
    db.refresh(user)
    return user, session

