import uuid
from datetime import datetime

from pydantic import BaseModel


class CampaignCreateRequest(BaseModel):
    name: str
    description: str | None = None


class CampaignUpdateRequest(BaseModel):
    status: str


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


class AssignmentResponse(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    health_area_id: uuid.UUID
    user_id: uuid.UUID
    status: str
    assigned_at: datetime
