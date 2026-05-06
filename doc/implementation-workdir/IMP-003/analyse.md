# Analyse IMP-003 - Corrections du fonctionnement de la POC-1

Date: 6 mai 2026  
Auteur: Architecte senior

## 1. Contexte et objectif de la demande

Demande source: `doc/implementations/IMP-003-corrections-fonctionnement.md`

Objectif principal:
- corriger des dysfonctionnements UX/fonctionnels observés sur la POC-1
- améliorer la cohérence d’usage (navigation, collecte, supervision)
- compléter les capacités de gestion de campagne

## 2. Etat actuel du systeme (base de reference)

## 2.1 Comportement superuser / switch-user

Etat observé côté frontend (`DevToolsPanel`):
- le switch utilisateur est piloté par la liste de presets
- en cas d’erreur, le message affiche: "Bascule utilisateur refusee. Connectez-vous avec admin-system ou dev-superuser."
- la logique de toggle super-user mémorise un utilisateur précédent local (`dev_previous_user`)

Etat observé côté backend (`/api/admin/dev/switch-user`):
- endpoint accessible uniquement en mode dev
- endpoint autorisé pour `administrator_system` et `developer_superuser`
- un utilisateur non super/admin qui utilise ce panneau peut se heurter à un refus

Conclusion:
- le besoin IMP-003 "on doit toujours pouvoir basculer en mode dev peu importe l’utilisateur courant" n’est pas totalement garanti dans l’expérience actuelle, car le parcours dépend du rôle en session au moment de l’action.

## 2.2 Navigation globale

Etat observé:
- routes principales: dashboard, data-collection, sync-status, admin/users, admin/campaign, admin/analytics
- un bouton logout existe mais n’est pas unifié globalement dans un header unique par vue
- pas de bouton "retour accueil" explicite et standardisé sur toutes les pages

Conclusion:
- la navigation est fonctionnelle mais pas homogène selon la demande.

## 2.3 Gestion campagne

Etat observé côté backend:
- zones: create/list/update + create/list villages
- campagnes: create/list/update
- assignations: create/list

Etat observé côté frontend admin campagne:
- create zone
- create campagne
- create assignation
- affichage implicite dans selects, mais pas de tableaux CRUD complets
- pas d’édition/suppression explicites pour les 3 ressources

Conclusion:
- la demande CRUD complet (liste/creation/modification/suppression) pour zones/campagnes/assignations n’est pas couverte.

## 2.4 Collecte de données

Etat observé côté frontend collecte:
- saisie manuelle de `campaign_id`
- saisie manuelle de `health_area_id`
- champ "Donnees JSON"
- bouton "Sauvegarder localement"
- bouton "Synchroniser"

Etat observé sync:
- déclenchement manuel via bouton
- vue dédiée `/sync-status`

Conclusion:
- en écart avec la demande IMP-003 qui exige:
  - sélection sur campagne assignée
  - suppression de la saisie d’IDs techniques
  - saisie texte libre (encapsulation JSON interne)
  - sauvegarde automatique
  - synchronisation automatique (intervalle ou update + debounce)
  - suppression de la vue sync-status

## 2.5 Analytics vs supervision

Etat observé:
- vue unique `AdminAnalyticsPage` qui mélange:
  - résumé analytics
  - conflits de synchronisation
  - logs d’audit
- accès autorisé pour `administrator_system`, `analyste`, `developer_superuser`

Conclusion:
- la séparation demandée entre "analytics" et "supervision" n’est pas implémentée.
- la contrainte de visibilité supervision (admin-system + superuser) n’est pas appliquée comme vue distincte.

## 3. Système cible (vision d’ensemble)

IMP-003 introduit une réorganisation fonctionnelle de la POC sur 5 axes:

1. Axe Dev Session:
- continuité de switch-user en mode dev
- réduction des blocages de session lors de tests multi-rôles

2. Axe Navigation:
- shell d’application cohérent avec actions globales unifiées
- retour accueil et logout disponibles de façon constante

3. Axe Campaign Management:
- CRUD complet pour zones, campagnes, assignations
- écrans de liste + édition + suppression + feedback d’erreur détaillé

4. Axe Data Collection:
- collecte orientée assignation métier (pas d’IDs techniques)
- autosave local + autosync transparent
- disparition de la vue sync dédiée

5. Axe Monitoring:
- séparation claire analytics vs supervision
- contrôle d’accès distinct par rôle

## 4. Composants nécessaires et interactions

## 4.1 Composants frontend

A. App Shell global
- header/navigation global
- boutons `Accueil` et `Logout` positionnés de manière uniforme
- intégration de l’indicateur de session

B. Dev Session Controller
- service de switch robuste en mode dev
- stratégie de fallback pour rebasculer vers superuser quand requis
- gestion centralisée des erreurs de bascule

C. Admin Campaign Workspace
- 3 sous-modules CRUD:
  - zones
  - campagnes
  - assignations
- listes paginées/sortables (si besoin) + actions edit/delete

D. Data Collection Workspace
- liste des campagnes assignées à l’utilisateur
- contexte sélectionné (campagne + aire) injecté automatiquement dans les enregistrements
- champ texte libre utilisateur
- autosave local (on-change avec debounce)
- autosync (timer + trigger update)

E. Monitoring Workspace
- vue Analytics (analyste + admin-system + superuser selon décision)
- vue Supervision (admin-system + superuser uniquement)

## 4.2 Composants backend

A. API Campaigns/Zones/Assignments
- compléter endpoints manquants pour CRUD complet
  - delete zones
  - delete campagnes
  - update/delete assignations
  - endpoints de liste adaptés à l’UI (si besoin enrichissements)

B. API Assignments for Collection UX
- endpoint(s) pour récupérer les campagnes assignées de façon exploitable
- possibilité d’obtenir le "contexte actif" sans IDs saisis manuellement

C. Sync Automation Support
- endpoint existant `/sync` réutilisable
- potentiellement besoin de mécanisme idempotent renforcé pour sync auto fréquente

D. Supervision API
- séparation potentielle des routes/contrats supervision vs analytics

## 4.3 Interactions cibles

1. Utilisateur terrain ouvre collecte
- frontend charge assignations
- utilisateur choisit campagne assignée (ou auto-sélection)
- saisit du texte libre
- frontend sérialise en JSON interne + autosave local
- autosync se déclenche périodiquement et sur changement (debounce)

2. Gestionnaire campagne gère ressources
- opérations CRUD complètes sur zones/campagnes/assignations
- feedback immédiat des erreurs métier

3. Admin système supervise
- consulte supervision (conflits + audit)
- analyste consulte analytics séparément

## 5. Vues nécessaires

## 5.1 Vues utilisateur fonctionnelles

1. Shell global
- header fixe
- bouton Accueil
- bouton Logout
- indicateur session

2. Campagnes (admin campagne / superuser)
- onglet/listes Zones
- onglet/listes Campagnes
- onglet/listes Assignations
- create/edit/delete sur chaque ressource

3. Collecte (intervenant / superuser)
- section "Mes campagnes assignées"
- formulaire texte libre (pas de JSON visible)
- statut autosave/autosync

4. Analytics
- KPI et exploration des données collectées

5. Supervision
- conflits synchronisation
- journaux d’audit
- réservé admin-system + superuser

## 5.2 Vues techniques

1. Etats sync utilisateur
- surface compacte dans la collecte (au lieu d’une page dédiée)

2. Messages d’erreur contextualisés
- conflits métier, permissions, validations

## 6. Entités, champs et déclinaisons

## 6.1 Entités métier existantes impactées

A. Campaign
- champs actuels: id, name, description, status, created_by, timestamps
- besoins IMP-003:
  - edit/delete complet
  - relation claire avec assignations pour vue gestion

B. HealthArea
- besoins IMP-003:
  - CRUD complet (incluant suppression)

C. CampaignAssignment
- besoins IMP-003:
  - update/delete
  - meilleure visibilité listée (jointure user/campaign/zone pour UI)

D. CollectedData
- besoin d’encapsulation texte libre:
  - `data_payload` pourrait contenir `{ text: <saisie utilisateur>, ...meta }`

## 6.2 Entités techniques UI suggérées

A. ActiveCollectionContext
- campaign_id
- health_area_id
- assignment_id
- selected_at

B. AutoSyncState
- enabled
- last_attempt_at
- last_success_at
- pending_count
- error

C. DevSwitchState
- current_user
- target_user
- can_switch
- last_error

## 7. Ressources nécessaires

## 7.1 Ressources logicielles

- refonte partielle du frontend (navigation + collecte + monitoring)
- extension API backend CRUD gestion campagne
- tests E2E multi-rôles
- mise à jour scripts/scénarios manuels

## 7.2 Ressources qualité

- tests de permissions par rôle sur nouvelles vues
- tests de non-régression sync (auto + debounce)
- tests de robustesse en offline intermittente

## 7.3 Ressources opérationnelles

- documentation utilisateur dev/test à jour
- checklist de validation après chaque correction critique

## 8. Ambiguïtés et incohérences détectées

1. "Toujours basculer entre utilisateurs" en mode dev
- ambiguïté: faut-il autoriser tous les rôles à déclencher le switch, ou seulement certains rôles mais avec mécanisme de récupération automatique?

2. "Superuser" vs rôle métier
- ambiguïté: le superuser doit-il être un mode temporaire de session, un rôle persistant, ou les deux?

3. CRUD complet assignations
- ambiguïté: modèle d’édition attendu d’une assignation (changement user, zone, campagne, statut?)

4. Suppression vue synchronisation
- ambiguïté: souhaite-t-on supprimer seulement la route UI, ou aussi retirer des endpoints/statuts dédiés?

5. Autosync
- ambiguïté: fréquence exacte de synchronisation périodique non définie
- ambiguïté: stratégie de retry/backoff non spécifiée

6. "Séparer analytics de supervision"
- ambiguïté: limites exactes des données dans chaque vue (par exemple, les conflits vont-ils exclusivement en supervision?)

7. Données texte libre
- ambiguïté: faut-il conserver des métadonnées structurées minimales obligatoires dans payload (langue, horodatage client, source)?

## 9. Décisions à prendre (sans arbitrage imposé)

## D1 - Politique de switch-user dev

Alternative A:
- switch accessible à tout utilisateur en mode dev
- Avantage: fluidité test maximale
- Inconvénient: surface de risque plus large

Alternative B:
- switch réservé admin-system/superuser, avec "retour superuser" garanti depuis toutes sessions
- Avantage: meilleur contrôle
- Inconvénient: implémentation plus subtile

Alternative C:
- switch via token de service local dev (hors rôle utilisateur)
- Avantage: découplage rôle métier / outillage dev
- Inconvénient: complexité sécurité locale

## D2 - Modèle de superuser

Alternative A:
- rôle persistant `developer_superuser`

Alternative B:
- mode temporaire activé sur n’importe quel compte (claim de session)

Alternative C:
- mix A+B (rôle + élévation temporaire)

## D3 - CRUD assignations

Alternative A:
- assignation immutable (delete + recreate)

Alternative B:
- assignation éditable (update direct)

Alternative C:
- update partiel limité (statut seulement)

## D4 - Collecte autosave/autosync

Alternative A:
- autosave sur chaque frappe + debounce court

Alternative B:
- autosave sur blur/intervalle

Alternative C:
- hybride (saisie debounced + flush périodique)

## D5 - Séparation analytics/supervision

Alternative A:
- vue analytics = métriques + données collectées
- vue supervision = conflits + audit

Alternative B:
- analytics inclut une section supervision read-only

Alternative C:
- supervision route distincte + API distincte

## 10. Impacts et risques

Impacts positifs attendus:
- meilleure ergonomie quotidienne
- réduction des erreurs d’usage
- collecte plus proche du métier terrain
- supervision plus lisible

Risques:
- complexité croissante du frontend (shell + autosync + multi-vues)
- régressions RBAC lors de séparation analytics/supervision
- conflits de synchronisation plus fréquents avec autosync agressif

Mesures de mitigation:
- tests RBAC systématiques par route
- instrumentation du statut autosync
- feature flags progressifs pour autosync
- rollout incrémental par sous-module

## 11. Recommandations de vérification

1. Tests API
- permissions CRUD campagnes/zones/assignations par rôle
- switch-user en mode dev selon politique retenue

2. Tests frontend
- navigation globale cohérente
- logout/accueil disponibles partout
- bascule utilisateur sans blocage de session

3. Tests offline/sync
- autosave robustesse en perte réseau
- autosync + debounce sans doublons

4. Tests E2E métier
- admin campagne configure
- intervenant collecte sans IDs techniques
- analyste consulte analytics
- admin-system consulte supervision

## 12. Conclusion

IMP-003 est cohérent, pertinent et prioritaire pour stabiliser l’usage de la POC-1. La demande combine des corrections de fonctionnement, des améliorations UX majeures et un élargissement du périmètre CRUD de gestion campagne. Le succès dépendra d’un cadrage explicite des règles de switch-user/superuser, de la séparation analytics/supervision, et d’une implémentation progressive de l’autosync pour maîtriser les risques de régression.
