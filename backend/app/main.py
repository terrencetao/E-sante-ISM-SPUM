from datetime import datetime
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.constants import DEFAULT_ROLES, ROLE_ADMIN_SYSTEM, ROLE_DEV_SUPERUSER
from app.database import Base, SessionLocal, engine
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.campaign import Campaign  # noqa: F401
from app.models.campaign_assignment import CampaignAssignment  # noqa: F401
from app.models.collected_data import CollectedData  # noqa: F401
from app.models.conflict_log import ConflictLog  # noqa: F401
from app.models.health_area import HealthArea  # noqa: F401
from app.models.role import Role
from app.models.user import User
from app.models.village import Village  # noqa: F401
from app.routers import admin, analytics, auth, campaigns, data, health, sync, users, zones
from app.services.auth_service import decode_token, hash_pin

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(zones.router, prefix=settings.api_prefix)
app.include_router(campaigns.router, prefix=settings.api_prefix)
app.include_router(data.router, prefix=settings.api_prefix)
app.include_router(analytics.router, prefix=settings.api_prefix)
app.include_router(sync.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)


@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    response = await call_next(request)

    token_header = request.headers.get("authorization", "")
    user_id = None
    if token_header.lower().startswith("bearer "):
        token = token_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
            subject = payload.get("sub")
            if subject:
                user_id = uuid.UUID(subject)
        except Exception:
            user_id = None

    action_map = {
        "GET": "read",
        "POST": "create",
        "PATCH": "update",
        "PUT": "update",
        "DELETE": "delete",
    }
    action = action_map.get(request.method.upper(), "read")
    resource = request.url.path

    db = SessionLocal()
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            status="success" if response.status_code < 400 else "failure",
            ip_address=request.client.host if request.client else None,
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        db.commit()
    finally:
        db.close()

    return response


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    _seed_roles_and_admin()


def _seed_roles_and_admin() -> None:
    db = SessionLocal()
    try:
        role_by_name: dict[str, Role] = {}
        for role_name in DEFAULT_ROLES:
            role = db.execute(select(Role).where(Role.name == role_name)).scalar_one_or_none()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.flush()
            role_by_name[role_name] = role

        admin = db.execute(select(User).where(User.email == settings.admin_seed_email)).scalar_one_or_none()
        if not admin:
            admin = User(
                email=settings.admin_seed_email,
                pin_hash=hash_pin(settings.admin_seed_pin),
                role_id=role_by_name[ROLE_ADMIN_SYSTEM].id,
                must_change_pin=True,
                is_active=True,
            )
            db.add(admin)

        if settings.app_env == "dev":
            dev_superuser = db.execute(select(User).where(User.email == settings.dev_superuser_email)).scalar_one_or_none()
            if not dev_superuser:
                dev_superuser = User(
                    email=settings.dev_superuser_email,
                    pin_hash=hash_pin(settings.dev_superuser_pin),
                    role_id=role_by_name[ROLE_DEV_SUPERUSER].id,
                    must_change_pin=False,
                    is_active=True,
                )
                db.add(dev_superuser)

        db.commit()
    finally:
        db.close()
