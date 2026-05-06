import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ACTION_CREATE, ACTION_READ, ACTION_UPDATE, RESOURCE_ZONES
from app.database import get_db
from app.middleware.rbac import require_permission
from app.models.health_area import HealthArea
from app.models.village import Village
from app.schemas.geography import (
    HealthAreaCreateRequest,
    HealthAreaResponse,
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
    payload: HealthAreaCreateRequest,
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ZONES, ACTION_UPDATE)),
) -> HealthAreaResponse:
    zone = db.get(HealthArea, zone_id)
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    zone.name = payload.name
    zone.description = payload.description
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return HealthAreaResponse(**zone.__dict__)


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
