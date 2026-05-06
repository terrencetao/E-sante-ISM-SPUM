# PLAN DE TRAVAIL IMP-002 - Faciliter le developpement

Date: 5 mai 2026  
Auteur: Gestionnaire de projet senior

## 1. Evaluation de coherence

## 1.1 Synthese

La demande IMP-002 est coherente avec le besoin de reduire le temps de test et de validation multi-roles. Elle est realisable sans refonte majeure de l architecture actuelle.

Verdict global: COHERENT, IMPLEMENTABLE

## 1.2 Incoherences et risques de comprehension

1. Le terme "super utilisateur" n est pas defini fonctionnellement.
- Impact: eleve (securite + comportement RBAC)

2. "Reset de tout le systeme" n indique pas le perimetre exact.
- Impact: eleve (destruction potentielle de donnees non ciblees)

3. Le mode d activation d environnement (dev/staging/prod) n est pas specifie.
- Impact: moyen (UX ops/CI)

4. Le switch utilisateur ne precise pas s il faut un login complet ou une impersonation.
- Impact: eleve (audit/securite)

5. Le niveau d audit requis pour les actions dev n est pas explicite.
- Impact: moyen a eleve (tracabilite)

## 2. Informations manquantes a clarifier

| ID | Information manquante | Impact | Proposition pour execution |
|----|------------------------|--------|----------------------------|
| M1 | Format du flag env (`--env` vs variable) | Moyen | Supporter les 2, CLI prioritaire |
| M2 | Definition exacte super utilisateur | Eleve | Mode dev via role dedie `developer_superuser` |
| M3 | Mode de switch user | Eleve | Re-login standard avec comptes presets |
| M4 | Scope reset systeme | Eleve | Purge metier + reseed roles/admin seed |
| M5 | Qui peut utiliser les outils dev | Moyen | Reserve admin systeme en dev |
| M6 | Audit operations dev obligatoire? | Moyen | Oui, audit explicite sur switch/reset |

## 3. Decisions de cadrage proposees pour implementation

Ces decisions sont necessaires pour pouvoir executer sans blocage:

1. Environnement
- `./scripts/deploy.sh --env <dev|staging|prod>`
- `APP_ENV` supporte aussi, `--env` est prioritaire

2. Switch utilisateur
- Pas d impersonation backend pour cette iteration
- Switch par login API standard avec presets dev

3. Super utilisateur
- Ajout d un role `developer_superuser` actif uniquement en dev
- RBAC: toutes permissions quand role detecte

4. Reset
- Reset frontend: localStorage + IndexedDB/RxDB
- Reset systeme: purge tables metier + reset conflits/audit + reseed minimal (roles + admin seed)

5. Garde-fous
- Toutes features DX bloquees si APP_ENV != dev
- Endpoint(s) dev inaccessibles hors dev

## 4. Plan de travail par equipe

Equipe cible:
- 1 Lead Tech
- 1 DevOps
- 1 Backend senior
- 1 Backend junior
- 1 Frontend senior
- 1 Frontend junior

## 4.1 Decoupage en phases

Phase A - Cadrage et safety (0.5 semaine)
- modele env
- garde-fous
- specification reset

Phase B - Infrastructure DX (0.5 semaine)
- scripts deploy/reset
- propagation APP_ENV

Phase C - Backend DX (1 semaine)
- role super-user dev
- endpoints dev (si necessaires)
- audit des operations dev

Phase D - Frontend DX (1 semaine)
- indicateur utilisateur global
- panneau dev tools
- switch user + reset frontend

Phase E - Validation et documentation (0.5 semaine)
- tests API/UI
- e2e scenario1 en mode dev
- docs operationnelles

Duree estimee: 3.5 semaines

## 4.2 Allocation par membre

- Lead Tech: architecture safety, arbitrages, revue finale
- DevOps: deploy flag env, scripts reset, documentation ops
- Backend senior: RBAC super-user dev, endpoints dev, audit
- Backend junior: tests API dev guards, scripts DB reset
- Frontend senior: shell UI global, dev tools panel, role badge
- Frontend junior: switch user UX, reset local UX, tests UI

## 5. Critere de definition of done (DoD)

1. `deploy.sh` accepte et affiche le mode env.
2. Les outils dev ne sont visibles/fonctionnels qu en `dev`.
3. L utilisateur courant est visible en permanence sur l UI.
4. Le switch utilisateur fonctionne sans casser la navigation RBAC.
5. Le reset frontend vide effectivement les donnees locales.
6. Le reset systeme remet la plateforme dans un etat reseede reproductible.
7. Les operations dev sensibles sont auditees.
8. Les tests de non-regression passent.
9. La documentation d execution est a jour.

## 6. Risques et mitigations

1. Risque: fuite de fonctionnalites dev vers staging/prod.
- Mitigation: garde-fous runtime + tests de blocage.

2. Risque: destruction involontaire via reset global.
- Mitigation: confirmation forte + scope explicite + logs.

3. Risque: confusion super-user vs roles metier.
- Mitigation: role dedie, visibilite explicite dans UI.

4. Risque: dettes techniques de scripts shell.
- Mitigation: scripts idempotents + outputs standardises.

## 7. Livrables attendus

- scripts deploy/reset enrichis
- backend config/env + garde-fous
- role super-user dev + policy RBAC associee
- composant UI global indicateur utilisateur
- panneau dev tools (switch/reset)
- tests et rapport validation
- documentation mise a jour
