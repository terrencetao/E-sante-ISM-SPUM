import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ACTION_CREATE, ACTION_DELETE, ACTION_READ, ACTION_UPDATE, RESOURCE_ZONES
from app.database import get_db
from app.middleware.rbac import require_permission
from app.models.campaign_assignment import CampaignAssignment
from app.models.collected_data import CollectedData
from app.models.health_area import HealthArea
from app.models.village import Village
from app.schemas.geography import (
    HealthAreaCreateRequest,
    HealthAreaResponse,
    HealthAreaUpdateRequest,
    VillageCreateRequest,
    VillageResponse,
)

router = APIRouter(prefix="/zones", tags=["zones"])


@router.post("", response_model=HealthAreaResponse)
def create_zone(
    payload: HealthAreaCreateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ZONES, ACTION_CREATE)),
) -> HealthAreaResponse:
    existing = db.execute(select(HealthArea).where(HealthArea.name == payload.name)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Zone name already exists")

    zone = HealthArea(name=payload.name, description=payload.description)
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return HealthAreaResponse(**zone.__dict__)


@router.get("", response_model=list[HealthAreaResponse])
def list_zones(
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ZONES, ACTION_READ)),
) -> list[HealthAreaResponse]:
    zones = db.execute(select(HealthArea).order_by(HealthArea.created_at.desc())).scalars().all()
    return [HealthAreaResponse(**zone.__dict__) for zone in zones]


@router.patch("/{zone_id}", response_model=HealthAreaResponse)
def update_zone(
    zone_id: uuid.UUID,
    payload: HealthAreaUpdateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ZONES, ACTION_UPDATE)),
) -> HealthAreaResponse:
    zone = db.get(HealthArea, zone_id)
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    if payload.name is not None and payload.name != zone.name:
        existing = db.execute(select(HealthArea).where(HealthArea.name == payload.name)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Zone name already exists")
        zone.name = payload.name

    if payload.description is not None:
        zone.description = payload.description

    db.add(zone)
    db.commit()
    db.refresh(zone)
    return HealthAreaResponse(**zone.__dict__)


@router.delete("/{zone_id}")
def delete_zone(
    zone_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ZONES, ACTION_DELETE)),
) -> dict[str, str]:
    zone = db.get(HealthArea, zone_id)
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    has_data = db.execute(select(CollectedData.id).where(CollectedData.health_area_id == zone_id).limit(1)).scalar_one_or_none()
    if has_data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete zone with collected data")

    assignments = db.execute(select(CampaignAssignment).where(CampaignAssignment.health_area_id == zone_id)).scalars().all()
    for assignment in assignments:
        db.delete(assignment)

    villages = db.execute(select(Village).where(Village.health_area_id == zone_id)).scalars().all()
    for village in villages:
        db.delete(village)

    db.delete(zone)
    db.commit()
    return {"status": "deleted"}


@router.post("/{zone_id}/villages", response_model=VillageResponse)
def create_village(
    zone_id: uuid.UUID,
    payload: VillageCreateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ZONES, ACTION_CREATE)),
) -> VillageResponse:
    zone = db.get(HealthArea, zone_id)
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    village = Village(health_area_id=zone_id, name=payload.name, description=payload.description)
    db.add(village)
    db.commit()
    db.refresh(village)
    return VillageResponse(**village.__dict__)


@router.get("/{zone_id}/villages", response_model=list[VillageResponse])
def list_villages(
    zone_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ZONES, ACTION_READ)),
) -> list[VillageResponse]:
    villages = db.execute(select(Village).where(Village.health_area_id == zone_id)).scalars().all()
    return [VillageResponse(**village.__dict__) for village in villages]
