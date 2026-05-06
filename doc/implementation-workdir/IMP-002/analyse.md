# Analyse IMP-002 - Faciliter le developpement

Date: 5 mai 2026  
Auteur: Architecte senior

## 1. Portee de la demande

Demande source: `doc/implementations/IMP-002-faciliter-developpement.md`

Objectif principal:
- ameliorer l experience developpeur pour accelerer les cycles de test et de verification manuelle

Fonctionnalites demandees:
- ajout d un flag d environnement au deploiement (dev, staging, prod)
- en mode dev uniquement:
  - basculer entre differents utilisateurs
  - afficher visuellement l utilisateur courant en permanence
  - activer un mode super utilisateur (permissions totales)
  - reinitialiser les donnees:
    - donnees frontend PWA
    - ou toutes les donnees systeme

## 2. Etat actuel du systeme (base de reference)

### 2.1 Deploiement

Le script `scripts/deploy.sh`:
- deploie k3d + PostgreSQL
- demarre backend FastAPI et frontend Vite localement
- ne prend pas encore un parametre d environnement explicite `dev|staging|prod`

### 2.2 Authentification et autorisation

- Auth JWT via backend (`/api/auth/login`)
- RBAC actif cote backend (verification ressource/action)
- Cote frontend, role courant derive du token JWT (decodage local)

### 2.3 Frontend et vues

- routes protegees par role (`/admin/users`, `/admin/campaign`, `/admin/analytics`)
- aucun switch utilisateur integre dans l UI
- aucun indicateur global et persistant de l identite courante (hors contexte local des ecrans)

### 2.4 Donnees de test

- scripts manuels existent deja pour scenario1 (provisioning utilisateurs, e2e API, perf smoke, readiness)
- pas de commande unique pour reset frontend uniquement ou reset systeme complet

## 3. Solution cible (vue systeme)

La solution IMP-002 s ajoute au systeme existant sans changer son architecture principale. Elle ajoute un sous-systeme "Developer Experience" (DX) compose de:

1. Gouvernance d environnement
- extension du plan de deploiement avec mode explicite (`dev`, `staging`, `prod`)
- propagation de ce mode vers backend et frontend

2. Facades developpeur cote frontend
- panneau "Dev Tools" visible uniquement en environnement dev
- switch utilisateur rapide
- indicateur global utilisateur/role courant
- activation mode super utilisateur (scope dev)
- reset local PWA

3. Facilites backend pour flux dev
- endpoint(s) strictement controles pour impersonation/switch si retenu
- endpoint(s) de reset partiel/total si retenu
- garde-fous anti activation hors dev

4. Commandes operatoires
- scripts CLI pour reset frontend, reset backend, reset complet
- usage harmonise avec le script principal de deploiement

## 4. Composants necessaires et interactions

## 4.1 Composants

A. Script de deploiement enrichi
- composant: `scripts/deploy.sh` (et possiblement `scripts/cleanup.sh`)
- responsabilite: accepter le mode env et initialiser les services selon ce mode

B. Configuration backend
- composant: `backend/app/config.py` + `.env`
- responsabilite: exposer un parametre d execution (`app_env`) coherent avec le mode de deploiement

C. Configuration frontend
- composant: `.env` frontend + runtime Vite
- responsabilite: rendre disponible un flag environnement pour activer/desactiver UX dev

D. UI Developer Tools
- composant frontend (layout/header/panneau)
- responsabilite:
  - afficher utilisateur courant et role
  - proposer changement d utilisateur
  - proposer activation super user (si retenu)
  - proposer reset donnees locales

E. Service de switch utilisateur
- variante 1: switch purement client via login API standard et comptes preprovisionnes
- variante 2: endpoint backend dedie pour impersonation en dev

F. Service de reset
- reset frontend: suppression stores locaux (localStorage, IndexedDB/RxDB)
- reset systeme: purge des donnees backend + re-seed roles/comptes minimaux

## 4.2 Interactions (sequence logique)

1. `deploy.sh --env dev` (ou equivalent) configure et demarre la stack
2. frontend detecte mode dev et affiche les outils DX
3. developpeur choisit un utilisateur cible
4. le frontend obtient un token correspondant (login direct ou impersonation)
5. l UI met a jour l indicateur utilisateur courant en temps reel
6. developpeur declenche, si necessaire, reset local ou reset complet
7. scripts/backend confirment la reinitialisation avec rapport de statut

## 5. Vues a prevoir

## 5.1 Vues utilisateur

1. Badge global identite courante
- position: header global (visible sur toutes les pages protegees)
- contenu: email, role, mode actif (normal/super-user)

2. Panneau "Dev Tools" (mode dev uniquement)
- action: switch vers utilisateurs frequents
- action: toggler super utilisateur
- action: reset donnees frontend
- action: reset systeme complet (avec confirmation forte)

3. Ecran/section de confirmation operations destructives
- double confirmation pour reset systeme
- affichage des consequences et du scope

## 5.2 Vues techniques (ops/dev)

1. sortie console standardisee des scripts
- mode env selectionne
- operation executee
- resultat (OK/KO) + logs associes

## 6. Entites, champs et declinaisons

## 6.1 Entites fonctionnelles DX

A. DeploymentMode
- fields:
  - name: `dev|staging|prod`
  - source (cli/env file)
  - effective_at
- declinaisons:
  - mode strict (refus des features dev hors `dev`)
  - mode permissif (features masquees mais accessibles via secret)

B. DevSessionContext
- fields:
  - current_user_id
  - current_email
  - current_role
  - is_super_user
  - switched_from_user_id (optionnel)
  - switched_at
- declinaisons:
  - context local frontend uniquement
  - context signe par backend (plus robuste)

C. DevUserPreset
- fields:
  - email
  - label
  - role
  - enabled
- declinaisons:
  - preset statique (fichier)
  - preset dynamique (API users)

D. ResetOperation
- fields:
  - operation_id
  - scope (`frontend_local` | `system_full`)
  - triggered_by
  - triggered_at
  - status
  - details
- declinaisons:
  - reset sync (bloquant)
  - reset async (job)

E. SuperUserMode
- fields:
  - enabled
  - activation_source
  - expires_at (optionnel)
  - reason
- declinaisons:
  - super-user frontend only (bypass UI)
  - super-user backend effective (bypass RBAC)

## 6.2 Entites techniques potentiellement impactees

- User (existante)
- Role (existante)
- AuditLog (existante)
- ConflictLog (existante)
- CollectedData (existante)

Nouvelles tables possibles (si persistance requise):
- dev_operations_log
- dev_impersonation_log
- reset_jobs

## 7. Ressources necessaires

## 7.1 Ressources logicielles

- scripts shell supplementaires (deploy env, reset local/full)
- adaptation backend config + endpoints conditionnels dev
- composant UI global pour badge utilisateur et tools panel
- tests automatises (API + frontend) pour garde-fous env

## 7.2 Ressources infrastructure

- aucun nouveau service obligatoire
- eventuellement volumes/backup snapshot en staging/prod pour reset securise

## 7.3 Ressources qualite

- checklist securite pour s assurer que les features dev sont inactives hors dev
- suite de tests de non-regression RBAC
- documentation operatoire developpeur

## 8. Ambiguites et incoherences detectees

1. Forme du flag d environnement non specifiee
- ambiguite: `--env`, variable shell, fichier `.env`, ou combinaison
- impact: moyen (UX script, CI/CD, reproductibilite)

2. Definition de "super utilisateur" non precisee
- ambiguite: bypass UI uniquement ou bypass backend RBAC reel
- impact: eleve (securite et coherences de tests)

3. Mecanisme de switch utilisateur non precise
- ambiguite: login classique avec PIN, impersonation backend, ou token pre-signe
- impact: eleve (securite, effort implementation, audit)

4. Portee du "reset de tout le systeme" non definie
- ambiguite: uniquement tables metier, ou purge totale DB + caches + logs
- impact: eleve (destruction de donnees, operations)

5. Contraintes d acces aux outils dev non explicites
- ambiguite: visible pour tous en dev ou reserve au role admin systeme
- impact: moyen (risque erreur humaine)

6. Preservation des donnees de reference non definie
- ambiguite: apres reset global, faut-il reseeder roles, admin seed, campagnes exemples
- impact: moyen

7. Trafic audit pour operations dev non explicite
- ambiguite: faut-il auditer switch user, super-user mode, reset operations
- impact: moyen a eleve (conformite)

## 9. Decisions a prendre (avec alternatives)

## D1. Injection du mode environnement

Alternative C:
- combinaison A + B (CLI prioritaire)
- avantage: flexible et robuste CI/CD
- inconvenient: complexite legere de precedence

## D2. Switch utilisateur


Alternative B:
- endpoint dev d impersonation (admin -> user cible)
- avantage: rapide en test
- inconvenient: risque securite eleve si fuite hors dev


## D3. Super utilisateur

Alternative C:
- role temporaire dedie `developer_superuser` seed en dev
- avantage: explicite et tracable
- inconvenient: extension matrice RBAC

## D4. Reset frontend


- bouton UI effacant localStorage + IndexedDB/RxDB
- avantage: instantane pour dev
- inconvenient: risque mauvais clic

et

- script CLI dedie
- avantage: reproductible dans docs/tests
- inconvenient: moins pratique depuis l UI



## D5. Reset systeme complet

Alternative A:
- endpoint backend dev `POST /admin/dev/reset-system`
- avantage: declenchable depuis UI
- inconvenient: endpoint destructif sensible


## D6. Garde-fous securite

- autoriser uniquement sur host local + env dev
- avantage: limite surface risque
- inconvenient: peut bloquer certains workflows reseau d equipe

## 10. Impacts et risques

Impacts positifs attendus:
- acceleration importante des tests manuels
- reduction du temps de mise en contexte multi-role
- meilleure reproductibilite des scenarios de validation

Risques majeurs:
- contamination de comportements dev en staging/prod
- weakening du modele RBAC si super-user mal borne
- reset systeme execute par erreur sans confirmation adequate

Mesures de mitigation a prevoir:
- garde-fous env stricts
- confirmations destructives multi-etapes
- audit explicite des operations developpeur
- tests automatiques de non-disponibilite des features dev hors dev

## 11. Strategie de verification recommandee

1. Tests unitaires
- parsing mode env
- logique de garde-fous feature-dev

2. Tests API
- refus des endpoints dev hors env dev
- validation des permissions sur switch/reset

3. Tests frontend
- affichage conditionnel du panneau dev
- affichage utilisateur courant persistant
- scenario switch user -> navigation role-based

4. Tests e2e
- baseline scenario1 avant et apres reset frontend
- scenario reset systeme puis reprovisionnement et rerun complet

## 12. Conclusion

La demande IMP-002 est coherente avec l etat actuel du projet et cible un gain DX reel. Les modifications touchent principalement la couche outillage (scripts), la configuration d environnement, et l experience frontend developpeur. Les points critiques portent sur la securite des mecanismes de switch/super-user/reset, qui necessitent des decisions explicites avant implementation.

Le perimetre est faisable de maniere incrementalement sure, a condition de verrouiller les garde-fous environnementaux et de tracer les operations developpeur sensibles.
