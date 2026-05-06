# Backend (Phase 2)

## Setup rapide

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Endpoints principaux
- GET /api/health
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/change-pin
- POST /api/users
- GET /api/users
- PATCH /api/users/{user_id}
- DELETE /api/users/{user_id}
- POST /api/users/{user_id}/reset-pin

## Mode developpeur (IMP-002)

Variables utiles dans `.env`:
- APP_ENV=dev|staging|prod
- DEV_SUPERUSER_EMAIL=dev-superuser@local.dev
- DEV_SUPERUSER_PIN=0000

En `APP_ENV=dev`:
- le compte `dev-superuser@local.dev` est seed automatiquement
- RBAC est bypass pour le role `developer_superuser`
- endpoints dev disponibles:
	- POST /api/admin/dev/switch-user
	- POST /api/admin/dev/reset-system
