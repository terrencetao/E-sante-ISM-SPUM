# Deployment Guide (Phase 1)

## Scope
Ce guide couvre la phase 1:
- prerequis local
- creation cluster k3d
- deploiement PostgreSQL sur Kubernetes

## Prerequis
- Docker
- k3d
- kubectl

Guide d'installation detaille:
- voir `doc/PREREQUIS.md`

Verification rapide:

```bash
./scripts/check-prereqs.sh
```

## Deploiement

```bash
./scripts/deploy.sh
```

Ce script:
1. verifie les prerequis
2. cree le cluster k3d si absent
3. applique les manifests namespace + postgres
4. attend que postgres soit pret

## Validation

```bash
kubectl -n e-sante-ism-spum get pods
kubectl -n e-sante-ism-spum get svc
```

Acces local a PostgreSQL:

```bash
kubectl -n e-sante-ism-spum port-forward svc/postgres 5432:5432
```

Puis se connecter:

```bash
psql -h localhost -U postgres -d e_sante_ism_spum
```

## Nettoyage

```bash
./scripts/cleanup.sh
```
