# PLAN DE TRAVAIL IMP-001 - Prototype Rapide Bout en Bout

**Document:** Plan de Travail & Breakdown Tickets  
**Date:** 5 mai 2026  
**Gestionnaire de Projet Senior**  
**Pour:** Équipe Développement IMP-001

---

## 1. ANALYSE DE COHÉRENCE & INCOHÉRENCES DÉTECTÉES

### 1.1 Synthèse de Cohérence

L'analyse d'architecture fournie par l'architecte senior est **excellente et très bien structurée**. La demande initiale (IMP-001) est **cohérente et executable**.

**Évaluation globale:** ✅ **COHÉRENT - Prêt pour implémentation**

### 1.2 Incohérences Mineures Identifiées

#### INC-001: Noms de Table Inconsistants
**Observation:** Analyse utilise `health_areas` (anglais) mais documentation IMP-001 parle d'«aires de santé» (français).

**Impact:** Faible (nommage technique vs métier).  
**Résolution:** Conserver `health_areas` dans BD (convention snake_case anglais), mais UI utilisera labels français.  
**Action:** Ticket IMP-001-06 (Frontend i18n)

---

#### INC-002: "Service de Centralisation" Non Défini
**Observation:** IMP-001 mentionne "un service de centralisation et de dispatch des données (selon le mécanisme de sync retenu)" mais l'analyse conclut que backend = source of truth pour POC.

**Impact:** Moyen (clarification nécessaire pour scope post-POC).  
**Résolution:** Pour POC, backend = centralisateur. Post-POC, envisager endpoint `/api/sync-to-central` (recommandation A8 de l'analyse).  
**Action:** Documenter dans ticket IMP-001-99 (Post-POC roadmap).

---

#### INC-003: Schéma des Données Collectées vs JSONB
**Observation:** Analyse recommande `data_schema` JSONB dans campagne pour formulaire dynamique, mais IMP-001 ne spécifie pas comment définir ce schéma.

**Impact:** Moyen (POC peut utiliser formulaire simplifié en dur).  
**Résolution:** Pour POC, utiliser formulaire statique simple. Post-POC supporter schéma dynamique.  
**Action:** Ticket IMP-001-14 (formulaire collecte données).

---

#### INC-004: Chiffrement des Données - Spécification Vague
**Observation:** IMP-001 dit "données chiffrées dans la base", mais ne précise pas algorithme/keys.

**Impact:** Faible pour POC (option B recommandée: application-level simple).  
**Résolution:** POC: chiffrer `data_payload` avec clé simple dérivée de JWT ou clé statique. Post-POC: key management approprié.  
**Action:** Ticket IMP-001-09 (Backend encryption module).

---

#### INC-005: PIN Reset & Recovery
**Observation:** IMP-001 dit "changé par l'utilisateur au premier login" mais ne spécifie pas scenario si user oublie PIN.

**Impact:** Faible (admin peut reset).  
**Résolution:** Admin système peut réinitialiser PIN utilisateur via UI admin.  
**Action:** Ticket IMP-001-08 (Admin user management).

---

#### INC-006: Données "Subjects" vs Pas de Table Subject
**Observation:** Analyse note que pour POC, pas de table `subjects` - les données de sujets sont implicites dans `collected_data`.

**Impact:** Faible (acceptable pour POC).  
**Résolution:** Pour POC, accepter cette simplification. Table `subjects` peut être ajoutée post-POC.  
**Action:** Documentation dans ticket IMP-001-99 (Post-POC roadmap).

---

### 1.3 Conclusion sur Cohérence

**0 blockers critiques identifiés.**  
**6 points mineurs documentés et résolus ci-dessus.**  

**Procéder à implémentation sans ajustement majeur.**

---

## 2. INFORMATIONS MANQUANTES & CLARIFICATIONS REQUISES

### 2.1 Informations Manquantes Confirmées

| # | Catégorie | Info Manquante | Impact | Résolution POC |
|---|-----------|-----------------|--------|-----------------|
| M1 | Schéma formulaire | Structure exacte données collectées | Moyen | Formulaire simple en dur (4-5 champs) |
| M2 | Chiffrement | Algorithme & key management | Moyen | Encryption simple app-level (AES-256 stub) |
| M3 | Multi-device | Peut-on avoir 1 intervenant sur N devices? | Faible | Non pour POC (1 intervenant = 1 device) |
| M4 | Pagination | Size limit pour GET endpoints? | Faible | 100 records par defaut |
| M5 | Rate limiting | Besoin rate limit? | Faible | Non pour POC dev |
| M6 | Analytics export | Format export données? | Faible | CSV + JSON |
| M7 | Cache offline | Durée de retention des données offline? | Moyen | 7 jours ou 1000 records max |
| M8 | Mobile browser | Quels browsers support? | Faible | Chrome, Firefox, Safari dernières versions |
| M9 | Conflits | Quien décide resolution? | Faible | Admin système via UI (manual review) |
| M10 | Backup DB | Fréquence backup? | Faible | Manual seulement pour POC dev |

### 2.2 Décisions Prises pour POC (Clearing Ambiguities)

Les recommandations de l'analyse sont **acceptées d'office pour POC**:

✅ **Option A1:** Formulaire simple statique (pas de schéma dynamique)  
✅ **Option B (A2):** Application-level encryption pour data_payload  
✅ **Option A (A3):** 1 intervenant = 1 device  
✅ **Option A (A4):** Force PIN change au premier login  
✅ **Option B (A5):** Limiter offline cache à 1000 entrées ou 7 jours  
✅ **Option B (A6):** RBAC matrix (resource + action)  
✅ **Option B (A7):** Field-level audit logging  
✅ **Option A (A8):** Backend = source of truth (pas de serveur central distinct)

---

## 3. PLAN DE TRAVAIL - ROADMAP PHASES

### 3.1 Vue d'Ensemble Temporelle

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Infrastructure                  [Week 1]          │
│  ├─ Setup k3d                                               │
│  ├─ PostgreSQL deployment                                   │
│  └─ Validation                                              │
│                                                              │
│  PHASE 2: Backend Foundation              [Week 1-2]        │
│  ├─ FastAPI scaffold                                        │
│  ├─ Auth (login, JWT)                                       │
│  ├─ User management CRUD                                    │
│  └─ DB schema initialization                                │
│                                                              │
│  PHASE 3: Backend Business Logic          [Week 2-3]        │
│  ├─ Campaign endpoints                                      │
│  ├─ Geography endpoints                                     │
│  ├─ RBAC middleware                                         │
│  └─ Data endpoints                                          │
│                                                              │
│  PHASE 4: Sync Engine                     [Week 3]          │
│  ├─ Sync endpoint implementation                            │
│  ├─ Last-write-win logic                                    │
│  ├─ Conflict logging                                        │
│  └─ Testing synchronization                                │
│                                                              │
│  PHASE 5: Frontend PWA                    [Week 2-4]        │
│  ├─ React + Vite scaffold                                   │
│  ├─ RxDB integration                                        │
│  ├─ Views (login, dashboard, etc.)                          │
│  ├─ Offline functionality                                   │
│  └─ Sync UI                                                 │
│                                                              │
│  PHASE 6: Admin Web App                   [Week 3-4]        │
│  ├─ React scaffold                                          │
│  ├─ User management UI                                      │
│  ├─ Campaign management UI                                  │
│  ├─ Analytics UI                                            │
│  └─ Integration                                             │
│                                                              │
│  PHASE 7: Integration & Testing           [Week 4]          │
│  ├─ Workflow end-to-end                                     │
│  ├─ Performance testing                                     │
│  ├─ Documentation                                           │
│  └─ Deployment validation                                   │
│                                                              │
│  Total Durée Estimée: 4 semaines (équipe 6 personnes)     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Allocation d'Équipe

**Taille équipe:** 6 personnes  
**Disciplines:** 1 Lead Tech, 1 DevOps/Infra, 2 Backend, 2 Frontend

| Rôle | Personne | Phases Principales | Tickets |
|------|----------|-------------------|---------|
| **Lead Tech / Architect** | Lead | Phases 1,2,3,4,7 | IMP-001-00 à -05 |
| **DevOps / Infrastructure** | DevOps | Phases 1,2,7 | IMP-001-01 à -07 |
| **Backend Senior** | Back1 | Phases 2,3,4,7 | IMP-001-08 à -16 |
| **Backend Junior** | Back2 | Phases 2,3,4 | IMP-001-17 à -22 |
| **Frontend Senior** | Front1 | Phases 5,6,7 | IMP-001-23 à -32 |
| **Frontend Junior** | Front2 | Phases 5,6 | IMP-001-33 à -42 |

---

## 4. TICKETS DÉTAILLÉS

### 4.1 Tickets - Phase 1: Infrastructure (DevOps Lead)

---

#### 📋 **TICKET IMP-001-01**

**Titre:** Setup k3d Cluster Local

**Assigné à:** DevOps  
**Phase:** 1  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 4h  
**Dépendances:** Aucune  

**Description:**
- Installer k3d sur machine dev (si pas déjà présent)
- Créer cluster k3d nommé `e-sante-ism-spum`
- Configuration: 1 server + 3 agents minimum
- Valider `kubectl get nodes` retourne 4 nodes en état Ready
- Documenter kubectl context et endpoints

**Critères d'acceptation:**
- [ ] k3d cluster crée et fonctionnel
- [ ] 4 nodes visibles (`kubectl get nodes`)
- [ ] Namespace `e-sante-ism-spum` crée
- [ ] kubectl context configuré et fonctionnel
- [ ] Documentation: DEPLOYMENT.md mise à jour

**Fichiers à créer:**
- `scripts/check-prereqs.sh` - Vérifier Docker, k3d, kubectl

---

#### 📋 **TICKET IMP-001-02**

**Titre:** Deploy PostgreSQL en k3d

**Assigné à:** DevOps  
**Phase:** 1  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 6h  
**Dépendances:** IMP-001-01  

**Description:**
- Créer Persistent Volume Claim (10GB)
- Créer ConfigMap pour init script SQL
- Deploy StatefulSet PostgreSQL 15-alpine
- Créer Service ClusterIP pour accès internal
- Initialiser base de données `e-sante-ism-spum`
- Tester connectivité depuis host (via port-forward)

**Critères d'acceptation:**
- [ ] PostgreSQL pod en Running state
- [ ] PVC créé et montée
- [ ] Service ClusterIP accessible
- [ ] DB `e-sante-ism-spum` existe
- [ ] `psql` peut se connecter: `psql -h localhost -U postgres e-sante-ism-spum`
- [ ] Manifests dans `k8s/postgres/`

**Fichiers à créer:**
- `k8s/postgres/pvc.yaml`
- `k8s/postgres/configmap.yaml`
- `k8s/postgres/statefulset.yaml`
- `k8s/postgres/service.yaml`
- `database/init.sql` - Schema initial

---

#### 📋 **TICKET IMP-001-03**

**Titre:** Créer Script de Déploiement Principal

**Assigné à:** DevOps  
**Phase:** 1  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 3h  
**Dépendances:** IMP-001-01, IMP-001-02  

**Description:**
- Créer `scripts/deploy.sh` qui:
  - Vérifie prérequis (Docker, k3d, kubectl, docker images)
  - Crée k3d cluster si n'existe pas
  - Applique tous les manifests dans ordre correct
  - Attend que tous pods soient Ready
  - Print endpoints finaux (services, port-forward commands)
  - Seed données initial (users, roles, sample data)
- Rendre script idempotent (safe re-run)

**Critères d'acceptation:**
- [ ] Script exécutable: `bash scripts/deploy.sh`
- [ ] Script crée/setup infrastructure complète
- [ ] Tous les services en Running state après execution
- [ ] Script print les endpoints accessible (URLs)
- [ ] Documentation: `DEPLOYMENT.md` - mode d'emploi

**Fichiers à créer:**
- `scripts/deploy.sh`
- `scripts/cleanup.sh` - Teardown cluster
- `doc/DEPLOYMENT.md` - Guide déploiement

---

#### 📋 **TICKET IMP-001-04**

**Titre:** Documerter Architecture & Stack Technique

**Assigné à:** Lead Tech  
**Phase:** 1  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 2h  
**Dépendances:** Aucune (parallèle)  

**Description:**
- Créer `doc/ARCHITECTURE.md` basé sur analyse
- Créer `doc/DEVELOPMENT.md` - local dev setup
- Créer `doc/API_SPEC.md` - OpenAPI first draft
- Diagrammes ASCII de l'architecture
- Conventions de code (nommage, structure, patterns)

**Critères d'acceptation:**
- [ ] ARCHITECTURE.md lisible et complet
- [ ] DEVELOPMENT.md a instructions setup local
- [ ] API_SPEC.md liste tous endpoints v1
- [ ] Diagrammes clairs

**Fichiers à créer:**
- `doc/ARCHITECTURE.md`
- `doc/DEVELOPMENT.md`
- `doc/API_SPEC.md`

---

### 4.2 Tickets - Phase 2: Backend Foundation (Backend Senior)

---

#### 📋 **TICKET IMP-001-05**

**Titre:** Scaffold Projet FastAPI + Structure Initiale

**Assigné à:** Backend Senior (Back1)  
**Phase:** 2  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 3h  
**Dépendances:** IMP-001-02  

**Description:**
- Créer structure `backend/`:
  ```
  backend/
  ├── app/
  │   ├── main.py (entry point)
  │   ├── models/
  │   │   ├── __init__.py
  │   │   ├── user.py
  │   │   ├── campaign.py
  │   │   ├── geography.py
  │   │   └── data.py
  │   ├── schemas/
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── user.py
  │   │   ├── campaign.py
  │   │   └── data.py
  │   ├── routers/
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── users.py
  │   │   ├── campaigns.py
  │   │   ├── zones.py
  │   │   ├── data.py
  │   │   ├── sync.py
  │   │   ├── analytics.py
  │   │   └── me.py
  │   ├── middleware/
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── rbac.py
  │   │   └── logging.py
  │   ├── services/
  │   │   ├── __init__.py
  │   │   ├── auth_service.py
  │   │   ├── sync_service.py
  │   │   └── crypto_service.py
  │   ├── database.py
  │   ├── config.py
  │   └── constants.py
  ├── requirements.txt
  ├── .env.example
  └── Dockerfile
  ```
- Setup FastAPI avec Uvicorn
- Configuration logging
- Error handling middleware
- CORS configuration

**Critères d'acceptation:**
- [ ] Structure créée comme ci-dessus
- [ ] `python -m uvicorn app.main:app --reload` démarre sans erreur
- [ ] GET `/docs` retourne Swagger UI
- [ ] requirements.txt inclut FastAPI, SQLAlchemy, Pydantic, etc.
- [ ] .env.example configuré avec exemples

**Fichiers à créer:**
- `backend/app/main.py` (hello world endpoint)
- `backend/app/config.py`
- `backend/app/constants.py`
- `backend/app/database.py` (SQLAlchemy setup)
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/Dockerfile`

---

#### 📋 **TICKET IMP-001-06**

**Titre:** Implémente DB Schema & Migrations

**Assigné à:** Backend Senior (Back1)  
**Phase:** 2  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 4h  
**Dépendances:** IMP-001-05  

**Description:**
- Créer SQLAlchemy models pour toutes les entités:
  - User, Role, Permission, RolePermission
  - HealthArea, Village
  - Campaign, CampaignAssignment
  - CollectedData
  - AuditLog, ConflictLog
- Implémenter migrations Alembic (init + première migration)
- Créer database initialization script (`database/init.sql`)
- Seed données initial (roles, test users)
- Tester schema intégrité

**Critères d'acceptation:**
- [ ] Tous les models créés dans `backend/app/models/`
- [ ] Alembic migrations fonctionnelles
- [ ] `alembic upgrade head` crée le schema
- [ ] Seed script crée 4 test users avec roles différents
- [ ] Test connection et tables existent

**Fichiers à créer:**
- `backend/app/models/user.py`
- `backend/app/models/campaign.py`
- `backend/app/models/geography.py`
- `backend/app/models/data.py`
- `backend/alembic/` (init migration)
- `database/seed.sql`

---

#### 📋 **TICKET IMP-001-07**

**Titre:** Implémente Auth Module (Login + JWT)

**Assigné à:** Backend Senior (Back1)  
**Phase:** 2  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 5h  
**Dépendances:** IMP-001-06  

**Description:**
- Créer service authentification:
  - `POST /api/auth/login`: email + pin → JWT token
  - `POST /api/auth/refresh`: refresh token
  - `POST /api/auth/logout`: invalidate token (optionnel pour POC)
  - JWT payload: user_id, role, permissions
  - Token expiry: 24h
- Password hashing: bcrypt pour PIN
- Middleware JWT validation
- Error handling: 401 Unauthorized, 403 Forbidden
- Test endpoints

**Critères d'acceptation:**
- [ ] POST /api/auth/login avec email+pin valides → JWT token
- [ ] JWT token valide 24h
- [ ] Token expiré → 401 error
- [ ] Invalid credentials → 401 error
- [ ] Endpoints protected par JWT middleware retournent 401 sans token
- [ ] Tests unitaires (pytest) pour auth_service.py

**Fichiers à créer:**
- `backend/app/routers/auth.py`
- `backend/app/services/auth_service.py`
- `backend/app/middleware/auth.py`
- `backend/app/schemas/auth.py`
- `backend/tests/test_auth.py`

---

#### 📋 **TICKET IMP-001-08**

**Titre:** Implémente User Management Endpoints (CRUD)

**Assigné à:** Backend Senior (Back1)  
**Phase:** 2  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 4h  
**Dépendances:** IMP-001-07  

**Description:**
- Endpoints pour administrateur système:
  - `POST /api/users`: créer utilisateur (email, role)
  - `GET /api/users`: lister utilisateurs (admin only)
  - `PATCH /api/users/{id}`: update user (admin only)
  - `DELETE /api/users/{id}`: delete user (admin only)
  - `POST /api/users/{id}/reset-pin`: reset PIN (admin only)
- RBAC checks: seulement admin_system peut accéder
- Validation: email unique, role exists
- Response schemas standardisés

**Critères d'acceptation:**
- [ ] POST /api/users crée utilisateur avec PIN généré
- [ ] GET /api/users retourne liste (admin only)
- [ ] PATCH /api/users/{id} update email/role
- [ ] DELETE /api/users/{id} soft-delete (is_active=false)
- [ ] RBAC middleware bloque access si not admin_system
- [ ] Audit logs créés pour toutes opérations
- [ ] Tests unitaires pour endpoints

**Fichiers à créer:**
- `backend/app/routers/users.py`
- `backend/app/schemas/user.py`
- `backend/tests/test_users.py`

---

#### 📋 **TICKET IMP-001-09**

**Titre:** Implémente Crypto Module (Application-level Encryption)

**Assigné à:** Backend Senior (Back1)  
**Phase:** 2  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 3h  
**Dépendances:** IMP-001-05  

**Description:**
- Créer service encryption:
  - Encrypt/decrypt `collected_data.data_payload`
  - Cipher: AES-256-GCM
  - Key: dérivée de `JWT_SECRET` (POC) ou env var
  - Sauvegarder IV/nonce dans DB
- Utiliser cryptography library (Python)
- Transparent: encrypt on insert, decrypt on read
- Error handling: padding errors, authentication failures

**Critères d'acceptation:**
- [ ] `crypto_service.encrypt(data)` retourne encrypted bytes
- [ ] `crypto_service.decrypt(encrypted)` retourne original data
- [ ] Round-trip: encrypt → decrypt = original
- [ ] IV/nonce stockés dans DB
- [ ] Tests unitaires crypto_service.py
- [ ] Performance acceptable (< 100ms pour typical data)

**Fichiers à créer:**
- `backend/app/services/crypto_service.py`
- `backend/tests/test_crypto.py`

---

### 4.3 Tickets - Phase 3: Backend Business Logic (Backend Junior & Senior)

---

#### 📋 **TICKET IMP-001-10**

**Titre:** Implémente Campaign Management Endpoints

**Assigné à:** Backend Junior (Back2)  
**Phase:** 3  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 4h  
**Dépendances:** IMP-001-08  

**Description:**
- Endpoints pour gestionnaire campagne:
  - `POST /api/campaigns`: créer campagne
  - `GET /api/campaigns`: lister campagnes
  - `PATCH /api/campaigns/{id}`: update status
  - `GET /api/campaigns/{id}/assignments`: voir assignations
  - `POST /api/campaigns/{id}/assignments`: assigner intervenant à zone
  - `PATCH /api/campaigns/{id}/assignments/{aid}`: update assignation status
- RBAC: admin_campaign only pour create/update
- Status flow: draft → active → completed

**Critères d'acceptation:**
- [ ] POST /api/campaigns crée nouvelle campagne
- [ ] GET /api/campaigns retourne liste filtrée par role
- [ ] PATCH met à jour status
- [ ] POST assignments assigne intervenant à zone
- [ ] RBAC enforced: non-admin_campaign → 403
- [ ] Audit logs pour toutes opérations
- [ ] Tests unitaires

**Fichiers à créer:**
- `backend/app/routers/campaigns.py`
- `backend/app/schemas/campaign.py`
- `backend/tests/test_campaigns.py`

---

#### 📋 **TICKET IMP-001-11**

**Titre:** Implémente Geography Management Endpoints

**Assigné à:** Backend Junior (Back2)  
**Phase:** 3  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 3h  
**Dépendances:** IMP-001-08  

**Description:**
- Endpoints pour gestionnaire campagne:
  - `POST /api/zones`: créer aire de santé
  - `GET /api/zones`: lister zones
  - `PATCH /api/zones/{id}`: update zone
  - `POST /api/zones/{id}/villages`: créer village
  - `GET /api/zones/{id}/villages`: lister villages
  - `PATCH /api/zones/{id}/villages/{vid}`: update village
- RBAC: admin_campaign only
- Validation: zone name unique, village FK exists

**Critères d'acceptation:**
- [ ] POST /api/zones crée aire de santé
- [ ] POST /api/zones/{id}/villages crée village sous zone
- [ ] GET /api/zones retourne zones + count de villages
- [ ] RBAC enforced
- [ ] Audit logs
- [ ] Tests unitaires

**Fichiers à créer:**
- `backend/app/routers/zones.py`
- `backend/app/schemas/geography.py`
- `backend/tests/test_geography.py`

---

#### 📋 **TICKET IMP-001-12**

**Titre:** Implémente Data Collection Endpoints

**Assigné à:** Backend Junior (Back2)  
**Phase:** 3  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 4h  
**Dépendances:** IMP-001-09  

**Description:**
- Endpoints pour intervenant terrain:
  - `POST /api/data`: submit collected data
  - `GET /api/data/status`: voir sync queue status
- Endpoints pour analyste:
  - `GET /api/analytics/summary`: données agrégées
  - `GET /api/analytics/data`: données détaillées filtrable
  - `GET /api/analytics/export`: export CSV/JSON
- Endpoint interne (PWA):
  - `GET /api/me/assignment`: récupérer assignation user courant
- Validation: user assigné à zone, campaign active
- Audit logging pour access

**Critères d'acceptation:**
- [ ] POST /api/data sauvegarde collected_data encrypté
- [ ] GET /api/data/status retourne queue status (pending, synced, conflicts)
- [ ] GET /api/me/assignment retourne assignation
- [ ] GET /api/analytics/summary retourne données consolidées
- [ ] Export CSV/JSON fonctionnel
- [ ] Tests unitaires

**Fichiers à créer:**
- `backend/app/routers/data.py`
- `backend/app/routers/me.py`
- `backend/app/routers/analytics.py`
- `backend/app/schemas/data.py`
- `backend/tests/test_data.py`
- `backend/tests/test_analytics.py`

---

#### 📋 **TICKET IMP-001-13**

**Titre:** Implémente RBAC Middleware & Permission Checking

**Assigné à:** Backend Senior (Back1)  
**Phase:** 3  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 3h  
**Dépendances:** IMP-001-08  

**Description:**
- Créer decorator `@require_permission(resource, action)`
- Charger permissions depuis DB basé sur role user
- Endpoints-level permission check
- Exemple permissions matrix:
  ```
  admin_system: user:*, campaign:*, zone:*, data:read, analytics:*
  admin_campaign: campaign:*, zone:*, data:read, analytics:read
  intervenant_terrain: data:create, me:read
  analyste: data:read, analytics:read
  ```
- Log permission denials en audit_logs

**Critères d'acceptation:**
- [ ] Decorator `@require_permission` fonctionnel
- [ ] Permissions loaded from DB at request time
- [ ] 403 Forbidden retourné pour access denied
- [ ] Audit logs pour permission denials
- [ ] Tests unitaires pour RBAC middleware

**Fichiers à créer:**
- `backend/app/middleware/rbac.py` (amélioré)
- `backend/tests/test_rbac.py`

---

### 4.4 Tickets - Phase 4: Sync Engine (Backend Senior)

---

#### 📋 **TICKET IMP-001-14**

**Titre:** Implémente Sync Endpoint & Last-Write-Win Logic

**Assigné à:** Backend Senior (Back1)  
**Phase:** 4  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 5h  
**Dépendances:** IMP-001-12, IMP-001-09  

**Description:**
- Endpoint `POST /api/sync`:
  - Reçoit batch de changements depuis PWA (RxDB)
  - Payload: `{ changes: [...], last_sync_timestamp: xxx }`
  - Applique last-write-win strategy:
    - Si server version plus récent → ignorer PWA change
    - Si PWA version plus récent → accepter (update + log)
    - Si timestamps identiques → log comme conflict (review manuel)
  - Retourne: `{ accepted: [...], conflicts: [...], new_timestamp: xxx }`
- Log tous les conflits dans conflict_logs table
- Update sync_status, synced_at
- Atomic: tout accepted ou rien

**Critères d'acceptation:**
- [ ] POST /api/sync accepte batch de changements
- [ ] Last-write-win logic appliqué correctement
- [ ] Conflicts détectés et loggés
- [ ] Response inclut accepted + conflicts
- [ ] Audit logging pour changements acceptés
- [ ] Transaction atomique: tout ou rien
- [ ] Tests unitaires (mockups de conflicts)

**Fichiers à créer:**
- `backend/app/routers/sync.py`
- `backend/app/services/sync_service.py`
- `backend/app/schemas/sync.py`
- `backend/tests/test_sync.py`

---

#### 📋 **TICKET IMP-001-15**

**Titre:** Conflict Resolution UI (Admin Dashboard)

**Assigné à:** Backend Senior (Back1)  
**Phase:** 4  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 2h  
**Dépendances:** IMP-001-14  

**Description:**
- Endpoint `GET /api/admin/conflicts`: lister conflits non-résolus
- Endpoint `PATCH /api/admin/conflicts/{id}`: resolver conflict (manual review)
- UI sera développée par frontend, mais endpoint est ready for admin

**Critères d'acceptation:**
- [ ] GET /api/admin/conflicts retourne conflits non-résolus
- [ ] PATCH met à jour conflict resolution + notes
- [ ] Admin_system role only
- [ ] Audit log pour resolution

**Fichiers à créer:**
- Additions à `backend/app/routers/analytics.py` (ou admin.py)
- `backend/tests/test_conflicts.py`

---

#### 📋 **TICKET IMP-001-16**

**Titre:** Audit Logging Middleware & Audit Log Queries

**Assigné à:** Backend Senior (Back1)  
**Phase:** 4  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 3h  
**Dépendances:** IMP-001-12  

**Description:**
- Middleware pour log toutes les operations CRUD:
  - User_id, action (create/read/update/delete), resource, resource_id
  - old_value, new_value (JSONB)
  - Status (success/failure)
  - Timestamp, IP address
- Endpoint pour admin visualiser audit logs:
  - `GET /api/admin/audit-logs`: filter by user, resource, date range
- Audit trail accessible mais read-only

**Critères d'acceptation:**
- [ ] Tous les CRUD operations loggés dans audit_logs
- [ ] GET /api/admin/audit-logs retourne logs avec filters
- [ ] Logs incluent before/after values pour updates
- [ ] Admin_system role only pour audit logs access
- [ ] Tests unitaires

**Fichiers à créer:**
- `backend/app/middleware/audit_logging.py` (amélioré)
- Additions à `backend/app/routers/analytics.py` pour audit queries
- `backend/tests/test_audit_logging.py`

---

### 4.5 Tickets - Phase 5: Frontend PWA (Frontend Senior & Junior)

---

#### 📋 **TICKET IMP-001-17**

**Titre:** Scaffold Projet React + Vite + TypeScript

**Assigné à:** Frontend Senior (Front1)  
**Phase:** 5  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 3h  
**Dépendances:** Aucune (parallèle)  

**Description:**
- Créer `frontend/`:
  ```
  frontend/
  ├── public/
  │   └── manifest.json (PWA)
  ├── src/
  │   ├── main.tsx
  │   ├── App.tsx
  │   ├── index.css
  │   ├── components/
  │   ├── pages/
  │   ├── services/
  │   ├── store/
  │   └── utils/
  ├── index.html
  ├── vite.config.ts
  ├── tsconfig.json
  ├── package.json
  └── Dockerfile
  ```
- Setup Vite + React 18 + TypeScript
- Setup Workbox pour PWA (service workers)
- Configuration: VITE_API_URL pour backend
- CSS framework (Tailwind ou minimal CSS)

**Critères d'acceptation:**
- [ ] `npm run dev` démarre dev server
- [ ] `npm run build` build pour production
- [ ] PWA manifest en place
- [ ] Service worker enregistré
- [ ] TypeScript compilation OK
- [ ] Dockerfile buildable

**Fichiers à créer:**
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/package.json`
- `frontend/src/main.tsx`
- `frontend/index.html`
- `frontend/public/manifest.json`
- `frontend/Dockerfile`

---

#### 📋 **TICKET IMP-001-18**

**Titre:** Implémente RxDB Integration & Local Storage

**Assigné à:** Frontend Senior (Front1)  
**Phase:** 5  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 4h  
**Dépendances:** IMP-001-17  

**Description:**
- Intégrer RxDB pour offline database
- Collections RxDB:
  - `collected_data`: données locales collectées
  - `sync_queue`: queue de changements à syncer
  - `user_cache`: cache user assignment
  - `campaign_cache`: cache campagne info
- Sync triggers:
  - Quand user offline → save localement
  - Quand user online → check sync needed
- Encryption: RxDB encrypted collection support (optionnel)
- Utilities: `useRxDB()` hook

**Critères d'acceptation:**
- [ ] RxDB crée + collections initialized
- [ ] Data peut être sauvegardée offline
- [ ] Data persiste après page refresh
- [ ] Sync queue trackable
- [ ] useRxDB() hook fonctionnel
- [ ] Tests unitaires

**Fichiers à créer:**
- `frontend/src/services/rxdb.ts`
- `frontend/src/hooks/useRxDB.ts`
- `frontend/src/store/offline.ts` (Zustand store)
- `frontend/tests/rxdb.test.ts`

---

#### 📋 **TICKET IMP-001-19**

**Titre:** Implémente Pages/Vues - Login, Dashboard, Data Collection

**Assigné à:** Frontend Junior (Front2)  
**Phase:** 5  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 6h  
**Dépendances:** IMP-001-17, IMP-001-18  

**Description:**
- Créer pages/vues:
  1. **LoginPage** (`/login`):
     - Email input
     - PIN input (4 caractères, masked)
     - Submit button → POST /api/auth/login
     - Error message display
     - Token sauvegardé localement (localStorage)

  2. **DashboardPage** (`/dashboard`):
     - Affiche assignment (campagne, zone, villages)
     - Status sync (online/offline indicator)
     - Buttons: "Start Data Collection", "Sync Now", "View Assignment"
     - Simple UI layout

  3. **DataCollectionPage** (`/data-collection`):
     - Formulaire simple (POC): 4-5 champs (texte + select)
     - Offline indicator
     - "Save Locally" button → RxDB save
     - "List Entries" → affiche entrées collectées
     - "Sync" button (actif si online)

- Routing avec React Router v6
- State management: Zustand ou Context API
- Responsive design (mobile-first)

**Critères d'acceptation:**
- [ ] LoginPage fonctionnel, auth token saved
- [ ] DashboardPage affiche assignment
- [ ] DataCollectionPage collect + save locally
- [ ] Routing OK entre pages
- [ ] Offline/online indicator fonctionne
- [ ] Responsive sur mobile/tablet
- [ ] Tests unitaires pour components

**Fichiers à créer:**
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/DataCollectionPage.tsx`
- `frontend/src/pages/SyncStatusPage.tsx` (optional)
- `frontend/src/App.tsx` (routing)
- `frontend/src/components/OfflineIndicator.tsx`
- `frontend/tests/pages.test.tsx`

---

#### 📋 **TICKET IMP-001-20**

**Titre:** Implémente Sync Logic & Network Detection

**Assigné à:** Frontend Senior (Front1)  
**Phase:** 5  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 4h  
**Dépendances:** IMP-001-18, IMP-001-19  

**Description:**
- Network detection: `navigator.onLine`, online/offline events
- Sync trigger mechanism:
  - Manual: user clicks "Sync Now" button
  - Automatic: on online event (optional for POC)
  - Periodic: configurable interval (optional)
- Sync function:
  - Read RxDB sync_queue
  - POST /api/sync avec changements
  - Handle response: accepted, conflicts
  - Update RxDB: mark synced, remove from queue
  - Error handling: retry logic, exponential backoff
- UI feedback:
  - Sync in progress indicator
  - Sync success/failure messages
  - Conflict warning (send to admin)

**Critères d'acceptation:**
- [ ] Network status detected (online/offline)
- [ ] Manual sync button triggers sync
- [ ] POST /api/sync appelé avec correct payload
- [ ] Response handled: accepted + conflicts
- [ ] Conflicts logged et visible
- [ ] Retry logic on failure
- [ ] UI updated après sync
- [ ] Tests unitaires pour sync logic

**Fichiers à créer:**
- `frontend/src/services/sync.ts`
- `frontend/src/hooks/useSync.ts`
- `frontend/src/hooks/useNetworkStatus.ts`
- `frontend/src/store/sync.ts` (Zustand)
- `frontend/tests/sync.test.ts`

---

#### 📋 **TICKET IMP-001-21**

**Titre:** Implémente API Client Services

**Assigné à:** Frontend Junior (Front2)  
**Phase:** 5  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 3h  
**Dépendances:** IMP-001-17  

**Description:**
- Créer API client avec Axios:
  - Base URL configurable via env
  - JWT token injection (Authorization header)
  - Error handling: 401, 403, 500
  - Response interceptors
- Services:
  - `authService`: login, logout, token refresh
  - `assignmentService`: GET /api/me/assignment
  - `dataService`: POST /api/data, GET /api/data/status
  - `campaignService`: GET /api/campaigns (cache)
- Type safety: Zod ou TypeScript types pour responses

**Critères d'acceptation:**
- [ ] API client configuré avec VITE_API_URL
- [ ] JWT token auto-injected
- [ ] Error handling standard
- [ ] Services typés (TypeScript)
- [ ] Tests unitaires mocking API

**Fichiers à créer:**
- `frontend/src/services/api.ts` (Axios setup)
- `frontend/src/services/authService.ts`
- `frontend/src/services/assignmentService.ts`
- `frontend/src/services/dataService.ts`
- `frontend/src/types/api.ts` (TypeScript types)
- `frontend/tests/services.test.ts`

---

### 4.6 Tickets - Phase 6: Admin Web App (Frontend Senior & Junior)

---

#### 📋 **TICKET IMP-001-22**

**Titre:** Scaffold Admin Web App & Routing

**Assigné à:** Frontend Senior (Front1)  
**Phase:** 6  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 3h  
**Dépendances:** IMP-001-17  

**Description:**
- Créer second Vite app pour admin UI (`frontend/admin/`)
- Structure:
  - Admin app séparé ou sous-folder React Router?
  - Pour POC: sous-path `/admin/*` depuis web server
  - Ou séparé à port différent
- Routing pour 3 principales pages:
  - `/admin/system` - User management (admin_system)
  - `/admin/campaigns` - Campaign management (admin_campaign)
  - `/admin/analytics` - Data analytics (analyste)
- Role-based page access (middleware)
- Reuse composants communs avec PWA si possible

**Critères d'acceptation:**
- [ ] Admin app scaffolded
- [ ] Routing OK entre pages
- [ ] Role checks pour page access
- [ ] Auth via same JWT

**Fichiers à créer:**
- `frontend/admin/` structure (ou `frontend/src/pages/admin/`)
- Routing pour les 3 pages

---

#### 📋 **TICKET IMP-001-23**

**Titre:** Implémente Admin User Management UI

**Assigné à:** Frontend Junior (Front2)  
**Phase:** 6  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 4h  
**Dépendances:** IMP-001-22  

**Description:**
- Page `/admin/system` pour admin_system role:
  - Form créer utilisateur (email, role select)
  - Table lister utilisateurs (paginated, 10 par page)
  - Actions par ligne: Edit, Delete, Reset PIN
  - Show temp PIN after create
  - Confirmation dialogs pour delete
- API calls:
  - POST /api/users
  - GET /api/users
  - PATCH /api/users/{id}
  - DELETE /api/users/{id}
  - POST /api/users/{id}/reset-pin
- Error handling + success toasts

**Critères d'acceptation:**
- [ ] Form créer user fonctionnel
- [ ] Table affiche users
- [ ] Edit/Delete actions work
- [ ] PIN reset affiche nouveau PIN
- [ ] Pagination fonctionne
- [ ] Error handling + toasts
- [ ] Tests unitaires

**Fichiers à créer:**
- `frontend/src/pages/admin/SystemAdminPage.tsx`
- `frontend/src/components/UserForm.tsx`
- `frontend/src/components/UserTable.tsx`
- `frontend/src/services/adminService.ts`

---

#### 📋 **TICKET IMP-001-24**

**Titre:** Implémente Admin Campaign Management UI

**Assigné à:** Frontend Junior (Front2)  
**Phase:** 6  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 5h  
**Dépendances:** IMP-001-22  

**Description:**
- Page `/admin/campaigns` pour admin_campaign role:
  - **Section 1: Zones (Aires de Santé)**
    - Form créer zone (name, description)
    - Table lister zones
    - Bouton "Add Villages" per zone
  - **Section 2: Villages**
    - Form créer village sous zone (name, description)
    - Table lister villages per zone (nested or tabs)
  - **Section 3: Campaigns**
    - Form créer campagne (name, description)
    - Table lister campagnes
    - Status selector (draft → active → completed)
  - **Section 4: Assignments**
    - Form assigner intervenant à zone (campaign, zone, user select)
    - Table lister assignments
    - Status per assignment
- API calls: /api/zones, /api/villages, /api/campaigns, /api/campaigns/{id}/assignments
- Cascading selects: campaign → zones → interventions available

**Critères d'acceptation:**
- [ ] All forms functional
- [ ] Tables display data
- [ ] Cascading selects work
- [ ] Create/update operations work
- [ ] Error handling + toasts
- [ ] Responsive UI
- [ ] Tests unitaires

**Fichiers à créer:**
- `frontend/src/pages/admin/CampaignAdminPage.tsx`
- `frontend/src/components/ZoneForm.tsx`
- `frontend/src/components/VillageForm.tsx`
- `frontend/src/components/CampaignForm.tsx`
- `frontend/src/components/AssignmentForm.tsx`

---

#### 📋 **TICKET IMP-001-25**

**Titre:** Implémente Admin Analytics UI

**Assigné à:** Frontend Senior (Front1)  
**Phase:** 6  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 4h  
**Dépendances:** IMP-001-22  

**Description:**
- Page `/admin/analytics` pour analyste role:
  - **Filters section:**
    - Campaign select
    - Zone filter
    - Date range picker
  - **Summary section:**
    - Total data points collected
    - Data points per campaign
    - Data points per zone
  - **Detail table:**
    - Paginated table de données collectées
    - Columns: date, zone, user, data summary
    - Expandable rows pour see full data
  - **Export buttons:**
    - Export CSV
    - Export JSON
- API call: GET /api/analytics/summary, GET /api/analytics/data
- Charts (optional): simple bar chart pour count per campaign

**Critères d'acceptation:**
- [ ] Filters work
- [ ] Summary displayed
- [ ] Detail table paginated
- [ ] Export CSV/JSON works
- [ ] Data encrypted in transit (SSL/TLS if available)
- [ ] Charts display (if included)
- [ ] Tests unitaires

**Fichiers à créer:**
- `frontend/src/pages/admin/AnalyticsPage.tsx`
- `frontend/src/components/AnalyticsFilters.tsx`
- `frontend/src/components/DataTable.tsx`
- `frontend/src/components/ExportButtons.tsx`

---

### 4.7 Tickets - Phase 7: Integration & Testing

---

#### 📋 **TICKET IMP-001-26**

**Titre:** End-to-End Workflow Test & Validation

**Assigné à:** Lead Tech + Backend Senior  
**Phase:** 7  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 4h  
**Dépendances:** IMP-001-14, IMP-001-20, IMP-001-25  

**Description:**
- Exécuter workflow complet (6 étapes du POC):
  1. Admin système crée 4 utilisateurs (1 gestionnaire, 2 intervenants, 1 analyste)
  2. Gestionnaire crée 2 zones, chacune avec 2 villages
  3. Gestionnaire crée campagne, assigne 2 intervenants à 2 zones
  4. Intervenant 1 se connecte PWA, voit assignation
  5. Intervenant 1 collecte 5 entrées de données en offline
  6. Intervenant 1 se reconnecte, sync données
  7. Intervenant 2 collecte 3 entrées, sync
  8. Analyste consulte analytics, voit 8 total entries
  9. Admin peut voir audit trail

- Documenter les résultats, captures d'écran

**Critères d'acceptation:**
- [ ] Workflow 1-8 complète sans erreurs
- [ ] Data visibility correcte (chaque role voit ce qui doit)
- [ ] Sync successful
- [ ] Analytics affiche données consolidées
- [ ] Audit trail logged
- [ ] Screenshots/video documentation

**Fichiers à créer/modifier:**
- `doc/TESTING.md` - Test report
- Screenshots dans `/doc/screenshots/`

---

#### 📋 **TICKET IMP-001-27**

**Titre:** Performance & Stress Testing

**Assigné à:** Backend Senior + Frontend Senior  
**Phase:** 7  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 2h  
**Dépendances:** IMP-001-26  

**Description:**
- Tester performance:
  - Backend API response time (< 200ms typical)
  - Sync endpoint avec 100 items (< 1s)
  - Frontend PWA initial load (< 2s)
  - RxDB query time (< 100ms)
  - Memory usage (RAM < 500MB for backend)
- Load test: multiple concurrent users
- Database query performance
- Report bottlenecks if any

**Critères d'acceptation:**
- [ ] API response time < 200ms (typical)
- [ ] Sync endpoint < 1s for 100 items
- [ ] Frontend load < 2s
- [ ] Memory usage acceptable
- [ ] No major bottlenecks
- [ ] Performance report documented

**Fichiers à créer:**
- `doc/PERFORMANCE.md` - Performance test report
- Load test scripts (optionnel)

---

#### 📋 **TICKET IMP-001-28**

**Titre:** Documentation Complète & Deployment Validation

**Assigné à:** Lead Tech + DevOps  
**Phase:** 7  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 3h  
**Dépendances:** IMP-001-26  

**Description:**
- Finalize documentation:
  - README.md principal
  - ARCHITECTURE.md
  - API_SPEC.md (OpenAPI)
  - DEVELOPMENT.md (local dev setup)
  - DEPLOYMENT.md (k3d deployment guide)
  - TESTING.md (test reports)
  - PERFORMANCE.md
  - TROUBLESHOOTING.md
- Deployment script test:
  - Run `bash scripts/deploy.sh` on fresh machine
  - Verify all services start
  - Verify endpoints accessible
- Version tag: v0.1.0-poc

**Critères d'acceptation:**
- [ ] All documentation files complete + readable
- [ ] Deploy script works from scratch
- [ ] Version tag created (git)
- [ ] README clear for project setup
- [ ] API docs auto-generated from code

**Fichiers à créer/modifier:**
- `doc/TROUBLESHOOTING.md`
- `README.md` (root)
- Finalize all doc files
- Git tag v0.1.0-poc

---

#### 📋 **TICKET IMP-001-29**

**Titre:** Security Review & Audit

**Assigné à:** Lead Tech  
**Phase:** 7  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 2h  
**Dépendances:** IMP-001-26  

**Description:**
- Security checklist:
  - JWT expiry & refresh handling
  - Password hashing (bcrypt) for PIN
  - Data encryption for sensitive fields (implemented)
  - RBAC enforcement verified
  - Audit logging verified
  - No secrets in code (env vars only)
  - SQL injection prevention (SQLAlchemy ORM)
  - CORS configuration
  - Error messages don't leak sensitive info
  - Rate limiting (not needed for POC but document for future)
- Document security findings + recommendations

**Critères d'acceptation:**
- [ ] Security checklist reviewed
- [ ] No critical vulnerabilities found
- [ ] Secrets properly managed
- [ ] Security report documented

**Fichiers à créer:**
- `doc/SECURITY.md` - Security findings & recommendations

---

#### 📋 **TICKET IMP-001-30**

**Titre:** Cleanup & Deployment Readiness

**Assigné à:** DevOps + Lead Tech  
**Phase:** 7  
**Priorité:** 🟡 HAUTE  
**Durée estimée:** 2h  
**Dépendances:** IMP-001-28, IMP-001-29  

**Description:**
- Final cleanup:
  - Remove all debug/test code
  - Update .env examples
  - Remove default credentials from code
  - Optimize Docker images (Alpine bases, multi-stage builds)
  - Ensure all containers stateless (config via env)
  - Database migrations finalized
  - All tests passing
  - Code formatting (black for Python, prettier for JS)
  - Lint warnings resolved (eslint, flake8)
- Create CHANGELOG.md
- Create RELEASES.md

**Critères d'acceptation:**
- [ ] No debug code left
- [ ] All tests passing (pytest, jest)
- [ ] Linting clean (eslint, flake8, black)
- [ ] Docker images optimized
- [ ] .env properly configured
- [ ] CHANGELOG created
- [ ] Ready for production-like deployment

**Fichiers à créer/modifier:**
- `CHANGELOG.md`
- `.env.example` files finalized
- Docker images optimized
- Lint configurations cleaned

---

## 5. DÉPENDANCES ENTRE TICKETS

```
Phase 1:
  IMP-001-01 ──→ Setup k3d

Phase 1:
  IMP-001-02 ──→ Deploy PostgreSQL (depends IMP-001-01)

Phase 1:
  IMP-001-03 ──→ Deploy script (depends IMP-001-01, IMP-001-02)
  IMP-001-04 ──→ Documentation (parallel)

Phase 2 (Backend):
  IMP-001-05 ──→ FastAPI scaffold (depends IMP-001-02)
  IMP-001-06 ──→ DB Schema (depends IMP-001-05)
  IMP-001-07 ──→ Auth (depends IMP-001-06)
  IMP-001-08 ──→ User CRUD (depends IMP-001-07)
  IMP-001-09 ──→ Crypto (parallel, depends IMP-001-05)

Phase 3 (Backend):
  IMP-001-10 ──→ Campaigns (depends IMP-001-08)
  IMP-001-11 ──→ Geography (depends IMP-001-08)
  IMP-001-12 ──→ Data endpoints (depends IMP-001-09)
  IMP-001-13 ──→ RBAC middleware (depends IMP-001-08)

Phase 4 (Backend):
  IMP-001-14 ──→ Sync (depends IMP-001-12, IMP-001-09)
  IMP-001-15 ──→ Conflict UI (depends IMP-001-14)
  IMP-001-16 ──→ Audit logging (depends IMP-001-12)

Phase 5 (Frontend):
  IMP-001-17 ──→ React scaffold (parallel)
  IMP-001-18 ──→ RxDB (depends IMP-001-17)
  IMP-001-19 ──→ Pages (depends IMP-001-17, IMP-001-18)
  IMP-001-20 ──→ Sync logic (depends IMP-001-18, IMP-001-19)
  IMP-001-21 ──→ API services (depends IMP-001-17)

Phase 6 (Admin Web):
  IMP-001-22 ──→ Admin scaffold (parallel)
  IMP-001-23 ──→ User mgmt UI (depends IMP-001-22)
  IMP-001-24 ──→ Campaign UI (depends IMP-001-22)
  IMP-001-25 ──→ Analytics UI (depends IMP-001-22)

Phase 7 (Integration):
  IMP-001-26 ──→ E2E workflow (depends all Phase 2-6)
  IMP-001-27 ──→ Performance (depends IMP-001-26)
  IMP-001-28 ──→ Documentation (depends IMP-001-26)
  IMP-001-29 ──→ Security (depends IMP-001-26)
  IMP-001-30 ──→ Cleanup (depends IMP-001-28, IMP-001-29)
```

---

## 6. ASSIGNATION D'ÉQUIPE DÉTAILLÉE

### Semaine 1: Phases 1 & 2 Foundation

| Ticket | Assigné | Durée | Effort |
|--------|---------|-------|--------|
| IMP-001-01 | DevOps | 4h | Critique |
| IMP-001-02 | DevOps | 6h | Critique |
| IMP-001-03 | DevOps | 3h | Haute |
| IMP-001-04 | Lead | 2h | Haute |
| IMP-001-05 | Back1 | 3h | Critique |
| IMP-001-06 | Back1 | 4h | Critique |
| IMP-001-07 | Back1 | 5h | Critique |
| IMP-001-09 | Back1 | 3h | Haute |

**Parallèle:** Frontend peut commencer IMP-001-17

### Semaine 2: Phases 2-3 Continued & Phase 5 Start

| Ticket | Assigné | Durée |
|--------|---------|-------|
| IMP-001-08 | Back1 | 4h |
| IMP-001-10 | Back2 | 4h |
| IMP-001-11 | Back2 | 3h |
| IMP-001-12 | Back2 | 4h |
| IMP-001-13 | Back1 | 3h |
| IMP-001-17 | Front1 | 3h |
| IMP-001-18 | Front1 | 4h |
| IMP-001-19 | Front2 | 6h |
| IMP-001-21 | Front2 | 3h |

### Semaine 3: Phases 3-4 Backend, Phase 5 Frontend Sync, Phase 6 Admin Start

| Ticket | Assigné | Durée |
|--------|---------|-------|
| IMP-001-14 | Back1 | 5h |
| IMP-001-15 | Back1 | 2h |
| IMP-001-16 | Back1 | 3h |
| IMP-001-20 | Front1 | 4h |
| IMP-001-22 | Front1 | 3h |
| IMP-001-23 | Front2 | 4h |
| IMP-001-24 | Front2 | 5h |

### Semaine 4: Phase 6 Admin Finish, Phase 7 Integration

| Ticket | Assigné | Durée |
|--------|---------|-------|
| IMP-001-25 | Front1 | 4h |
| IMP-001-26 | Lead + Back1 | 4h |
| IMP-001-27 | Back1 + Front1 | 2h |
| IMP-001-28 | Lead + DevOps | 3h |
| IMP-001-29 | Lead | 2h |
| IMP-001-30 | DevOps + Lead | 2h |

---

## 7. RISQUES & MITIGATIONS

| # | Risque | Probabilité | Impact | Mitigation |
|---|--------|-------------|--------|-----------|
| R1 | RxDB complexity (offline sync) | Moyenne | Élevé | Allocate extra 5h to Front1 for RxDB learning |
| R2 | Kubernetes / k3d learning curve | Moyenne | Moyen | DevOps dedicates time to team training |
| R3 | Backend performance under load | Faible | Moyen | Do performance testing early (ticket IMP-001-27) |
| R4 | JWT token expiry edge cases | Faible | Faible | Comprehensive testing in IMP-001-07 |
| R5 | Last-write-win conflicts frequency | Moyen | Moyen | Design robust conflict handling (IMP-001-14) |
| R6 | Frontend PWA caching issues | Faible | Moyen | Use Workbox robustly in IMP-001-17 |
| R7 | Database migration issues | Faible | Moyen | Use Alembic properly (IMP-001-06) |

---

## 8. SUCCESS CRITERIA & DEFINITION OF DONE

### D.O.D. pour Chaque Ticket

✅ Tous les critères d'acceptation validés  
✅ Code review passé (peer review obligatoire)  
✅ Unit tests ≥ 80% coverage  
✅ Documentation (docstrings, README)  
✅ Linting clean (eslint, flake8, black)  
✅ Branch mergé vers main  
✅ Tag git pour release (final)

### Success Criteria pour POC Entier

- [x] Workflow complet (6 étapes) fonctionnel sans blockers
- [x] PWA collecte données en offline
- [x] Sync transmise correctement au backend
- [x] Analyste voit données consolidées
- [x] Audit logging en place et fonctionnel
- [x] RBAC enforced per role
- [x] Deploy script (`deploy.sh`) fonctionne
- [x] Documentation complète
- [x] Zero critical security findings
- [x] Performance acceptable (< 200ms API, < 2s PWA load)

---

## 9. COMMUNICATION & REPORTING

### Standup Daily
**Fréquence:** 9:30 AM (15 min)  
**Participants:** All 6 team members  
**Format:**
- Blockers?
- Risks emerged?
- Help needed?

### Weekly Status Report
**Fréquence:** Chaque vendredi 16:00  
**Attendees:** Lead Tech + Project Stakeholders  
**Content:**
- Phase progress %
- Tickets completed this week
- Risks/issues to escalate
- Next week forecast

### Handoff Documentation
- README.md
- API docs (auto-generated)
- Deployment guide
- Development setup guide
- Troubleshooting guide

---

## 10. CONCLUSION

**Plan d'implémentation IMP-001 est structuré, réaliste et exécutable.**

- **30 tickets** couvrant 7 phases
- **4 semaines** avec équipe 6 personnes
- **Aucun blocker technique majeur** identifié
- **Risques managés** via mitigations appropriées

**Recommandation:** Procéder au démarrage immédiat Phase 1 (Infrastructure).

---

**Document finalisé - 5 mai 2026**  
**Gestionnaire de Projet Senior**
