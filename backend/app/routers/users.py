import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ACTION_CREATE, ACTION_DELETE, ACTION_READ, ACTION_UPDATE, RESOURCE_USERS
from app.database import get_db
from app.middleware.rbac import require_permission
from app.models.role import Role
from app.models.user import User
from app.schemas.user import ResetPinResponse, UserCreateRequest, UserResponse, UserUpdateRequest
from app.services.auth_service import hash_pin

router = APIRouter(prefix="/users", tags=["users"])


def _map_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        role_name=user.role.name,
        is_active=user.is_active,
        must_change_pin=user.must_change_pin,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post("", response_model=ResetPinResponse)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission(RESOURCE_USERS, ACTION_CREATE)),
) -> ResetPinResponse:
    role = db.execute(select(Role).where(Role.name == payload.role_name)).scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")

    existing = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    temporary_pin = f"{secrets.randbelow(10000):04d}"
    user = User(email=payload.email, role_id=role.id, pin_hash=hash_pin(temporary_pin), must_change_pin=True)
    db.add(user)
    db.commit()
    db.refresh(user)

    return ResetPinResponse(user_id=user.id, temporary_pin=temporary_pin)


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_permission(RESOURCE_USERS, ACTION_READ))) -> list[UserResponse]:
    users = db.execute(select(User).order_by(User.created_at.desc())).scalars().all()
    return [_map_user(user) for user in users]


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission(RESOURCE_USERS, ACTION_UPDATE)),
) -> UserResponse:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.email is not None:
        user.email = str(payload.email)

    if payload.role_name is not None:
        role = db.execute(select(Role).where(Role.name == payload.role_name)).scalar_one_or_none()
        if not role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")
        user.role_id = role.id

    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.add(user)
    db.commit()
    db.refresh(user)
    return _map_user(user)


@router.delete("/{user_id}")
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission(RESOURCE_USERS, ACTION_DELETE)),
) -> dict[str, str]:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False
    db.add(user)
    db.commit()
    return {"message": "user deactivated"}


@router.post("/{user_id}/reset-pin", response_model=ResetPinResponse)
def reset_pin(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission(RESOURCE_USERS, ACTION_UPDATE)),
) -> ResetPinResponse:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    temporary_pin = f"{secrets.randbelow(10000):04d}"
    user.pin_hash = hash_pin(temporary_pin)
    user.must_change_pin = True
    db.add(user)
    db.commit()

    return ResetPinResponse(user_id=user.id, temporary_pin=temporary_pin)
