# TICKETS IMP-003 - Details

## IMP-003-01
Titre: Arbitrer switch-user dev et modele superuser  
Assigne: Lead + Back senior  
Priorite: Critique  
Estimation: 4h

Description:
- Choisir la politique finale de bascule utilisateur en mode dev
- Clarifier role persistant vs mode temporaire superuser
- Definir garde-fous et traces d audit minimales

Criteres d acceptation:
- Decision documentee et validee
- Regles d autorisation explicites par role

---

## IMP-003-02
Titre: Specifier frontiere analytics/supervision et RBAC  
Assigne: Lead + Front senior  
Priorite: Haute  
Estimation: 3h

Description:
- Delimiter les donnees de la vue analytics
- Delimiter les donnees de la vue supervision
- Valider matrice d acces par role

Criteres d acceptation:
- Contrat fonctionnel analytics/supervision publie
- Matrice RBAC approuvee

---

## IMP-003-03
Titre: Specifier autosave/autosync collecte  
Assigne: Lead + Front junior  
Priorite: Haute  
Estimation: 3h

Description:
- Definir debounce de saisie
- Definir cadence de sync periodique
- Definir strategie de retry/backoff

Criteres d acceptation:
- Parametres de sync documentes
- Comportement offline/online explicite

---

## IMP-003-04
Titre: Completer CRUD API aires de sante  
Assigne: Back senior  
Priorite: Haute  
Estimation: 4h

Description:
- Ajouter suppression d aire de sante
- Gerer verrous de suppression si references actives
- Retourner erreurs metier explicites

Criteres d acceptation:
- Delete operationnel avec protections
- Codes erreurs cohérents

---

## IMP-003-05
Titre: Completer CRUD API campagnes  
Assigne: Back senior  
Priorite: Haute  
Estimation: 4h

Description:
- Ajouter suppression campagne
- Preserver integrite sur assignations liees
- Maintenir validations nom/statut

Criteres d acceptation:
- CRUD campagne complet
- Non-regression creation/mise a jour

---

## IMP-003-06
Titre: Completer CRUD API assignations  
Assigne: Back senior  
Priorite: Critique  
Estimation: 6h

Description:
- Ajouter update assignation
- Ajouter delete assignation
- Enrichir listing pour exploitation UI

Criteres d acceptation:
- Assignation create/read/update/delete disponible
- Validation metier sur doublons et references

---

## IMP-003-07
Titre: Endpoint campagnes assignees pour collecte  
Assigne: Back junior  
Priorite: Haute  
Estimation: 4h

Description:
- Exposer API "mes assignations actives"
- Retourner contexte utile (campaign_id, health_area_id, assignment_id)
- Optimiser payload pour UI collecte

Criteres d acceptation:
- Endpoint securise et documente
- Reponse directement consommable par frontend

---

## IMP-003-08
Titre: Separer endpoints supervision des analytics  
Assigne: Back junior  
Priorite: Haute  
Estimation: 4h

Description:
- Distinguer route(s) supervision (audit + conflits)
- Preserver route(s) analytics metier
- Appliquer RBAC strict supervision

Criteres d acceptation:
- Contrats API distincts
- Supervision non accessible au role analyste

---

## IMP-003-09
Titre: Robustifier switch-user dev  
Assigne: Back senior  
Priorite: Critique  
Estimation: 5h

Description:
- Supprimer impasse de session en chaine de bascules
- Garantir retour superuser en mode dev
- Ajouter traces d audit sur switch

Criteres d acceptation:
- Bascules successives possibles en dev
- Message d erreur pertinent en cas de refus legitime

---

## IMP-003-10
Titre: App shell global Accueil/Logout  
Assigne: Front senior  
Priorite: Haute  
Estimation: 5h

Description:
- Introduire layout protege commun
- Positionner boutons Accueil/Logout de facon uniforme
- Integrer indicateur session existant

Criteres d acceptation:
- Header global present sur toutes vues protegees
- Navigation coherente desktop/mobile

---

## IMP-003-11
Titre: Retirer la vue sync-status  
Assigne: Front senior  
Priorite: Moyenne  
Estimation: 2h

Description:
- Supprimer route et menu sync dedie
- Adapter redirections anciennes routes
- Preserver acces aux fonctions sync en arriere-plan

Criteres d acceptation:
- Route sync-status inaccessible
- Aucun lien casse dans navigation

---

## IMP-003-12
Titre: CRUD complet Admin Campaign  
Assigne: Front senior  
Priorite: Critique  
Estimation: 8h

Description:
- Ajouter listes explicites zones/campagnes/assignations
- Ajouter formulaires create/edit
- Ajouter actions delete avec confirmations

Criteres d acceptation:
- Operations CRUD utilisables pour 3 ressources
- Erreurs backend affichees de facon explicite

---

## IMP-003-13
Titre: Edition et suppression assignations UX  
Assigne: Front junior  
Priorite: Haute  
Estimation: 4h

Description:
- Creer flux edition assignation
- Creer flux suppression avec confirmation forte
- Rafraichir etats locaux apres mutation

Criteres d acceptation:
- Aucun reload complet necessaire
- Feedback utilisateur clair apres action

---

## IMP-003-14
Titre: Creer page Supervision dediee  
Assigne: Front senior  
Priorite: Haute  
Estimation: 5h

Description:
- Construire vue conflits + audit
- Connecter nouvelles APIs supervision
- Ajouter protections route par role

Criteres d acceptation:
- Acces limite admin-system/developer_superuser
- Donnees supervision visibles et filtrees

---

## IMP-003-15
Titre: Simplifier page Analytics  
Assigne: Front junior  
Priorite: Moyenne  
Estimation: 3h

Description:
- Retirer blocs supervision de la page analytics
- Conserver KPI et vues metier analytics
- Ajuster navigation vers supervision

Criteres d acceptation:
- Separation visuelle et fonctionnelle effective
- Aucune donnee supervision restante dans analytics

---

## IMP-003-16
Titre: Collecte par campagne assignee  
Assigne: Front junior  
Priorite: Critique  
Estimation: 5h

Description:
- Charger assignations utilisateur
- Remplacer saisie IDs par selection guidee
- Injecter contexte campagne/aire automatiquement

Criteres d acceptation:
- Plus de champs IDs techniques visibles
- Donnees envoyees avec contexte correct

---

## IMP-003-17
Titre: Champ texte libre pour donnees collecte  
Assigne: Front junior  
Priorite: Haute  
Estimation: 4h

Description:
- Remplacer zone JSON par input texte libre
- Encapsuler la saisie en JSON interne
- Conserver metadonnees minimales

Criteres d acceptation:
- Toute saisie texte est acceptee
- Payload reste valide pour le backend

---

## IMP-003-18
Titre: Autosave local avec debounce  
Assigne: Front junior  
Priorite: Haute  
Estimation: 4h

Description:
- Sauvegarder automatiquement les brouillons locaux
- Ajouter debounce pour limiter ecritures
- Gérer restauration du brouillon au rechargement

Criteres d acceptation:
- Brouillon restaure apres refresh
- Pas de bouton manuel "Sauvegarder localement"

---

## IMP-003-19
Titre: Autosync automatique  
Assigne: Front senior  
Priorite: Critique  
Estimation: 6h

Description:
- Lancer sync apres modifications (debounce)
- Lancer sync periodique en arriere-plan
- Integrer gestion des erreurs et retries

Criteres d acceptation:
- Plus de bouton manuel "Synchroniser"
- Sync automatique observable et fiable

---

## IMP-003-20
Titre: Indicateur sync integre collecte  
Assigne: Front junior  
Priorite: Moyenne  
Estimation: 3h

Description:
- Afficher etat local/pending/sync/error
- Afficher date de dernier succes
- Ajouter action de relance contextuelle si erreur

Criteres d acceptation:
- Etat sync visible sans page dediee
- Diagnostic utilisateur suffisant

---

## IMP-003-21
Titre: Tests API CRUD, RBAC et supervision  
Assigne: Back junior + QA  
Priorite: Haute  
Estimation: 5h

Description:
- Couvrir CRUD des 3 ressources
- Couvrir restrictions supervision
- Couvrir robustesse switch-user dev

Criteres d acceptation:
- Suites de tests API vertes
- Cas de refus RBAC verifies

---

## IMP-003-22
Titre: Tests UI navigation/admin/collecte  
Assigne: Front junior + QA  
Priorite: Haute  
Estimation: 5h

Description:
- Verifier shell global et boutons unifies
- Verifier CRUD admin campagne en UI
- Verifier collecte autosave/autosync

Criteres d acceptation:
- Scenarios UI critiques couverts
- Aucun blocage majeur detecte

---

## IMP-003-23
Titre: E2E multi-role en mode dev  
Assigne: Lead + QA  
Priorite: Haute  
Estimation: 4h

Description:
- Rejouer parcours admin-system, manager, intervenant, analyste
- Verifier separation analytics/supervision
- Verifier collecte bout en bout avec sync auto

Criteres d acceptation:
- Scenario E2E complet reussi
- Rapport d ecarts documente

---

## IMP-003-24
Titre: Rapport final de readiness IMP-003  
Assigne: Lead + DevOps  
Priorite: Moyenne  
Estimation: 2h

Description:
- Produire synthese de livraison
- Capturer risques residuels et recommandations
- Lister checkpoints post-merge

Criteres d acceptation:
- Rapport archive dans workdir IMP-003
- Validation go/no-go explicite
