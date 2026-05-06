# Scenario 1 - test manuel bout en bout

Ce dossier contient un scenario manuel qui valide le workflow IMP-001 de bout en bout avec 4 roles:
- administrator_system
- administrator_campaign
- intervenant_terrain (x2)
- analyste

## 1. Objectif

Valider la sequence complete suivante:
1. creation des utilisateurs par l admin systeme
2. creation de zones/campagne/assignations par l admin campagne
3. collecte offline par 2 intervenants
4. synchronisation des donnees vers le backend
5. consultation analytics par l analyste

## 2. Pre-requis

Depuis la racine du repo, lancer:

```bash
./scripts/deploy.sh
```

Verifier rapidement:

```bash
curl http://127.0.0.1:8000/api/health
```

Reponse attendue: status ok.

## 3. Provisionner les utilisateurs du scenario 1

Executer:

```bash
bash tests/manual/scenario1/provision_users.sh
```

Le script:
- se connecte avec le compte seed admin systeme (`admin-system@local.dev` / `1234`)
- cree (ou reutilise) les 4 utilisateurs de test
- reset le PIN temporaire de chaque utilisateur
- affiche les identifiants a utiliser pour la suite

Utilisateurs provisionnes:
- campagne-manager.scenario1@local.dev (administrator_campaign)
- intervenant-1.scenario1@local.dev (intervenant_terrain)
- intervenant-2.scenario1@local.dev (intervenant_terrain)
- analyste.scenario1@local.dev (analyste)

Depannage si vous "ne voyez pas" les utilisateurs:
- La liste des utilisateurs est visible uniquement dans `/admin/users` avec le role `administrator_system`.
- Connectez-vous explicitement avec `admin-system@local.dev` (PIN `1234`) puis ouvrez `Admin systeme`.
- Si vous etiez deja connecte avec un autre role, deconnectez-vous puis reconnectez-vous avec l admin systeme.
- Verification API rapide (source de verite):

```bash
TOKEN_ADMIN=$(curl -sS -X POST http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin-system@local.dev","pin":"1234"}' | jq -r '.access_token')

curl -sS http://127.0.0.1:8000/api/users -H "Authorization: Bearer $TOKEN_ADMIN" | jq 'map({email, role_name, is_active})'
```

## 4. Configurer la campagne (admin campagne)

1. Ouvrir l application: http://127.0.0.1:5173
2. Se connecter avec `campagne-manager.scenario1@local.dev` + son `temp_pin`
3. Aller sur `Admin campagne`.
4. Creer 2 aires de sante (ex: `Aire Nord`, `Aire Sud`).
5. Creer 1 campagne (ex: `Campaign Scenario 1`).
6. Creer 2 assignations:
- intervenant-1 -> Aire Nord
- intervenant-2 -> Aire Sud

Notes:
- L ecran montre les selecteurs de campagne/zone/intervenant pour faire les assignations.
- Les IDs de campagne et de zone sont utilises ensuite par les intervenants dans la page de collecte.

## 5. (Optionnel) Creer des villages via API

La vue admin campagne actuelle ne cree pas les villages. Pour respecter strictement le scenario metier (2 villages par aire), vous pouvez les creer via API.

1. Recuperer un token admin campagne:

```bash
TOKEN_CAMPAIGN=$(curl -sS -X POST http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"campagne-manager.scenario1@local.dev","pin":"<TEMP_PIN>"}' | jq -r '.access_token')
```

2. Lister les zones et noter les 2 `id`:

```bash
curl -sS http://127.0.0.1:8000/api/zones -H "Authorization: Bearer $TOKEN_CAMPAIGN" | jq
```

3. Creer 2 villages pour chaque zone:

```bash
curl -sS -X POST http://127.0.0.1:8000/api/zones/<ZONE_ID_1>/villages \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN_CAMPAIGN" \
  -d '{"name":"Village 1A","description":"Scenario1"}'

curl -sS -X POST http://127.0.0.1:8000/api/zones/<ZONE_ID_1>/villages \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN_CAMPAIGN" \
  -d '{"name":"Village 1B","description":"Scenario1"}'

curl -sS -X POST http://127.0.0.1:8000/api/zones/<ZONE_ID_2>/villages \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN_CAMPAIGN" \
  -d '{"name":"Village 2A","description":"Scenario1"}'

curl -sS -X POST http://127.0.0.1:8000/api/zones/<ZONE_ID_2>/villages \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN_CAMPAIGN" \
  -d '{"name":"Village 2B","description":"Scenario1"}'
```

## 6. Collecte terrain offline (2 intervenants)

Pour chaque intervenant:
1. Se connecter a http://127.0.0.1:5173 avec son `temp_pin`.
2. Aller sur `Dashboard` et noter `campaign_id` + `health_area_id` de son assignation.
3. Aller sur `Collecte de donnees`.
4. Renseigner `campaign_id` et `health_area_id`, puis sauvegarder localement.
5. Simuler le mode offline (DevTools navigateur -> Network -> Offline) et enregistrer au moins 1 entree supplementaire.
6. Revenir online.

## 7. Synchroniser vers le backend

Pour chaque intervenant:
1. Aller sur `Statut de synchronisation`.
2. Cliquer `Synchroniser`.
3. Verifier que le nombre d elements en attente diminue.

## 8. Verifier analytics (analyste)

1. Se connecter avec `analyste.scenario1@local.dev` + son `temp_pin`.
2. Ouvrir `Analytics`.
3. Verifier:
- total_records > 0
- donnees visibles dans la table "Dernieres donnees collectees"
- repartition par campagne et par aire de sante visible

## 9. Verification API supplementaire (facultatif)

Avec un token analyste:

```bash
TOKEN_ANALYST=$(curl -sS -X POST http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"analyste.scenario1@local.dev","pin":"<TEMP_PIN>"}' | jq -r '.access_token')

curl -sS http://127.0.0.1:8000/api/analytics/summary -H "Authorization: Bearer $TOKEN_ANALYST" | jq
curl -sS http://127.0.0.1:8000/api/analytics/data -H "Authorization: Bearer $TOKEN_ANALYST" | jq '.[0:5]'
```

## 10. Nettoyage

Quand le test est termine:

```bash
./scripts/cleanup.sh
```
