from pydantic import BaseModel, EmailStr


class DevSwitchUserRequest(BaseModel):
    target_email: EmailStr


class DevSwitchUserResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: EmailStr
    role_name: str


class DevResetSystemResponse(BaseModel):
    status: str
    deleted_collected_data: int
    deleted_assignments: int
    deleted_campaigns: int
    deleted_villages: int
    deleted_health_areas: int
    deleted_conflicts: int
    deleted_audit_logs: int
    deleted_users: int
