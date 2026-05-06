# API Spec

## Phase 2 - Endpoints disponibles

### Sante
- GET /api/health

### Authentification
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/change-pin

### Administration systeme (role administrator_system)
- POST /api/users
- GET /api/users
- PATCH /api/users/{user_id}
- DELETE /api/users/{user_id}
- POST /api/users/{user_id}/reset-pin

### Geographie et campagnes
- POST /api/zones
- GET /api/zones
- PATCH /api/zones/{zone_id}
- POST /api/zones/{zone_id}/villages
- GET /api/zones/{zone_id}/villages
- POST /api/campaigns
- GET /api/campaigns
- PATCH /api/campaigns/{campaign_id}
- POST /api/campaigns/{campaign_id}/assignments
- GET /api/campaigns/{campaign_id}/assignments

### Collecte et sync
- GET /api/me/assignment
- POST /api/data
- GET /api/data/status
- POST /api/sync

### Analytics et administration avancee
- GET /api/analytics/summary
- GET /api/analytics/data
- GET /api/admin/conflicts
- PATCH /api/admin/conflicts/{conflict_id}
- GET /api/admin/audit-logs

### Mode developpeur (APP_ENV=dev uniquement)
- POST /api/admin/dev/switch-user
- POST /api/admin/dev/reset-system

## Token JWT
- Type: Bearer
- Header: Authorization: Bearer <token>
- Claims principales: sub, role, iat, exp

## Utilisateur seed
- Email: admin-system@local.dev
- PIN: 1234

## Utilisateur super dev (APP_ENV=dev)
- Email: dev-superuser@local.dev
- PIN: 0000

Cet utilisateur est cree automatiquement au demarrage backend si absent.
