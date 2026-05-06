from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ACTION_READ, RESOURCE_ANALYTICS, RESOURCE_DATA
from app.database import get_db
from app.middleware.rbac import require_permission
from app.models.campaign import Campaign
from app.models.collected_data import CollectedData
from app.models.health_area import HealthArea
from app.schemas.data import AnalyticsSummaryResponse, CollectedDataResponse

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def summary(
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_ANALYTICS, ACTION_READ)),
) -> AnalyticsSummaryResponse:
    data_rows = db.execute(select(CollectedData)).scalars().all()
    campaigns = {str(c.id): c.name for c in db.execute(select(Campaign)).scalars().all()}
    areas = {str(a.id): a.name for a in db.execute(select(HealthArea)).scalars().all()}

    by_campaign_counter = Counter(campaigns.get(str(row.campaign_id), str(row.campaign_id)) for row in data_rows)
    by_area_counter = Counter(areas.get(str(row.health_area_id), str(row.health_area_id)) for row in data_rows)

    return AnalyticsSummaryResponse(
        total_records=len(data_rows),
        by_campaign=dict(by_campaign_counter),
        by_health_area=dict(by_area_counter),
    )


@router.get("/data", response_model=list[CollectedDataResponse])
def list_data(
    db: Session = Depends(get_db),
    _=Depends(require_permission(RESOURCE_DATA, ACTION_READ)),
) -> list[CollectedDataResponse]:
    rows = db.execute(select(CollectedData).order_by(CollectedData.created_at.desc())).scalars().all()
    return [CollectedDataResponse(**row.__dict__) for row in rows]
