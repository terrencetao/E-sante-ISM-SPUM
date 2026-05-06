import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ACTION_CREATE, ACTION_READ, ACTION_UPDATE, RESOURCE_ASSIGNMENTS, RESOURCE_CAMPAIGNS
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_permission
from app.models.campaign import Campaign
from app.models.campaign_assignment import CampaignAssignment
from app.models.health_area import HealthArea
from app.models.user import User
from app.schemas.campaign import (
    AssignmentCreateRequest,
    AssignmentResponse,
    CampaignCreateRequest,
    CampaignResponse,
    CampaignUpdateRequest,
)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


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
    campaign.status = payload.status
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return CampaignResponse(**campaign.__dict__)


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

    assignment = CampaignAssignment(
        campaign_id=campaign_id,
        health_area_id=payload.health_area_id,
        user_id=payload.user_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return AssignmentResponse(**assignment.__dict__)


@router.get("/{campaign_id}/assignments", response_model=list[AssignmentResponse])
def list_assignments(
    campaign_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ASSIGNMENTS, ACTION_READ)),
) -> list[AssignmentResponse]:
    assignments = db.execute(select(CampaignAssignment).where(CampaignAssignment.campaign_id == campaign_id)).scalars().all()
    return [AssignmentResponse(**assignment.__dict__) for assignment in assignments]
