from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class SessionResponse(BaseModel):
    token: str
    expires_in_hours: int
    user: dict


class HistoryResponse(BaseModel):
    projects: list[dict]
    assets: list[dict]
    chat_sessions: list[dict]


class UserSummaryResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_admin: bool
    created_at: datetime
    last_login_at: datetime | None = None
