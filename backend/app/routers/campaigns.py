import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ACTION_CREATE, ACTION_DELETE, ACTION_READ, ACTION_UPDATE, RESOURCE_ASSIGNMENTS, RESOURCE_CAMPAIGNS
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_permission
from app.models.campaign import Campaign
from app.models.campaign_assignment import CampaignAssignment
from app.models.collected_data import CollectedData
from app.models.health_area import HealthArea
from app.models.user import User
from app.schemas.campaign import (
    AssignmentCreateRequest,
    AssignmentResponse,
    AssignmentUpdateRequest,
    AssignmentWithLabelsResponse,
    CampaignCreateRequest,
    CampaignResponse,
    CampaignUpdateRequest,
)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def _ensure_unique_assignment(db: Session, campaign_id: uuid.UUID, health_area_id: uuid.UUID, user_id: uuid.UUID, exclude_id: uuid.UUID | None = None) -> None:
    query = select(CampaignAssignment).where(
        CampaignAssignment.campaign_id == campaign_id,
        CampaignAssignment.health_area_id == health_area_id,
        CampaignAssignment.user_id == user_id,
    )
    rows = db.execute(query).scalars().all()
    for row in rows:
        if exclude_id is None or row.id != exclude_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Assignment already exists for this user, campaign and zone")


@router.post("", response_model=CampaignResponse)
def create_campaign(
    payload: CampaignCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission(RESOURCE_CAMPAIGNS, ACTION_CREATE)),
) -> CampaignResponse:
    existing = db.execute(select(Campaign).where(Campaign.name == payload.name)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Campaign name already exists")

    campaign = Campaign(name=payload.name, description=payload.description, created_by=current_user.id)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return CampaignResponse(**campaign.__dict__)


@router.get("", response_model=list[CampaignResponse])
def list_campaigns(
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_CAMPAIGNS, ACTION_READ)),
) -> list[CampaignResponse]:
    campaigns = db.execute(select(Campaign).order_by(Campaign.created_at.desc())).scalars().all()
    return [CampaignResponse(**campaign.__dict__) for campaign in campaigns]


@router.patch("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: uuid.UUID,
    payload: CampaignUpdateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_CAMPAIGNS, ACTION_UPDATE)),
) -> CampaignResponse:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    if payload.name is not None and payload.name != campaign.name:
        existing = db.execute(select(Campaign).where(Campaign.name == payload.name)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Campaign name already exists")
        campaign.name = payload.name

    if payload.description is not None:
        campaign.description = payload.description

    if payload.status is not None:
        campaign.status = payload.status

    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return CampaignResponse(**campaign.__dict__)


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_CAMPAIGNS, ACTION_DELETE)),
) -> dict[str, str]:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    has_data = db.execute(select(CollectedData.id).where(CollectedData.campaign_id == campaign_id).limit(1)).scalar_one_or_none()
    if has_data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete campaign with collected data")

    assignments = db.execute(select(CampaignAssignment).where(CampaignAssignment.campaign_id == campaign_id)).scalars().all()
    for assignment in assignments:
        db.delete(assignment)

    db.delete(campaign)
    db.commit()
    return {"status": "deleted"}


@router.post("/{campaign_id}/assignments", response_model=AssignmentResponse)
def create_assignment(
    campaign_id: uuid.UUID,
    payload: AssignmentCreateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ASSIGNMENTS, ACTION_CREATE)),
) -> AssignmentResponse:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    zone = db.get(HealthArea, payload.health_area_id)
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health area not found")

    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    _ensure_unique_assignment(db, campaign_id, payload.health_area_id, payload.user_id)

    assignment = CampaignAssignment(
        campaign_id=campaign_id,
        health_area_id=payload.health_area_id,
        user_id=payload.user_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return AssignmentResponse(**assignment.__dict__)


@router.get("/assignments", response_model=list[AssignmentWithLabelsResponse])
def list_all_assignments(
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ASSIGNMENTS, ACTION_READ)),
) -> list[AssignmentWithLabelsResponse]:
    rows = db.execute(
        select(CampaignAssignment, Campaign.name, HealthArea.name, User.email)
        .join(Campaign, Campaign.id == CampaignAssignment.campaign_id)
        .join(HealthArea, HealthArea.id == CampaignAssignment.health_area_id)
        .join(User, User.id == CampaignAssignment.user_id)
        .order_by(CampaignAssignment.assigned_at.desc())
    ).all()
    return [
        AssignmentWithLabelsResponse(
            id=assignment.id,
            campaign_id=assignment.campaign_id,
            health_area_id=assignment.health_area_id,
            user_id=assignment.user_id,
            status=assignment.status,
            assigned_at=assignment.assigned_at,
            campaign_name=campaign_name,
            health_area_name=health_area_name,
            user_email=user_email,
        )
        for assignment, campaign_name, health_area_name, user_email in rows
    ]


@router.patch("/assignments/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: uuid.UUID,
    payload: AssignmentUpdateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ASSIGNMENTS, ACTION_UPDATE)),
) -> AssignmentResponse:
    assignment = db.get(CampaignAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    campaign_id = payload.campaign_id or assignment.campaign_id
    health_area_id = payload.health_area_id or assignment.health_area_id
    user_id = payload.user_id or assignment.user_id

    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    zone = db.get(HealthArea, health_area_id)
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health area not found")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    _ensure_unique_assignment(db, campaign_id, health_area_id, user_id, exclude_id=assignment.id)

    assignment.campaign_id = campaign_id
    assignment.health_area_id = health_area_id
    assignment.user_id = user_id
    if payload.status is not None:
        assignment.status = payload.status

    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return AssignmentResponse(**assignment.__dict__)


@router.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ASSIGNMENTS, ACTION_DELETE)),
) -> dict[str, str]:
    assignment = db.get(CampaignAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    return {"status": "deleted"}


@router.get("/{campaign_id}/assignments", response_model=list[AssignmentResponse])
def list_assignments(
    campaign_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ASSIGNMENTS, ACTION_READ)),
) -> list[AssignmentResponse]:
    assignments = db.execute(select(CampaignAssignment).where(CampaignAssignment.campaign_id == campaign_id)).scalars().all()
    return [AssignmentResponse(**assignment.__dict__) for assignment in assignments]
