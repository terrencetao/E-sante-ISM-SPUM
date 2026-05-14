import uuid
from datetime import datetime

from pydantic import BaseModel


class HealthAreaCreateRequest(BaseModel):
    name: str
    description: str | None = None


class HealthAreaUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class HealthAreaResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime


class VillageCreateRequest(BaseModel):
    name: str
    description: str | None = None


class VillageResponse(BaseModel):
    id: uuid.UUID
    health_area_id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime
