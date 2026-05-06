# ANALYSE IMP-001 - Prototype Rapide Bout en Bout

**Date d'analyse:** 5 mai 2026  
**Architecte:** Senior Architecture Review  
**Demande source:** [IMP-001-poc1-bout-en-bout-rapide.md](../../implementations/IMP-001-poc1-bout-en-bout-rapide.md)

---

## 1. VISION SYSTÈME GLOBALE

### 1.1 Objectifs Stratégiques

Le prototype IMP-001 vise à :
- **Rapidité de déploiement** : système opérationnel minimum en délai court
- **Simplicité architecturale** : complexité réduite au strict nécessaire
- **Couverture fonctionnelle** : capturing tous les flux métier principaux du système final
- **Viabilité technique** : démonstration des capacités clés (offline-first, sync, RBAC)

### 1.2 Caractéristiques Fondamentales

| Aspect | Caractéristique |
|--------|-----------------|
| **Modèle de connectivité** | Offline-first avec synchronisation asynchrone |
| **Portée biométrique** | Hors scope (version POC) |
| **Environnement de déploiement** | k3d (Kubernetes local dev) |
| **Cycle de vie des données** | Last-write-win avec logging de conflits |
| **Authentification** | Email + PIN 4 caractères (dev-only) |

### 1.3 Scope Fonctionnel du Workflow Principal

Le système doit supporter ce workflow complet (6 étapes) :

```
Étape 1: Admin système crée utilisateurs → roles
         ↓
Étape 2: Gestionnaire crée zones → aires de santé → villages
         ↓
Étape 3: Gestionnaire crée campagne → assigne intervenants à zones
         ↓
Étape 4: Intervenant consulte assignation (online)
         ↓
Étape 5: Intervenant collecte données en mode offline
         ↓
Étape 6: Intervenant se reconnecte → sync données
         ↓
Étape 7: Analyste consulte données consolidées
```

---

## 2. ARCHITECTURE SYSTÈME GÉNÉRALE

### 2.1 Composants Majeurs et Interactions

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE GÉNÉRALE                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TIER UTILISATEUR (Client-side)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PWA Mobile/Tablet (React + Vite + TypeScript)           │  │
│  │  ├─ Vue: Consultation assignation                        │  │
│  │  ├─ Vue: Collecte données (offline-capable)             │  │
│  │  ├─ Vue: Statut de synchronisation                      │  │
│  │  └─ Storage local: RxDB (offline database)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │ (REST API)                           │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
┌────────────▼─────────────────────┐   │
│  TIER WEB STATIQUE              │   │
├─────────────────────────────────┤   │
│ Serveur Web (Nginx/Express)     │   │
│ - Serve PWA                     │   │
│ - Serve Admin Web               │   │
└─────────────────────────────────┘   │
             │                         │
┌────────────▼─────────────────────────▼────────────────────┐
│         TIER MÉTIER (Backend Intermédiaire)               │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Backend API (FastAPI + Uvicorn - Python)       │    │
│  │  ├─ Endpoint: /auth (login)                     │    │
│  │  ├─ Endpoint: /users (management)               │    │
│  │  ├─ Endpoint: /zones (geography)                │    │
│  │  ├─ Endpoint: /campaigns (campaign mgmt)        │    │
│  │  ├─ Endpoint: /sync (data synchronization)      │    │
│  │  ├─ Endpoint: /data (data collection)           │    │
│  │  ├─ Endpoint: /analytics (data retrieval)       │    │
│  │  └─ Middleware: JWT validation, RBAC, Logging   │    │
│  └──────────────────────────────────────────────────┘    │
│                     │                                      │
│                     ▼                                      │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Business Logic Layer                           │    │
│  │  ├─ User & Authorization Service                │    │
│  │  ├─ Campaign Management Service                 │    │
│  │  ├─ Data Sync Engine (last-write-win)           │    │
│  │  ├─ Conflict Resolution & Logging               │    │
│  │  └─ Analytics Query Service                     │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│         TIER DONNÉES (Data Persistence)                  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  PostgreSQL Database                            │    │
│  │  ├─ Encryption at rest (TBD: mechanism)         │    │
│  │  ├─ Audit Log Tables                            │    │
│  │  └─ Data Tables (Users, Campaigns, etc.)        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Interactions entre Composants

| Composant 1 | Composant 2 | Protocole | Fréquence | Notes |
|------------|-----------|-----------|-----------|-------|
| PWA | Web Server | HTTP(S) | Premier chargement + refresh | Serve SPA + assets |
| PWA | Backend API | REST JSON | On-demand + periodic sync | Offline buffer local |
| Backend API | PostgreSQL | SQL/TCP | Per-request | Transactional |
| Admin Web | Backend API | REST JSON | On-demand | UI → Backend |
| Backend | Sync Service | Internal | Per-request | Conflict resolution |

---

## 3. COMPOSANTS LOGICIELS DÉTAILLÉS

### 3.1 PWA (Progressive Web App) - `frontend/`

**Stack:** React 18+ + Vite + TypeScript + Workbox  
**Rôle:** Interface mobile/tablet pour intervention terrain  
**Offline capability:** Oui (RxDB + Service Workers)

#### Responsabilités:
- Authentification locale (JWT token storage)
- Affichage de l'assignation de l'intervenant
- Formulaire de collecte de données
- Gestion du cache local (RxDB)
- Détection de connectivité & trigger de sync
- Affichage du statut de synchronisation

#### Vues Requises:
1. **Vue Login** : Email + PIN input
2. **Vue Dashboard** : Résumé assignation, statut sync
3. **Vue Collecte Données** : Formulaire paramétrable (offline)
4. **Vue Sync Status** : Queue de données, logs, retry

#### Dépendances Externalisées:
```json
{
  "react": "^18.0",
  "vite": "^5.0",
  "typescript": "^5.0",
  "workbox": "^7.0",
  "rxdb": "^15.0",
  "axios": "^1.6"
}
```

---

### 3.2 Web Server (Nginx) - `webserver/`

**Stack:** Nginx ou Express.js  
**Rôle:** Distribution PWA + Admin Web app

#### Responsabilités:
- Serve static PWA assets
- Serve Admin Web app
- Proxy vers Backend API (via path `/api/*`)
- Cache policy configuration

**Configuration minimale:**
```nginx
server {
    location / { # PWA
        try_files $uri /index.html;
    }
    location /admin/ { # Admin Web
        try_files $uri /index.html;
    }
    location /api/ { # Backend proxy
        proxy_pass http://backend:8000;
    }
}
```

---

### 3.3 Backend API (FastAPI) - `backend/`

**Stack:** FastAPI + Uvicorn + SQLModel/SQLAlchemy + Pydantic  
**Rôle:** Logic métier, data persistence, API centralisée

#### Responsabilités:
- Authentication & JWT generation
- RBAC enforcement (per-endpoint)
- Business logic execution
- Data persistence (PostgreSQL)
- Synchronization engine
- Conflict detection & logging
- Audit logging

#### API Endpoints (Minimal Set for POC):

##### Authentication
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

##### User Management (Admin only)
```
POST   /api/users (create)
GET    /api/users (list)
PATCH  /api/users/{id} (update)
DELETE /api/users/{id}
```

##### Geography Management (Gestionnaire de campagne)
```
POST   /api/zones (create aire de santé)
GET    /api/zones
PATCH  /api/zones/{id}
POST   /api/zones/{id}/villages (create village)
GET    /api/zones/{id}/villages
```

##### Campaign Management (Gestionnaire de campagne)
```
POST   /api/campaigns (create)
GET    /api/campaigns
PATCH  /api/campaigns/{id}
POST   /api/campaigns/{id}/assignments (assign intervenant)
GET    /api/campaigns/{id}/assignments
```

##### Data Collection (Intervenant terrain)
```
GET    /api/me/assignment (get assignation for current user)
POST   /api/data (submit collected data)
GET    /api/data/status (sync queue status)
```

##### Analytics (Analyste)
```
GET    /api/analytics/summary
GET    /api/analytics/data?filters=...
GET    /api/analytics/export
```

##### Sync Endpoint (PWA)
```
POST   /api/sync (batch sync from PWA)
    Payload: {
        "changes": [list of local changes],
        "timestamp": server_timestamp
    }
    Response: {
        "accepted": [...],
        "conflicts": [...],
        "timestamp": new_timestamp
    }
```

#### Middleware Layer:
- JWT validation
- RBAC checking (decorator-based)
- Request/response logging
- Encryption/decryption for sensitive fields
- Error handling & standardized responses
- Audit trail middleware

---

### 3.4 PostgreSQL Database - `database/`

**Stack:** PostgreSQL 15+ with PostGIS (optional for future)  
**Rôle:** Persistent storage, audit trail

#### Schema Principal (Minimal):

##### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    pin_hash VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    role_id UUID NOT NULL FOREIGN KEY,
    is_active BOOLEAN DEFAULT TRUE,
    must_change_pin BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    -- Encryption: sensitive fields encrypted at application level
);
```

##### Roles Table
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP
);

-- Roles pour POC:
-- - administrator_system
-- - administrator_campaign
-- - intervenant_terrain
-- - analyste
```

##### Role Permissions (RBAC)
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    resource VARCHAR,
    action VARCHAR,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID FOREIGN KEY,
    permission_id UUID FOREIGN KEY,
    PRIMARY KEY (role_id, permission_id)
);
```

##### Geography Tables
```sql
CREATE TABLE health_areas (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE villages (
    id UUID PRIMARY KEY,
    health_area_id UUID FOREIGN KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

##### Campaign Tables
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    status ENUM('draft', 'active', 'completed'),
    created_by UUID FOREIGN KEY (users),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE campaign_assignments (
    id UUID PRIMARY KEY,
    campaign_id UUID FOREIGN KEY,
    health_area_id UUID FOREIGN KEY,
    user_id UUID FOREIGN KEY (intervenant terrain),
    assigned_at TIMESTAMP,
    status ENUM('assigned', 'active', 'completed')
);
```

##### Data Collection Tables
```sql
CREATE TABLE collected_data (
    id UUID PRIMARY KEY,
    campaign_id UUID FOREIGN KEY,
    user_id UUID FOREIGN KEY (intervenant terrain),
    health_area_id UUID FOREIGN KEY,
    village_id UUID FOREIGN KEY,
    data_payload JSONB, -- Encrypted at application level
    sync_status ENUM('pending', 'synced', 'conflict'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    synced_at TIMESTAMP NULL,
    -- Last write win: track source & timestamp
    source VARCHAR ('local_device', 'backend'),
    source_timestamp TIMESTAMP
);
```

##### Audit Log Table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    action VARCHAR,
    resource VARCHAR,
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    status ENUM('success', 'failure'),
    ip_address INET,
    timestamp TIMESTAMP
);
```

##### Conflict Log Table
```sql
CREATE TABLE conflict_logs (
    id UUID PRIMARY KEY,
    data_id UUID FOREIGN KEY (collected_data),
    local_value JSONB,
    server_value JSONB,
    resolution_strategy VARCHAR ('last_write_win', 'manual_review'),
    resolved_at TIMESTAMP,
    resolved_by UUID FOREIGN KEY (administrator_system),
    resolution_notes TEXT
);
```

---

## 4. VUES (UI/UX INTERFACES)

### 4.1 Vue d'Authentification (PWA)

**Path:** `/login`  
**Rôles autorisés:** Tous (before authentication)  
**Éléments:**
- Champ Email
- Champ PIN (4 caractères, input masqué)
- Bouton Login
- Message d'erreur/feedback

**Flux:**
1. Utilisateur entre email + PIN
2. Submit → Backend API POST `/api/auth/login`
3. Si succès: JWT token sauvegardé localement, redirect vers dashboard
4. Si échec: affiche erreur, force PIN change au premier login

---

### 4.2 Vue Dashboard (PWA)

**Path:** `/dashboard`  
**Rôles autorisés:** `intervenant_terrain`  
**Éléments:**
- Affichage de l'assignation (campagne, zone, villages)
- Bouton "Voir Assignation Complète"
- Bouton "Démarrer Collecte"
- Statut de synchronisation (en ligne/hors-ligne, % sync)
- Log des dernières actions

**Flux:**
1. GET `/api/me/assignment` → récupère assignation courante
2. Affiche résumé
3. Permet navigation vers collecte ou vers detail assignation

---

### 4.3 Vue Collecte de Données (PWA)

**Path:** `/data-collection`  
**Rôles autorisés:** `intervenant_terrain`  
**Stockage:** RxDB (local)  
**Éléments:**
- Formulaire dynamique basé sur campagne (pour POC: simple form)
- Indicateur offline/online
- Bouton "Sauvegarder Localement"
- Liste des entrées collectées
- Bouton "Synchroniser" (actif seulement si online)

**Flux:**
1. Utilisateur remplit formulaire offline
2. Submit → sauvegarde dans RxDB localement
3. Si online: peut faire sync via bouton "Synchroniser"
4. Sync appelle POST `/api/sync` avec batch de changements
5. Récupère réponse (accepted, conflicts)
6. Mise à jour UI

---

### 4.4 Vue Admin Système (Web Admin)

**Path:** `/admin/system`  
**Rôles autorisés:** `administrator_system`  
**Éléments:**
- Formulaire création utilisateurs
- Table listage utilisateurs
- Actions: edit, delete, change PIN, toggle active

**Flux:**
1. Admin remplit form (email, role)
2. POST `/api/users` → Backend crée user avec PIN temp
3. Liste affichée
4. Admin peut émettre PIN (ou user change au premier login)

---

### 4.5 Vue Gestion Campagnes (Web Admin)

**Path:** `/admin/campaigns`  
**Rôles autorisés:** `administrator_campaign`  
**Éléments:**
- Formulaire création zones (aires de santé)
- Formulaire création villages sous zones
- Tableau affichage zones + villages
- Formulaire création campagne
- Formulaire assignation intervenant-zone-campagne

**Flux:**
1. Crée zones → POST `/api/zones`
2. Crée villages sous zone → POST `/api/zones/{id}/villages`
3. Crée campagne → POST `/api/campaigns`
4. Assigne interventions → POST `/api/campaigns/{id}/assignments`

---

### 4.6 Vue Analytics (Web Admin)

**Path:** `/admin/analytics`  
**Rôles autorisés:** `analyste`  
**Éléments:**
- Filtres (campagne, zone, date range)
- Tableau agrégé des données
- Graphiques simples
- Bouton export CSV/JSON

**Flux:**
1. GET `/api/analytics/summary?filters=...`
2. Affiche données consolidées
3. Peut filtrer, exporter

---

## 5. ENTITÉS DE DONNÉES - DÉTAIL

### 5.1 User (Utilisateur du Système)

**Classe 1: Identification**
```
id (UUID)
email (String, unique)
pin_hash (String, bcrypt)
first_name (String)
last_name (String)
```

**Classe 2: Rôle & Permissions**
```
role_id (Foreign Key → roles)
permissions (computed from role)
is_active (Boolean)
must_change_pin (Boolean)
```

**Métadonnées:**
```
created_at (Timestamp)
updated_at (Timestamp)
last_login (Timestamp, nullable)
```

---

### 5.2 Subject (Sujet - Personne enquêtée)

**Note:** Pour POC, les "sujets" sont implicites dans les données collectées. Pas d'entité dédiée de sujet.

**Classe 1: Identification** (optionnelle)
```
id (UUID)
subject_code (String, unique)
```

**Classe 2: Socio-Démographique**
```
[Dependent on campaign data schema]
age (Integer)
gender (Enum)
health_status (String)
```

**Classe 3: Données Médicales**
```
[Campaign-specific]
```

---

### 5.3 Geography (Géographie Administrative)

#### Health Area (Aire de Santé)
```
id (UUID)
name (String)
description (Text)
created_at (Timestamp)
updated_at (Timestamp)
```

#### Village
```
id (UUID)
health_area_id (FK)
name (String)
description (Text)
created_at (Timestamp)
updated_at (Timestamp)
```

---

### 5.4 Campaign (Campagne)

```
id (UUID)
name (String)
description (Text)
status (Enum: draft, active, completed)
created_by (FK → User)
created_at (Timestamp)
updated_at (Timestamp)

-- Embedded schema definition (for POC)
data_schema (JSONB) 
```

---

### 5.5 Campaign Assignment (Assignation)

```
id (UUID)
campaign_id (FK)
health_area_id (FK)
user_id (FK → User, must be intervenant_terrain)
assigned_at (Timestamp)
status (Enum: assigned, active, completed)
```

---

### 5.6 Collected Data (Données Collectées)

```
id (UUID)
campaign_id (FK)
user_id (FK → intervenant_terrain who collected)
health_area_id (FK)
village_id (FK, nullable - collected in zone but maybe specific village)
data_payload (JSONB, application-encrypted)
sync_status (Enum: pending, synced, conflict)

-- Timestamp tracking for last-write-win
created_at (Timestamp)
updated_at (Timestamp)
synced_at (Timestamp, nullable)

-- Sync metadata
source (Enum: local_device, backend)
source_timestamp (Timestamp) [timestamp from originating device/server]
```

---

### 5.7 Audit Log (Journal d'Audit)

```
id (UUID)
user_id (FK, nullable if system action)
action (String: create, read, update, delete)
resource (String: users, campaigns, collected_data, etc.)
resource_id (UUID)
old_value (JSONB)
new_value (JSONB)
status (Enum: success, failure)
ip_address (String)
timestamp (Timestamp)
```

---

### 5.8 Conflict Log (Journal de Conflits)

```
id (UUID)
data_id (FK → collected_data)
local_value (JSONB)
server_value (JSONB)
resolution_strategy (String: last_write_win, manual_review)
resolved_at (Timestamp, nullable if unresolved)
resolved_by (FK → User, nullable)
resolution_notes (Text)
```

---

## 6. RESSOURCES REQUISES

### 6.1 Infrastructure de Déploiement

#### Environnement Dev (k3d)
```
- 1 cluster k3d (local Docker-based Kubernetes)
  - CPU: 4+ cores recommended
  - RAM: 8GB+ recommended
  - Disk: 20GB+ free space
```

#### Services Kubernetes à déployer
```
- Namespace: e-sante-ism-spum

1. Web Server Pod
   - Image: nginx:latest (ou custom build)
   - Port: 80/443
   - Volumes: static assets

2. Frontend PWA Pod (serve via web server)
   - Managed by web server service

3. Backend API Pod
   - Image: custom FastAPI image
   - Port: 8000
   - Environment vars: DB_URL, JWT_SECRET, etc.
   - Resources: 512Mi RAM, 250m CPU recommended

4. PostgreSQL Pod
   - Image: postgres:15-alpine
   - Port: 5432
   - Volume: persistent data storage (10GB recommended)
   - Environment: POSTGRES_DB, POSTGRES_PASSWORD, etc.
```

### 6.2 Services & Infrastructure as Code

#### Manifests Kubernetes requis:
- `namespace.yaml` - Namespaces
- `postgres-pvc.yaml` - Persistent Volume Claim
- `postgres-configmap.yaml` - ConfigMap pour DB init
- `postgres-deployment.yaml` - StatefulSet ou Deployment
- `postgres-service.yaml` - Service ClusterIP
- `backend-configmap.yaml` - Backend env & config
- `backend-deployment.yaml` - Deployment
- `backend-service.yaml` - Service ClusterIP
- `web-deployment.yaml` - Deployment (nginx)
- `web-service.yaml` - Service NodePort (pour accès external)
- `ingress.yaml` (optional) - Ingress pour routing

#### Deployment Script:
```bash
deploy.sh
├─ Check k3d installation
├─ Create cluster if needed
├─ Create namespace
├─ Apply manifests in order
├─ Wait for readiness
├─ Report endpoints
└─ Initialize database
```

### 6.3 Ressources Logicielles (Build/Dev)

#### Frontend
```
- Node.js 18+
- npm ou pnpm
- Vite build tool
- TypeScript compiler
```

#### Backend
```
- Python 3.10+
- pip (package manager)
- FastAPI, Uvicorn
- SQLAlchemy, Pydantic
- psycopg2 (PostgreSQL driver)
```

#### Database
```
- PostgreSQL 15+
- psql CLI (for migrations)
```

#### DevOps/Deployment
```
- Docker Engine
- k3d (local Kubernetes)
- kubectl CLI
- bash shell (for scripts)
```

### 6.4 Volumes & Stockage

#### Persistent Storage
```
- PostgreSQL data volume: 10GB minimum
  Location: var/lib/postgresql/data
  
- Backend application logs: 1GB
  Location: /app/logs (optional, peut être stdout)
```

---

## 7. AMBIGUÏTÉS & POINTS DE DÉCISION

### 7.1 Ambiguïtés Identifiées

#### A1: Schéma des Données Collectées
**Problème:** La structure exacte des données collectées n'est pas définie. Le "formulaire" dépend de la campagne.

**Impact:** Backend et PWA doivent supporter un schéma dynamique.

**Options:**
1. **Option A (Recommandé pour POC):** Campagne contient `data_schema` (JSONB) décrivant les champs. PWA génère formulaire dynamiquement, backend valide contre schéma.
2. **Option B:** Code en dur un formulaire simple pour POC (moins flexible).
3. **Option C:** JSON Schema strict + validation stricte (plus complexe).

**Recommandation:** **Option A** = flexibilité + simplicité raisonnable.

---

#### A2: Mécanisme de Chiffrement des Données
**Problème:** "Les données sont chiffrées dans la base de données" → Quel algorithme, quel key management?

**Impact:** Sécurité, performance, complexité opérationnelle.

**Options:**
1. **Option A (Chiffrement au repos):** Chiffrement PostgreSQL natif (pgcrypto extension ou transparent encryption au filesystem).
2. **Option B (Application-level):** Backend chiffre sensible fields avant insert (plus flexible, portable).
3. **Option C (Both):** Application-level + DB encryption (max security, performance cost).

**Recommandation pour POC:** **Option B** = application-level encryption sur champs sensibles (email, PIN hash déjà hashés, mais data_payload de collecte peut être chiffré).

---

#### A3: Multi-Device Sync
**Problème:** Un intervenant peut-il collecter données sur plusieurs appareils pour même campagne?

**Impact:** Modèle de conflict resolution, schema des données.

**Options:**
1. **Option A:** Un intervenant = un device (simplifie POC).
2. **Option B:** Un intervenant peut avoir N devices, données mergées par user_id (plus robuste).

**Recommandation pour POC:** **Option A** = chaque intervenant = 1 device (peut être revisité post-POC).

---

#### A4: Gestion des PIN - Change au Premier Login
**Problème:** "PIN changé par l'utilisateur au premier login" → UI flow, validation, reset?

**Impact:** Flow authentification, UX.

**Options:**
1. **Option A:** Flag `must_change_pin` déclenchée page de change après login, redirection forcée.
2. **Option B:** Notification au prochain login, user peut ignorer (moins sécurisé).
3. **Option C:** Force change lors de 2ème login (compromis).

**Recommandation:** **Option A** = forcer change au premier login.

---

#### A5: Scénario si Intervenant Reste Offline Longtemps
**Problème:** Que se passe-t-il si intervenant collecte données pendant 1 mois en offline?

**Impact:** RxDB storage limits, sync time, network load.

**Options:**
1. **Option A:** RxDB illimité localement (peut fragmenter device storage).
2. **Option B:** Limiter cache local à N derniers jours/entrées, avertir user de sync.
3. **Option C:** Compression/archivage local automatique.

**Recommandation pour POC:** **Option B** = limiter à 1000 entrées ou 7 jours, avec warning UI.

---

#### A6: Permissions RBAC - Granularité
**Problème:** "Chaque rôle a le droit ou pas d'accéder à chaque vue" - Quels sont les permissions exactes?

**Impact:** Model RBAC, complexité backend.

**Options:**
1. **Option A (Simple):** Role-based (4 rôles, hard-coded access).
2. **Option B (Flexible):** Resource-Action permissions matrix (e.g., user:create, campaign:read).
3. **Option C (Advanced):** Attribute-based (ABAC) avec conditions.

**Recommandation pour POC:** **Option B** = Matrix RBAC (resource + action + allowed for role).

**Permissions minimales à définir:**
```
User Resource:
- user:create (admin_system only)
- user:read (all)
- user:update (admin_system + own user)
- user:delete (admin_system only)

Campaign Resource:
- campaign:create (admin_campaign only)
- campaign:read (admin_campaign, analyste)
- campaign:update (admin_campaign only)

Data Resource:
- data:create (intervenant_terrain only)
- data:read (admin_campaign, analyste - filtered by assignment)
- data:update (intervenant_terrain - own data if not synced)

Analytics Resource:
- analytics:read (analyste only)
```

---

#### A7: Logging & Audit - Verbosité
**Problème:** "Tout transport, accès, modification" → quelle granularité?

**Impact:** Log volume, storage, performance.

**Options:**
1. **Option A (Minimal):** Endpoint-level logging (user, action, resource, timestamp).
2. **Option B (Medium):** Field-level changes (before/after for all updates).
3. **Option C (Max):** Byte-level diffs + request/response payloads.

**Recommandation pour POC:** **Option B** = field-level changes pour audit trail.

---

#### A8: Absence de Service Central
**Problème:** "Serveur central" est mentionné mais pas défini. Pour POC, backend intermédiaire = central?

**Impact:** Architecture, sync logic, future upgrade path.

**Options:**
1. **Option A (POC simple):** Backend intermédiaire = serveur de données. Pas de serveur central distinct.
2. **Option B (Plus réaliste):** Backend = local intermédaire, mock d'un serveur central (pour testing).
3. **Option C (Future-proof):** Backend a endpoint `/sync-to-central` pour simulation sync vers serveur central.

**Recommandation pour POC:** **Option A** = backend = source of truth. Post-POC envisager Option C pour évolutivité.

---

### 7.2 Points de Décision (sans ambiguïté majeure)

| Point | Décision pour POC | Justification |
|-------|-------------------|--------------|
| **Biométrie** | Hors scope | Spécifié dans demande |
| **Auth token expiry** | 24h | Acceptable pour dev-only PIN |
| **Database backup** | Manual (kubectl dump) | Suffisant pour POC |
| **SSL/TLS** | Non (HTTP local k3d) | Dev environment |
| **Rate limiting** | Non (POC simple) | Peut être ajouté post-POC |
| **Versioning API** | v1 (simple) | POC unique version |
| **Pagination** | Max 100 records | POC small dataset |

---

## 8. RESSOURCES & LIVRABLES SYNTHÈSE

### 8.1 Livrables Logiciels

```
e-sante-ism-spum/
├── frontend/                           # React + Vite PWA
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
│
├── backend/                            # FastAPI Python
│   ├── app/
│   │   ├── main.py
│   │   ├── models/                    # SQLAlchemy models
│   │   ├── schemas/                   # Pydantic schemas
│   │   ├── routers/                   # Endpoint definitions
│   │   ├── services/                  # Business logic
│   │   ├── middleware/                # Auth, logging, etc.
│   │   └── database.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── database/                           # PostgreSQL init scripts
│   ├── init.sql                       # Schema + sample data
│   └── migrations/                    # Future migration scripts
│
├── k8s/                                # Kubernetes manifests
│   ├── namespace.yaml
│   ├── postgres/
│   │   ├── pvc.yaml
│   │   ├── configmap.yaml
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── backend/
│   │   ├── configmap.yaml
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── web/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── ingress.yaml (optional)
│
├── scripts/                            # Deployment automation
│   ├── deploy.sh                      # Main deployment script
│   ├── check-prereqs.sh
│   ├── init-db.sh
│   └── cleanup.sh
│
├── doc/
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── TESTING.md
│
└── README.md
```

### 8.2 Infrastructure Requirements

| Composant | Spécification | Justification |
|-----------|---------------|---------------|
| **k3d cluster** | 1 cluster, 1 server, 3 agents (default) | Suffisant pour 4 services |
| **PostgreSQL storage** | PVC 10GB | POC data + buffer |
| **Backend RAM** | 512Mi limit | FastAPI lightweight |
| **Frontend** | Served via nginx | PWA static serve |
| **Total compute** | 4 CPU cores, 8GB RAM | Recommended for dev machine |

### 8.3 Stack Technique Confirmé

| Layer | Technologie | Justification |
|-------|-------------|---------------|
| **Frontend** | React 18 + Vite + TypeScript | DX rapide, ecosystem mature |
| **Local DB** | RxDB | Offline-first, sync-native |
| **Backend API** | FastAPI + Uvicorn | Rapide à démarrer, OpenAPI auto |
| **Backend DB** | PostgreSQL 15 | Solide, JSONB support |
| **Auth** | JWT + RBAC | Simple, rapide à implement |
| **Orchestration** | k3d + Kubernetes | Conforme à demande, proche prod |
| **Sync** | REST pull periodic | Maximal simplicity |

---

## 9. RECOMMANDATIONS POUR DÉMARRAGE

### 9.1 Ordre Recommandé d'Implémentation

1. **Phase 1: Infrastructure & Setup**
   - Setup k3d cluster local
   - Deploy PostgreSQL
   - Valider connectivité

2. **Phase 2: Backend Foundation**
   - Scaffold FastAPI project
   - Implement auth endpoints (login, logout)
   - Implement user management (CRUD)
   - DB schema + migrations

3. **Phase 3: Backend Business Logic**
   - Campaign management endpoints
   - Geography (zones, villages) endpoints
   - RBAC middleware

4. **Phase 4: Sync Engine**
   - Sync endpoint implementation
   - Last-write-win logic
   - Conflict logging

5. **Phase 5: Frontend**
   - PWA scaffold (React + Vite)
   - RxDB integration
   - Login view
   - Dashboard view
   - Data collection form

6. **Phase 6: Admin Web**
   - User management UI
   - Campaign management UI
   - Analytics view

7. **Phase 7: Integration & Testing**
   - End-to-end testing du workflow complet
   - Performance testing
   - Documentation finale

### 9.2 Success Criteria pour POC

- [ ] Workflow complet fonctionnel (6 étapes)
- [ ] PWA collecte données en offline
- [ ] Sync correctement transmise au backend
- [ ] Analyste peut voir données consolidées
- [ ] Audit logging en place
- [ ] Deployment script fonctionnel
- [ ] Documentation (API, deployment, dev guide)

---

## 10. CONCLUSION

La demande IMP-001 est **clairement structurée et bien articulée**. Les ambiguïtés identifiées sont **solvables via les options proposées**. 

Le **stack technique est approprié** pour un POC rapide (React + FastAPI + PostgreSQL). L'architecture est **suffisamment modulaire** pour support post-POC évolution vers système central.

**Aucun blocker technique identifié.** Recommandé de procéder à l'implémentation en suivant les phases proposées.

---

**Fin d'Analyse - Date: 5 mai 2026**
