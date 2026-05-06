# Development Setup

## Initialisation locale

1. Verifier pre-requis:

```bash
./scripts/check-prereqs.sh
```

2. Deployer la phase 1:

```bash
./scripts/deploy.sh
```

3. Verifier l'etat:

```bash
kubectl -n e-sante-ism-spum get all
```

## Workflow Dev
- Utiliser le namespace e-sante-ism-spum
- Ajouter les futurs manifests dans k8s/
- Garder les scripts idempotents

## Backend Phase 2

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Verification API:

```bash
curl http://127.0.0.1:8000/api/health
```
