import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreateRequest(BaseModel):
    email: EmailStr
    role_name: str


class UserUpdateRequest(BaseModel):
    email: EmailStr | None = None
    role_name: str | None = None
    is_active: bool | None = None


class ResetPinResponse(BaseModel):
    user_id: uuid.UUID
    temporary_pin: str = Field(min_length=4, max_length=4)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role_name: str
    is_active: bool
    must_change_pin: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
