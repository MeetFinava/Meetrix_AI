from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import ChatMessage, ChatSessionRecord, MediaAsset, ProjectRecord, UsageWindow, User
from app.schemas.admin_schema import AdminUserUpdateRequest


router = APIRouter()


def serialize_user_with_counts(db: Session, user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "last_login_at": user.last_login_at,
        "project_count": db.query(func.count(ProjectRecord.id)).filter(ProjectRecord.user_id == user.id).scalar(),
        "asset_count": db.query(func.count(MediaAsset.id)).filter(MediaAsset.user_id == user.id).scalar(),
        "chat_session_count": db.query(func.count(ChatSessionRecord.id)).filter(ChatSessionRecord.user_id == user.id).scalar(),
        "chat_message_count": (
            db.query(func.count(ChatMessage.id))
            .join(ChatSessionRecord, ChatMessage.chat_session_id == ChatSessionRecord.id)
            .filter(ChatSessionRecord.user_id == user.id)
            .scalar()
        ),
        "usage_window_count": db.query(func.count(UsageWindow.id)).filter(UsageWindow.user_id == user.id).scalar(),
    }


@router.get("/overview")
def admin_overview(
    _admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return {
        "total_users": db.query(func.count(User.id)).scalar(),
        "admin_users": db.query(func.count(User.id)).filter(User.is_admin.is_(True)).scalar(),
        "projects_generated": db.query(func.count(ProjectRecord.id)).scalar(),
        "assets_generated": db.query(func.count(MediaAsset.id)).scalar(),
        "chat_sessions": db.query(func.count(ChatSessionRecord.id)).scalar(),
        "chat_messages": db.query(func.count(ChatMessage.id)).scalar(),
        "usage_windows": db.query(func.count(UsageWindow.id)).scalar(),
    }


@router.get("/users")
def admin_users(
    _admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {"users": [serialize_user_with_counts(db, user) for user in users]}


@router.get("/users/{user_id}")
def admin_user_detail(
    user_id: str,
    _admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    projects = (
        db.query(ProjectRecord)
        .filter(ProjectRecord.user_id == user.id)
        .order_by(ProjectRecord.created_at.desc())
        .all()
    )
    assets = (
        db.query(MediaAsset)
        .filter(MediaAsset.user_id == user.id)
        .order_by(MediaAsset.created_at.desc())
        .all()
    )
    sessions = (
        db.query(ChatSessionRecord)
        .filter(ChatSessionRecord.user_id == user.id)
        .order_by(ChatSessionRecord.updated_at.desc())
        .all()
    )

    return {
        "user": serialize_user_with_counts(db, user),
        "projects": [
            {
                "id": project.id,
                "project_name": project.project_name,
                "created_at": project.created_at,
                "zip_path": project.zip_path,
            }
            for project in projects
        ],
        "assets": [
            {
                "id": asset.id,
                "asset_type": asset.asset_type.value,
                "prompt": asset.prompt,
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
            }
            for session in sessions
        ],
    }


@router.patch("/users/{user_id}")
def admin_update_user(
    user_id: str,
    payload: AdminUserUpdateRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.is_admin is not None and user.id == admin_user.id and payload.is_admin is False:
        remaining_admins = db.query(func.count(User.id)).filter(User.is_admin.is_(True), User.id != admin_user.id).scalar()
        if remaining_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot remove admin access from the last admin account.",
            )

    if payload.is_admin is not None:
        user.is_admin = payload.is_admin

    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)

    return {
        "message": "User updated successfully",
        "user": serialize_user_with_counts(db, user),
    }
