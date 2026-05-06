import uuid
from datetime import datetime

from pydantic import BaseModel


class SyncChange(BaseModel):
    id: uuid.UUID | None = None
    campaign_id: uuid.UUID
    health_area_id: uuid.UUID
    village_id: uuid.UUID | None = None
    data_payload: dict
    source_timestamp: datetime


class SyncRequest(BaseModel):
    changes: list[SyncChange]
    timestamp: datetime | None = None


class SyncConflictItem(BaseModel):
    conflict_id: uuid.UUID
    data_id: uuid.UUID | None = None
    reason: str


class SyncResponse(BaseModel):
    accepted: list[uuid.UUID]
    conflicts: list[SyncConflictItem]
    timestamp: datetime


class ConflictLogResponse(BaseModel):
    id: uuid.UUID
    data_id: uuid.UUID | None = None
    local_value: dict
    server_value: dict | None = None
    resolution_strategy: str
    resolved_at: datetime | None = None
    resolved_by: uuid.UUID | None = None
    resolution_notes: str | None = None
    created_at: datetime


class ResolveConflictRequest(BaseModel):
    resolution_notes: str | None = None
    apply_client_payload: bool = False


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    action: str
    resource: str
    resource_id: uuid.UUID | None = None
    status: str
    ip_address: str | None = None
    timestamp: datetime
