# TICKETS IMP-002 - Details

## IMP-002-01
Titre: Gouvernance d environnement et precedences  
Assigne: Lead + DevOps  
Priorite: Critique  
Estimation: 4h

Description:
- Definir la source de verite du mode env
- Definir precedence CLI vs variables
- Definir comportement par defaut

Criteres d acceptation:
- Regles de precedence documentees
- Cas invalides definis

---

## IMP-002-02
Titre: Specification super utilisateur dev  
Assigne: Lead + Back senior  
Priorite: Critique  
Estimation: 3h

Description:
- Definir semantique exacte du role
- Definir limites hors dev
- Definir exigences d audit

Criteres d acceptation:
- Role et permissions formalises
- Contraintes de securite explicites

---

## IMP-002-03
Titre: Specification reset frontend/systeme  
Assigne: Lead + DevOps  
Priorite: Critique  
Estimation: 3h

Description:
- Definir scope du reset local
- Definir scope du reset complet
- Definir confirmations et protections

Criteres d acceptation:
- Table scope par type de reset
- Procedure rollback documentee

---

## IMP-002-04
Titre: Ajouter --env a deploy.sh  
Assigne: DevOps  
Priorite: Haute  
Estimation: 4h

Description:
- Ajouter parsing `--env`
- Propager APP_ENV au backend/frontend
- Afficher mode effectif en sortie script

Criteres d acceptation:
- `deploy.sh --env dev` fonctionne
- `deploy.sh --env staging` fonctionne
- `deploy.sh --env prod` fonctionne

---

## IMP-002-05
Titre: Scripts reset frontend/systeme  
Assigne: DevOps + Back junior  
Priorite: Haute  
Estimation: 6h

Description:
- Ajouter script reset frontend local
- Ajouter script reset systeme complet
- Garantir idempotence et traces

Criteres d acceptation:
- Reset local efface localStorage/IndexedDB
- Reset systeme purge/reseed avec sortie claire

---

## IMP-002-06
Titre: Documentation multi-environnements  
Assigne: DevOps  
Priorite: Moyenne  
Estimation: 2h

Description:
- Mettre a jour README et doc de deploiement
- Ajouter exemples d usage par environnement

Criteres d acceptation:
- Instructions dev/staging/prod disponibles

---

## IMP-002-07
Titre: Role developer_superuser  
Assigne: Back senior  
Priorite: Critique  
Estimation: 4h

Description:
- Ajouter role dedie
- Integrer seed conditionnel en mode dev

Criteres d acceptation:
- Role present en dev
- Role absent/inactif hors dev

---

## IMP-002-08
Titre: RBAC superuser dev  
Assigne: Back senior  
Priorite: Critique  
Estimation: 5h

Description:
- Adapter middleware RBAC
- Bypass controle uniquement en mode dev + role dedie

Criteres d acceptation:
- Permissions globales actives uniquement en dev
- Blocage strict en staging/prod

---

## IMP-002-09
Titre: Endpoint dev reset systeme  
Assigne: Back junior  
Priorite: Haute  
Estimation: 4h

Description:
- Ajouter endpoint reset systeme (option retenue)
- Ajouter confirmations applicatives et logs

Criteres d acceptation:
- Endpoint refuse hors dev
- Reset reseed etat minimal attendu

---

## IMP-002-10
Titre: Audit operations developpeur  
Assigne: Back senior  
Priorite: Haute  
Estimation: 3h

Description:
- Journaliser switch user, superuser on/off, reset
- Exposer ces traces pour inspection admin

Criteres d acceptation:
- Traces visibles et exploitables

---

## IMP-002-11
Titre: Badge global utilisateur courant  
Assigne: Front senior  
Priorite: Haute  
Estimation: 3h

Description:
- Ajouter composant global persistant
- Afficher email, role, mode superuser

Criteres d acceptation:
- Badge visible sur toutes routes protegees

---

## IMP-002-12
Titre: Panneau Dev Tools  
Assigne: Front senior  
Priorite: Haute  
Estimation: 5h

Description:
- Panneau visible seulement en APP_ENV=dev
- Actions switch/reset/superuser selon droits

Criteres d acceptation:
- Panneau absent hors dev
- Actions fonctionnelles en dev

---

## IMP-002-13
Titre: Switch utilisateur rapide  
Assigne: Front junior  
Priorite: Haute  
Estimation: 4h

Description:
- Presets utilisateurs scenario de dev
- Relogin API standard
- Rafraichissement navigation role-based

Criteres d acceptation:
- Switch entre 4 roles sans erreur

---

## IMP-002-14
Titre: Reset local frontend depuis UI  
Assigne: Front junior  
Priorite: Haute  
Estimation: 3h

Description:
- Effacement localStorage + IndexedDB/RxDB
- Confirmation utilisateur

Criteres d acceptation:
- Donnees locales effectivement supprimees

---

## IMP-002-15
Titre: Tests API des garde-fous env  
Assigne: Back junior  
Priorite: Haute  
Estimation: 3h

Description:
- Tester refus des routes dev hors mode dev
- Tester role superuser dev

Criteres d acceptation:
- Tests verts

---

## IMP-002-16
Titre: Tests UI des outils dev  
Assigne: Front junior  
Priorite: Moyenne  
Estimation: 3h

Description:
- Tester presence/absence panneau selon env
- Tester badge et switch

Criteres d acceptation:
- Tests verts

---

## IMP-002-17
Titre: Validation E2E scenario1 avec DX tools  
Assigne: Lead + Front senior  
Priorite: Haute  
Estimation: 4h

Description:
- Rejouer scenario1 complet
- Utiliser switch utilisateur et reset local

Criteres d acceptation:
- Workflow valide de bout en bout

---

## IMP-002-18
Titre: Rapport final et readiness  
Assigne: Lead + DevOps  
Priorite: Moyenne  
Estimation: 2h

Description:
- Produire rapport de cloture
- Capturer limitations et recommandations

Criteres d acceptation:
- Rapport archive dans workdir IMP-002
