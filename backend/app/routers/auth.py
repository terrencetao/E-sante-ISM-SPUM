import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.auth import ChangePinRequest, LoginRequest, TokenResponse
from app.services.auth_service import create_access_token, hash_pin, verify_pin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user or not user.is_active or not verify_pin(payload.pin, user.pin_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(str(user.id), user.role.name)
    return TokenResponse(access_token=token, email=user.email, role_name=user.role.name)


@router.post("/refresh", response_model=TokenResponse)
def refresh(current_user: User = Depends(get_current_user)) -> TokenResponse:
    token = create_access_token(str(current_user.id), current_user.role.name)
    return TokenResponse(access_token=token, email=current_user.email, role_name=current_user.role.name)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)) -> dict[str, str]:
    return {"message": f"logout accepted for {current_user.email}"}


@router.post("/change-pin")
def change_pin(payload: ChangePinRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, str]:
    if not verify_pin(payload.old_pin, current_user.pin_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Old pin is invalid")

    current_user.pin_hash = hash_pin(payload.new_pin)
    current_user.must_change_pin = False
    db.add(current_user)
    db.commit()

    return {"message": "pin updated"}


@router.post("/dev-generate-pin")
def dev_generate_pin() -> dict[str, str]:
    return {"pin": f"{secrets.randbelow(10000):04d}"}
