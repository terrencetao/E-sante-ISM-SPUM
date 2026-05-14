from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ACTION_CREATE, ACTION_READ, RESOURCE_DATA, RESOURCE_ME
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_permission
from app.models.campaign import Campaign
from app.models.campaign_assignment import CampaignAssignment
from app.models.collected_data import CollectedData
from app.models.health_area import HealthArea
from app.models.user import User
from app.schemas.data import CollectedDataCreateRequest, CollectedDataResponse, MyAssignmentResponse

router = APIRouter(tags=["data"])


@router.get("/me/assignments", response_model=list[MyAssignmentResponse])
def get_my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission(RESOURCE_ME, ACTION_READ)),
) -> list[MyAssignmentResponse]:
    rows = db.execute(
        select(CampaignAssignment, Campaign.name, HealthArea.name)
        .join(Campaign, Campaign.id == CampaignAssignment.campaign_id)
        .join(HealthArea, HealthArea.id == CampaignAssignment.health_area_id)
        .where(CampaignAssignment.user_id == current_user.id)
        .order_by(CampaignAssignment.assigned_at.desc())
    ).all()

    return [
        MyAssignmentResponse(
            id=assignment.id,
            campaign_id=assignment.campaign_id,
            campaign_name=campaign_name,
            health_area_id=assignment.health_area_id,
            health_area_name=health_area_name,
            status=assignment.status,
            assigned_at=assignment.assigned_at,
        )
        for assignment, campaign_name, health_area_name in rows
    ]


@router.get("/me/assignment")
def get_my_assignment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission(RESOURCE_ME, ACTION_READ)),
) -> dict:
    assignments = get_my_assignments(db=db, current_user=current_user)
    if not assignments:
        return {"assignment": None}

    first = assignments[0]
    return {
        "assignment": {
            "id": str(first.id),
            "campaign_id": str(first.campaign_id),
            "health_area_id": str(first.health_area_id),
            "status": first.status,
            "assigned_at": first.assigned_at.isoformat(),
        }
    }


@router.post("/data", response_model=CollectedDataResponse)
def create_data(
    payload: CollectedDataCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission(RESOURCE_DATA, ACTION_CREATE)),
) -> CollectedDataResponse:
    campaign = db.get(Campaign, payload.campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    assignment = db.execute(
        select(CampaignAssignment).where(
            CampaignAssignment.campaign_id == payload.campaign_id,
            CampaignAssignment.health_area_id == payload.health_area_id,
            CampaignAssignment.user_id == current_user.id,
        )
    ).scalars().first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No assignment for this campaign/zone")

    record = CollectedData(
        campaign_id=payload.campaign_id,
        user_id=current_user.id,
        health_area_id=payload.health_area_id,
        village_id=payload.village_id,
        data_payload=payload.data_payload,
        source="local_device",
        source_timestamp=payload.source_timestamp,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return CollectedDataResponse(**record.__dict__)


@router.get("/data/status")
def data_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission(RESOURCE_DATA, ACTION_READ)),
) -> dict:
    rows = db.execute(select(CollectedData).where(CollectedData.user_id == current_user.id)).scalars().all()
    pending = sum(1 for row in rows if row.sync_status == "pending")
    synced = sum(1 for row in rows if row.sync_status == "synced")
    conflicts = sum(1 for row in rows if row.sync_status == "conflict")
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total": len(rows),
        "pending": pending,
        "synced": synced,
        "conflicts": conflicts,
    }
