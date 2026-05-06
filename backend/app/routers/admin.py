from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ACTION_READ, ACTION_UPDATE, RESOURCE_AUDIT_LOGS, RESOURCE_CONFLICTS
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_permission
from app.models.audit_log import AuditLog
from app.models.collected_data import CollectedData
from app.models.conflict_log import ConflictLog
from app.models.user import User
from app.schemas.sync import AuditLogResponse, ConflictLogResponse, ResolveConflictRequest

router = APIRouter(prefix="/admin", tags=["admin"])


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
