from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.campaign_assignment import CampaignAssignment
from app.models.collected_data import CollectedData
from app.models.conflict_log import ConflictLog
from app.models.user import User
from app.schemas.sync import SyncChange, SyncConflictItem


def _assignment_exists(db: Session, user: User, change: SyncChange) -> bool:
    assignment = db.execute(
        select(CampaignAssignment).where(
            CampaignAssignment.campaign_id == change.campaign_id,
            CampaignAssignment.health_area_id == change.health_area_id,
            CampaignAssignment.user_id == user.id,
        )
    ).scalars().first()
    return assignment is not None


def _to_utc_epoch(dt: datetime) -> float:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc).timestamp()
    return dt.astimezone(timezone.utc).timestamp()


def _as_naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


def _create_conflict(
    db: Session,
    change: SyncChange,
    reason: str,
    existing: CollectedData | None = None,
) -> SyncConflictItem:
    conflict = ConflictLog(
        data_id=existing.id if existing else None,
        local_value={
            "id": str(change.id) if change.id else None,
            "campaign_id": str(change.campaign_id),
            "health_area_id": str(change.health_area_id),
            "village_id": str(change.village_id) if change.village_id else None,
            "data_payload": change.data_payload,
            "source_timestamp": change.source_timestamp.isoformat(),
        },
        server_value={
            "id": str(existing.id),
            "data_payload": existing.data_payload,
            "source_timestamp": existing.source_timestamp.isoformat(),
        }
        if existing
        else None,
        resolution_strategy="last_write_win",
        resolution_notes=reason,
    )
    db.add(conflict)
    db.flush()
    return SyncConflictItem(conflict_id=conflict.id, data_id=conflict.data_id, reason=reason)


def apply_sync_changes(db: Session, user: User, changes: list[SyncChange]) -> tuple[list, list[SyncConflictItem]]:
    accepted: list = []
    conflicts: list[SyncConflictItem] = []

    for change in changes:
        if not _assignment_exists(db, user, change):
            conflicts.append(_create_conflict(db, change, "assignment_not_found"))
            continue

        existing = db.get(CollectedData, change.id) if change.id else None

        if not existing:
            created = CollectedData(
                id=change.id,
                campaign_id=change.campaign_id,
                user_id=user.id,
                health_area_id=change.health_area_id,
                village_id=change.village_id,
                data_payload=change.data_payload,
                sync_status="synced",
                source="local_device",
                source_timestamp=_as_naive_utc(change.source_timestamp),
                synced_at=datetime.utcnow(),
            )
            db.add(created)
            db.flush()
            accepted.append(created.id)
            continue

        incoming_ts = _to_utc_epoch(change.source_timestamp)
        existing_ts = _to_utc_epoch(existing.source_timestamp)

        if incoming_ts > existing_ts:
            existing.campaign_id = change.campaign_id
            existing.health_area_id = change.health_area_id
            existing.village_id = change.village_id
            existing.data_payload = change.data_payload
            existing.source_timestamp = _as_naive_utc(change.source_timestamp)
            existing.sync_status = "synced"
            existing.synced_at = datetime.utcnow()
            db.add(existing)
            accepted.append(existing.id)
            continue

        if incoming_ts < existing_ts:
            existing.sync_status = "conflict"
            db.add(existing)
            conflicts.append(_create_conflict(db, change, "server_newer", existing))
            continue

        if change.data_payload != existing.data_payload:
            existing.sync_status = "conflict"
            db.add(existing)
            conflicts.append(_create_conflict(db, change, "same_timestamp_different_payload", existing))
            continue

        accepted.append(existing.id)

    return accepted, conflicts
