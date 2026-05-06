from fastapi import Depends, HTTPException, status

from app.config import settings
from app.constants import ACTION_READ, RESOURCE_USERS, ROLE_ADMIN_SYSTEM, ROLE_PERMISSIONS
from app.middleware.auth import get_current_user
from app.models.user import User


def require_admin_system(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.name != ROLE_ADMIN_SYSTEM:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin system role required")
    return current_user


def require_permission(resource: str, action: str):
    def _dependency(current_user: User = Depends(get_current_user)) -> User:
        if settings.app_env == "dev" and current_user.role.name == "developer_superuser":
            return current_user

        allowed = ROLE_PERMISSIONS.get(current_user.role.name, set())
        if (resource, action) not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied for {resource}:{action}",
            )
        return current_user

    return _dependency


def require_users_read(current_user: User = Depends(get_current_user)) -> User:
    allowed = ROLE_PERMISSIONS.get(current_user.role.name, set())
    if (RESOURCE_USERS, ACTION_READ) not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied for users:read")
    return current_user
