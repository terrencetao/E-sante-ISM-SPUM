from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.constants import ACTION_CREATE, RESOURCE_SYNC
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_permission
from app.models.user import User
from app.schemas.sync import SyncRequest, SyncResponse
from app.services.sync_service import apply_sync_changes

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("", response_model=SyncResponse)
def sync_data(
    payload: SyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission(RESOURCE_SYNC, ACTION_CREATE)),
) -> SyncResponse:
    accepted, conflicts = apply_sync_changes(db, current_user, payload.changes)
    db.commit()
    return SyncResponse(accepted=accepted, conflicts=conflicts, timestamp=datetime.utcnow())
