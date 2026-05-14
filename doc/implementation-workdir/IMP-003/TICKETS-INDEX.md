# TICKETS IMP-003 - Index

Date: 6 mai 2026

## Phase A - Cadrage et arbitrages

- IMP-003-01: Arbitrer politique switch-user dev et modele superuser (Lead + Back senior)
- IMP-003-02: Specifier frontiere analytics vs supervision et matrice RBAC (Lead + Front senior)
- IMP-003-03: Specifier strategie autosync/autosave (cadence, debounce, backoff) (Lead + Front junior)

## Phase B - Backend metier et securite

- IMP-003-04: Completer CRUD API des aires de sante (delete + validations) (Back senior)
- IMP-003-05: Completer CRUD API des campagnes (delete + contraintes metier) (Back senior)
- IMP-003-06: Completer CRUD API des assignations (list/create/update/delete) (Back senior)
- IMP-003-07: Exposer endpoint de campagnes assignees pour la collecte (Back junior)
- IMP-003-08: Separer endpoints supervision (conflits/audit) des analytics (Back junior)
- IMP-003-09: Renforcer robustesse switch-user dev (retour superuser garanti) (Back senior)

## Phase C - Frontend navigation et administration

- IMP-003-10: Implementer app shell global avec Accueil/Logout unifies (Front senior)
- IMP-003-11: Supprimer route/page sync-status et rediriger navigation (Front senior)
- IMP-003-12: Refondre Admin Campaign en CRUD complet zones/campagnes/assignations (Front senior)
- IMP-003-13: Ajouter edition/suppression assignations avec confirmations UX (Front junior)
- IMP-003-14: Creer page Supervision dediee (conflits + audit) (Front senior)
- IMP-003-15: Simplifier page Analytics (retirer elements supervision) (Front junior)

## Phase D - Frontend collecte offline-first

- IMP-003-16: Remplacer saisie IDs par selection campagne assignee (Front junior)
- IMP-003-17: Remplacer JSON libre par champ texte libre avec encapsulation interne (Front junior)
- IMP-003-18: Implementer autosave local avec debounce (Front junior)
- IMP-003-19: Implementer autosync automatique intervalle + trigger update (Front senior)
- IMP-003-20: Ajouter indicateur etat sync integre a la page collecte (Front junior)

## Phase E - Validation et cloture

- IMP-003-21: Ajouter tests API CRUD/RBAC/supervision (Back junior + QA)
- IMP-003-22: Ajouter tests UI navigation/admin/collecte autosync (Front junior + QA)
- IMP-003-23: Executer scenario E2E multi-role complet en mode dev (Lead + QA)
- IMP-003-24: Produire rapport final de readiness IMP-003 (Lead + DevOps)

Total tickets: 24
Estimation globale: 78h a 96h
