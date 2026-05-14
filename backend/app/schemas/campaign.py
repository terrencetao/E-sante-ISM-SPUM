import uuid
from datetime import datetime

from pydantic import BaseModel


class CampaignCreateRequest(BaseModel):
    name: str
    description: str | None = None


class CampaignUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class CampaignResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    status: str
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AssignmentCreateRequest(BaseModel):
    health_area_id: uuid.UUID
    user_id: uuid.UUID


class AssignmentUpdateRequest(BaseModel):
    campaign_id: uuid.UUID | None = None
    health_area_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    status: str | None = None


class AssignmentResponse(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    health_area_id: uuid.UUID
    user_id: uuid.UUID
    status: str
    assigned_at: datetime


class AssignmentWithLabelsResponse(AssignmentResponse):
    campaign_name: str
    health_area_name: str
    user_email: str
