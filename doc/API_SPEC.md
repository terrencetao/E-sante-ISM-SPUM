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

## Token JWT
- Type: Bearer
- Header: Authorization: Bearer <token>
- Claims principales: sub, role, iat, exp

## Utilisateur seed
- Email: admin-system@local.dev
- PIN: 1234

Cet utilisateur est cree automatiquement au demarrage backend si absent.
