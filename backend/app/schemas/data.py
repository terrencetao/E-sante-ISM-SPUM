import uuid
from datetime import datetime

from pydantic import BaseModel


class CollectedDataCreateRequest(BaseModel):
    campaign_id: uuid.UUID
    health_area_id: uuid.UUID
    village_id: uuid.UUID | None = None
    data_payload: dict
    source_timestamp: datetime


class CollectedDataResponse(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    user_id: uuid.UUID
    health_area_id: uuid.UUID
    village_id: uuid.UUID | None = None
    data_payload: dict
    sync_status: str
    source: str
    source_timestamp: datetime
    created_at: datetime
    updated_at: datetime


class AnalyticsSummaryResponse(BaseModel):
    total_records: int
    by_campaign: dict[str, int]
    by_health_area: dict[str, int]


class MyAssignmentResponse(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    campaign_name: str
    health_area_id: uuid.UUID
    health_area_name: str
    status: str
    assigned_at: datetime
