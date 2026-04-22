from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth import SESSION_TTL_HOURS, authenticate_user, create_session_token, hash_password, hash_token
from app.database import get_db
from app.dependencies import get_current_user
from app.models import ChatMessage, ChatSessionRecord, MediaAsset, ProjectRecord, User, UserSession
from app.schemas.auth_schema import LoginRequest, RegisterRequest


router = APIRouter()


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_admin": user.is_admin,
        "created_at": user.created_at,
        "last_login_at": user.last_login_at,
    }


@router.post("/register")
def register(
    payload: RegisterRequest,
    user_agent: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    password_hash, password_salt = hash_password(payload.password)
    user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name.strip(),
        password_hash=password_hash,
        password_salt=password_salt,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_session_token(db, user, user_agent=user_agent)
    return {
        "token": token,
        "expires_in_hours": SESSION_TTL_HOURS,
        "user": serialize_user(user),
    }


@router.post("/login")
def login(
    payload: LoginRequest,
    user_agent: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, payload.email, payload.password)
    token = create_session_token(db, user, user_agent=user_agent)
    return {
        "token": token,
        "expires_in_hours": SESSION_TTL_HOURS,
        "user": serialize_user(user),
    }


@router.post("/logout")
def logout(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization:
        return {"message": "Logged out"}

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() == "bearer" and token:
        session = db.query(UserSession).filter(UserSession.token_hash == hash_token(token.strip())).first()
        if session:
            db.delete(session)
            db.commit()
    return {"message": "Logged out"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"user": serialize_user(current_user)}


@router.get("/history")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    projects = (
        db.query(ProjectRecord)
        .filter(ProjectRecord.user_id == current_user.id)
        .order_by(ProjectRecord.created_at.desc())
        .all()
    )
    assets = (
        db.query(MediaAsset)
        .filter(MediaAsset.user_id == current_user.id)
        .order_by(MediaAsset.created_at.desc())
        .all()
    )
    chat_sessions = (
        db.query(ChatSessionRecord)
        .filter(ChatSessionRecord.user_id == current_user.id)
        .order_by(ChatSessionRecord.updated_at.desc())
        .all()
    )

    chat_session_ids = [session.id for session in chat_sessions]
    message_counts = {}
    if chat_session_ids:
        rows = (
            db.query(ChatMessage.chat_session_id, func.count(ChatMessage.id))
            .filter(ChatMessage.chat_session_id.in_(chat_session_ids))
            .group_by(ChatMessage.chat_session_id)
            .all()
        )
        message_counts = {session_id: count for session_id, count in rows}

    return {
        "projects": [
            {
                "id": project.id,
                "project_name": project.project_name,
                "project_slug": project.project_slug,
                "project_path": project.project_path,
                "zip_path": project.zip_path,
                "created_at": project.created_at,
            }
            for project in projects
        ],
        "assets": [
            {
                "id": asset.id,
                "asset_type": asset.asset_type.value,
                "prompt": asset.prompt,
                "file_path": asset.file_path,
                "mime_type": asset.mime_type,
                "created_at": asset.created_at,
            }
            for asset in assets
        ],
        "chat_sessions": [
            {
                "id": session.id,
                "title": session.title,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
                "message_count": message_counts.get(session.id, 0),
            }
            for session in chat_sessions
        ],
    }


@router.get("/assets/{asset_id}/download")
def download_asset(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = db.query(MediaAsset).filter(MediaAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed to access this asset")

    file_path = Path(asset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Asset file missing")

    filename = f"{asset.asset_type.value}-{asset.id}{file_path.suffix}"
    return FileResponse(str(file_path), media_type=asset.mime_type, filename=filename)
