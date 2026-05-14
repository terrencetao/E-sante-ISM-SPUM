# PLAN DE TRAVAIL IMP-003 - Corrections du fonctionnement

Date: 6 mai 2026  
Auteur: Gestionnaire de projet senior

## 1. Evaluation de coherence

## 1.1 Synthese

La demande IMP-003 est globalement coherente avec les irritants constates en usage reel. Elle cible des ecarts concrets sur le switch-user dev, la navigation, la collecte, la gestion campagne et la supervision.

Verdict global: COHERENT, IMPLEMENTABLE AVEC ARBITRAGES

## 1.2 Incoherences et risques de comprehension

1. "En mode dev, on peut toujours basculer entre utilisateurs" est ambigu sur le mecanisme de securite.
- Impact: eleve (securite + audit)

2. Le terme "superuser" est utilise comme role et comme capacite de session.
- Impact: eleve (RBAC + UX)

3. "Supprimer la vue synchronisation" ne precise pas si l API de sync reste exposee telle quelle.
- Impact: moyen (architecture + dette technique)

4. CRUD complet des assignations non detaille sur les champs modifiables.
- Impact: eleve (modele metier + integrite)

5. Autosync demande sans parametres (frequence, backoff, limites offline).
- Impact: eleve (stabilite + perf)

6. Separation analytics/supervision non precisee sur le perimetre exact de donnees.
- Impact: moyen a eleve (RBAC + UX)

## 2. Informations manquantes a clarifier

| ID | Information manquante | Impact | Proposition pour execution |
|----|------------------------|--------|----------------------------|
| M1 | Politique de switch-user en dev | Eleve | Option B de l analyse: switch reserve admin/superuser avec retour superuser garanti |
| M2 | Nature du superuser (role vs mode) | Eleve | Conserver role `developer_superuser` persistant pour cette iteration |
| M3 | Champs editables d une assignation | Eleve | Autoriser update `user_id`, `campaign_id`, `health_area_id`, `is_active` |
| M4 | Strategie autosync | Eleve | Debounce 2s apres saisie + tick periodique 30s + backoff expo en erreur |
| M5 | Scope suppression vue sync | Moyen | Supprimer route/page UI, conserver endpoint `/sync` |
| M6 | Frontiere analytics vs supervision | Moyen | Analytics: KPI/volume. Supervision: conflits + audit (admin-system/superuser) |
| M7 | Format interne donnees libres | Moyen | Encapsulation JSON `{ text, meta }` avec meta minimale horodatage/client |

## 3. Decisions de cadrage proposees pour implementation

Ces decisions sont necessaires pour executer sans blocage:

1. Switch-user dev
- Conserver endpoint backend protege
- Ajouter mecanisme de "retour superuser" robuste depuis toute session dev
- Clarifier messages erreurs et etats de session

2. Navigation globale
- Introduire un shell commun sur routes protegees
- Actions globales fixes: `Accueil` et `Logout` au meme emplacement

3. CRUD campagne complet
- Backend: completer update/delete manquants (zones, campagnes, assignations)
- Frontend: listes + formulaires create/edit/delete pour les 3 ressources

4. Collecte simplifiee
- Remplacer saisie IDs par selection d assignation/campagne
- Remplacer champ JSON par champ texte libre
- Autosave local automatique
- Autosync automatique (debounce + intervalle)
- Retirer route `/sync-status`

5. Monitoring separe
- Route `admin/analytics` dediee aux metriques
- Nouvelle route `admin/supervision` pour conflits + audit
- RBAC supervision limite admin-system + developer_superuser

## 4. Plan de travail par equipe

Equipe cible:
- 1 Lead Tech
- 1 DevOps
- 1 Backend senior
- 1 Backend junior
- 1 Frontend senior
- 1 Frontend junior
- 1 QA engineer

## 4.1 Decoupage en phases

Phase A - Cadrage fonctionnel et securite (0.5 semaine)
- arbitrages M1..M7
- contrat UX shell/navigation
- definition supervision vs analytics

Phase B - Backend metier et RBAC (1 semaine)
- completion CRUD backend
- endpoints pour collecte assignee
- separation supervision/analytics

Phase C - Frontend UX structurelle (1 semaine)
- shell global navigation
- refonte page campagne en CRUD complet
- nouvelle page supervision

Phase D - Frontend collecte offline-first (1 semaine)
- collecte par assignation
- texte libre + encapsulation JSON interne
- autosave/autosync
- suppression vue sync

Phase E - Validation et documentation (0.5 semaine)
- tests API/UI/E2E
- update docs usage
- rapport de cloture

Duree estimee: 4 semaines

## 4.2 Allocation par membre

- Lead Tech: arbitrages M1..M7, validation architecture, revue finale
- DevOps: support env dev, scripts de validation, docs operationnelles
- Backend senior: CRUD manquant + RBAC supervision + contrats API
- Backend junior: endpoints assignations collecte + tests API
- Frontend senior: app shell global + separation analytics/supervision
- Frontend junior: collecte texte libre + autosave/autosync + retrait sync page
- QA engineer: matrice de tests multi-roles + non-regression offline/sync

## 5. Definition of done (DoD)

1. En mode dev, la bascule utilisateur reste possible sans impasse de session.
2. Le bouton `Accueil` et le bouton `Logout` sont presents sur toutes les vues protegees au meme endroit.
3. La vue synchronisation dediee n est plus accessible.
4. Les 3 ressources (aires de sante, campagnes, assignations) ont un CRUD complet backend + frontend.
5. La collecte n expose plus la saisie d IDs techniques.
6. Le champ collecte accepte du texte libre, encapsule en JSON interne.
7. L autosave local fonctionne automatiquement.
8. L autosync fonctionne en mode automatique avec debounce + intervalle.
9. Analytics et supervision sont separes en 2 vues distinctes.
10. La supervision est visible uniquement par admin-system et developer_superuser.
11. Les tests de non-regression (RBAC, offline, sync) passent.
12. La documentation utilisateur/dev est mise a jour.

## 6. Risques et mitigations

1. Risque: regression de securite sur switch-user dev.
- Mitigation: garde-fous serveur stricts + tests de role + audit.

2. Risque: surcharge reseau due a autosync.
- Mitigation: debounce, cadence intervalle, backoff progressif.

3. Risque: incoherence de donnees avec edition/suppression assignations.
- Mitigation: contraintes SQL + validations applicatives + messages metier.

4. Risque: confusion utilisateur lors du retrait de la page sync.
- Mitigation: indicateur de statut sync integre dans la page collecte.

5. Risque: separation analytics/supervision incomplete.
- Mitigation: contrats API explicites + matrice RBAC de routes.

## 7. Livrables attendus

- backend: endpoints CRUD complets campagnes/zones/assignations
- backend: endpoints support collecte assignee et supervision dediee
- frontend: app shell global uniforme
- frontend: module campagne en CRUD complet
- frontend: collecte texte libre + autosave/autosync
- frontend: suppression route/page sync-status
- frontend: page supervision dediee
- tests API/UI/E2E et rapport de verification
- documentation mise a jour (fonctionnelle et technique)
