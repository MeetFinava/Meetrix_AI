from pydantic import BaseModel


class AdminUserUpdateRequest(BaseModel):
    is_admin: bool | None = None
    is_active: bool | None = None
