# TICKETS IMP-002 - Index

Date: 5 mai 2026

## Phase A - Cadrage et safety

- IMP-002-01: Specifier gouvernance d environnement et precedences (Lead, DevOps)
- IMP-002-02: Specifier super utilisateur dev et limites de securite (Lead, Back senior)
- IMP-002-03: Specifier scope reset frontend/systeme et confirmations (Lead, DevOps)

## Phase B - Infrastructure DX

- IMP-002-04: Etendre scripts/deploy.sh avec flag --env et propagation APP_ENV (DevOps)
- IMP-002-05: Ajouter scripts de reset (frontend local, systeme complet) (DevOps + Back junior)
- IMP-002-06: Mettre a jour docs de lancement multi-env (DevOps)

## Phase C - Backend DX

- IMP-002-07: Ajouter role developer_superuser limite au mode dev (Back senior)
- IMP-002-08: Adapter RBAC pour bypass controle en role dev superuser (Back senior)
- IMP-002-09: Exposer endpoint(s) dev reset systeme avec garde-fous (Back junior)
- IMP-002-10: Auditer les operations dev sensibles (switch/reset/superuser) (Back senior)

## Phase D - Frontend DX

- IMP-002-11: Ajouter badge global utilisateur courant (Front senior)
- IMP-002-12: Ajouter panneau Dev Tools visible seulement en mode dev (Front senior)
- IMP-002-13: Implementer switch utilisateur rapide via login standard (Front junior)
- IMP-002-14: Implementer reset local frontend depuis UI (Front junior)

## Phase E - Validation et cloture

- IMP-002-15: Ajouter tests API pour garde-fous env et superuser (Back junior)
- IMP-002-16: Ajouter tests UI pour badge/switch/dev panel (Front junior)
- IMP-002-17: Executer E2E scenario1 en mode dev avec nouveaux outils (Lead + Front senior)
- IMP-002-18: Rapport final et readiness de livraison (Lead + DevOps)

Total tickets: 18
Estimation globale: 52h a 64h
