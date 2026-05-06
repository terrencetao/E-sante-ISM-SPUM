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
