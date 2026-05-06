from fastapi import Depends, HTTPException, status

from app.constants import ROLE_ADMIN_SYSTEM
from app.middleware.auth import get_current_user
from app.models.user import User


def require_admin_system(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.name != ROLE_ADMIN_SYSTEM:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin system role required")
    return current_user
