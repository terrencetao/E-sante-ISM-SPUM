from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import settings
from app.constants import ACTION_READ, ACTION_UPDATE, RESOURCE_AUDIT_LOGS, RESOURCE_CONFLICTS
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_permission
from app.models.audit_log import AuditLog
from app.models.campaign import Campaign
from app.models.campaign_assignment import CampaignAssignment
from app.models.collected_data import CollectedData
from app.models.conflict_log import ConflictLog
from app.models.health_area import HealthArea
from app.models.role import Role
from app.models.user import User
from app.models.village import Village
from app.schemas.dev import DevResetSystemResponse, DevSwitchUserRequest, DevSwitchUserResponse
from app.schemas.sync import AuditLogResponse, ConflictLogResponse, ResolveConflictRequest
from app.services.auth_service import create_access_token, hash_pin

router = APIRouter(prefix="/admin", tags=["admin"])


def _ensure_dev_mode() -> None:
    if settings.app_env != "dev":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Dev endpoints are available only in dev mode")


def _ensure_dev_operator(current_user: User) -> None:
    if current_user.role.name not in {"administrator_system", "developer_superuser"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin system or developer superuser role required")


@router.get("/conflicts", response_model=list[ConflictLogResponse])
def list_conflicts(
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_CONFLICTS, ACTION_READ)),
) -> list[ConflictLogResponse]:
    rows = db.execute(select(ConflictLog).order_by(ConflictLog.created_at.desc())).scalars().all()
    return [ConflictLogResponse(**row.__dict__) for row in rows]


@router.patch("/conflicts/{conflict_id}", response_model=ConflictLogResponse)
def resolve_conflict(
    conflict_id: uuid.UUID,
    payload: ResolveConflictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission(RESOURCE_CONFLICTS, ACTION_UPDATE)),
) -> ConflictLogResponse:
    conflict = db.get(ConflictLog, conflict_id)
    if not conflict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")

    if payload.apply_client_payload and conflict.data_id:
        row = db.get(CollectedData, conflict.data_id)
        if row and conflict.local_value:
            row.data_payload = conflict.local_value.get("data_payload", row.data_payload)
            source_ts = conflict.local_value.get("source_timestamp")
            if source_ts:
                row.source_timestamp = datetime.fromisoformat(source_ts)
            row.sync_status = "synced"
            row.synced_at = datetime.utcnow()
            db.add(row)

    conflict.resolved_at = datetime.utcnow()
    conflict.resolved_by = current_user.id
    conflict.resolution_notes = payload.resolution_notes
    conflict.resolution_strategy = "manual_review"

    db.add(conflict)
    db.commit()
    db.refresh(conflict)

    return ConflictLogResponse(**conflict.__dict__)


@router.get("/audit-logs", response_model=list[AuditLogResponse])
def list_audit_logs(
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_AUDIT_LOGS, ACTION_READ)),
) -> list[AuditLogResponse]:
    rows = db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(500)).scalars().all()
    return [
        AuditLogResponse(
            id=row.id,
            user_id=row.user_id,
            action=row.action,
            resource=row.resource,
            resource_id=row.resource_id,
            status=row.status,
            ip_address=row.ip_address,
            timestamp=row.timestamp,
        )
        for row in rows
    ]


@router.post("/dev/switch-user", response_model=DevSwitchUserResponse)
def dev_switch_user(
    payload: DevSwitchUserRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> DevSwitchUserResponse:
    _ensure_dev_mode()

    target_user = db.execute(select(User).where(User.email == payload.target_email)).scalar_one_or_none()
    if not target_user or not target_user.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found or inactive")

    token = create_access_token(str(target_user.id), target_user.role.name)
    return DevSwitchUserResponse(
        access_token=token,
        email=target_user.email,
        role_name=target_user.role.name,
    )


@router.post("/dev/reset-system", response_model=DevResetSystemResponse)
def dev_reset_system(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DevResetSystemResponse:
    _ensure_dev_mode()
    _ensure_dev_operator(current_user)

    deleted_conflicts = db.execute(delete(ConflictLog)).rowcount or 0
    deleted_audit_logs = db.execute(delete(AuditLog)).rowcount or 0
    deleted_collected_data = db.execute(delete(CollectedData)).rowcount or 0
    deleted_assignments = db.execute(delete(CampaignAssignment)).rowcount or 0
    deleted_campaigns = db.execute(delete(Campaign)).rowcount or 0
    deleted_villages = db.execute(delete(Village)).rowcount or 0
    deleted_health_areas = db.execute(delete(HealthArea)).rowcount or 0

    protected_emails = {settings.admin_seed_email, settings.dev_superuser_email}
    users_to_remove = db.execute(select(User).where(User.email.not_in(protected_emails))).scalars().all()
    deleted_users = 0
    for row in users_to_remove:
        db.delete(row)
        deleted_users += 1

    admin_role = db.execute(select(Role).where(Role.name == "administrator_system")).scalar_one_or_none()
    if admin_role:
        admin = db.execute(select(User).where(User.email == settings.admin_seed_email)).scalar_one_or_none()
        if not admin:
            admin = User(
                email=settings.admin_seed_email,
                pin_hash=hash_pin(settings.admin_seed_pin),
                role_id=admin_role.id,
                must_change_pin=True,
                is_active=True,
            )
            db.add(admin)

    super_role = db.execute(select(Role).where(Role.name == "developer_superuser")).scalar_one_or_none()
    if super_role:
        dev_super = db.execute(select(User).where(User.email == settings.dev_superuser_email)).scalar_one_or_none()
        if not dev_super:
            dev_super = User(
                email=settings.dev_superuser_email,
                pin_hash=hash_pin(settings.dev_superuser_pin),
                role_id=super_role.id,
                must_change_pin=False,
                is_active=True,
            )
            db.add(dev_super)

    db.commit()

    return DevResetSystemResponse(
        status="ok",
        deleted_collected_data=deleted_collected_data,
        deleted_assignments=deleted_assignments,
        deleted_campaigns=deleted_campaigns,
        deleted_villages=deleted_villages,
        deleted_health_areas=deleted_health_areas,
        deleted_conflicts=deleted_conflicts,
        deleted_audit_logs=deleted_audit_logs,
        deleted_users=deleted_users,
    )
