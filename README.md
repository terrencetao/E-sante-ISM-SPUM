#  Offline Biometric Patient Enrollment & Digital Health Record System

##  Overview

This project is a **Progressive Web App (PWA)** designed to enable **offline biometric enrollment and patient identification**, along with the creation of a **digital health record** for continuous patient monitoring.

The system is particularly suited for **low-connectivity environments**, allowing healthcare workers to register and identify patients without requiring a permanent internet connection.

---

##  Objectives

* Provide a **unique biometric identity** for each patient
* Enable **offline patient enrollment**
* Maintain a **digital medical record (health carnet)**
* Ensure **data availability in low-resource settings**
* Support **synchronization with a central server** when connectivity is restored


##  Key Features

### 👤 Biometric Enrollment

* Face & fingerprint capture using device camera
* Facial and finger feature extraction (embeddings)
* Unique patient identification

### 📂 Digital Health Record

* Patient profile management
* Medical history tracking
* Visit and consultation logs

### 📡 Offline-First Architecture

* Fully functional without internet
* Local data storage 
* Background synchronization



## 🔄 Basic System Workflow

### Enrollment

1. Capture biometric infomation 
2. Extract biometric embedding
3. Store patient data locally
4. Assign unique identifier

### Identification

1. Capture biometric information
2. Extract embedding
3. Compare with local database
4. Retrieve patient record

---

## Quickstart (utilisation locale)

Ce Quickstart permet de lancer le systeme en local et de tester un flux complet:
- demarrage infrastructure (PostgreSQL)
- demarrage API backend
- demarrage PWA frontend
- connexion et collecte offline
- synchronisation vers le backend

### 1) Verifier les prerequis

```bash
./scripts/check-prereqs.sh
```

Si une commande est manquante, suivre le guide: `doc/PREREQUIS.md`.

### 2) Demarrer tous les systemes

```bash
./scripts/deploy.sh
```

Ou avec mode explicite:

```bash
./scripts/deploy.sh --env dev
```

Le script demarre automatiquement:
- le cluster k3d et PostgreSQL
- le port-forward PostgreSQL sur `localhost:5432`
- le backend FastAPI sur `http://127.0.0.1:8000`
- le frontend Vite sur `http://127.0.0.1:5173`

En mode `dev`, l application affiche un panneau `Dev Tools` permettant:
- switch utilisateur rapide
- activation/desactivation super utilisateur
- reset donnees frontend locales
- reset systeme complet (avec confirmation)

Compte seed cree automatiquement au demarrage backend:
- Email: admin-system@local.dev
- PIN: 1234

Verification rapide:

```bash
curl http://127.0.0.1:8000/api/health
```

Ouvrir l'application: http://127.0.0.1:5173

### 3) Utiliser le systeme (parcours minimal)

1. Se connecter avec le compte seed `admin-system@local.dev` / `1234`.
2. Aller sur `Admin systeme` (`/admin/users`) et creer:
	- 1 utilisateur `administrator_campaign`
	- 2 utilisateurs `intervenant_terrain`
	- 1 utilisateur `analyste`
3. Se connecter avec le compte `administrator_campaign` puis aller sur `Admin campagne` (`/admin/campaign`) pour:
	- creer 2 aires de sante
	- creer une campagne
	- assigner chaque intervenant a une aire
4. Se connecter avec un compte intervenant, consulter l'assignation sur `Dashboard`, puis aller sur `Collecte de donnees` et sauvegarder localement.
5. Couper/remettre le reseau pour observer le mode offline.
6. Aller sur `Statut de synchronisation` puis lancer `Synchroniser` pour envoyer les donnees vers `/api/sync`.
7. Se connecter avec un compte analyste (ou admin systeme) et verifier les resultats sur `Analytics` (`/admin/analytics`).

### 4) Arret et nettoyage

```bash
./scripts/cleanup.sh
```

Reset systeme en mode dev:

```bash
./scripts/reset_system.sh
```

Pour plus de details:
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
- API: `doc/API_SPEC.md`
- Deploiement: `doc/DEPLOYMENT.md`
