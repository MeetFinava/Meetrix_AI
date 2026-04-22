from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import UsageFeature, UsageWindow, User


DEFAULT_LIMITS = {
    UsageFeature.chat_message: 2,
    UsageFeature.image_generation: 10,
    UsageFeature.video_generation: 5,
    UsageFeature.project_build: 5,
    UsageFeature.document_upload: 5,
}


def get_window_start() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def enforce_rate_limit(db: Session, user: User, feature: UsageFeature, limit: int | None = None) -> dict:
    if user.is_admin:
        return {"feature": feature.value, "used": 0, "remaining": "unlimited"}

    max_allowed = limit or DEFAULT_LIMITS[feature]
    window_start = get_window_start()
    window = (
        db.query(UsageWindow)
        .filter(
            UsageWindow.user_id == user.id,
            UsageWindow.feature == feature,
            UsageWindow.window_start == window_start,
        )
        .first()
    )

    used = window.count if window else 0
    if used >= max_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit reached for {feature.value}. Allowed: {max_allowed}",
        )

    if window is None:
        window = UsageWindow(user_id=user.id, feature=feature, window_start=window_start, count=0)
        db.add(window)

    window.count += 1
    db.commit()
    return {"feature": feature.value, "used": window.count, "remaining": max_allowed - window.count}

