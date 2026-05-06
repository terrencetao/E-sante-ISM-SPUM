# Architecture - POC IMP-001

## Vue Generale
Le POC est compose de:
- une PWA mobile offline-first
- une application web d'administration
- un backend API FastAPI
- une base PostgreSQL
- un deploiement local sur k3d

## Phase 1 Livree
Phase 1 installe le socle infrastructure:
- namespace Kubernetes: e-sante-ism-spum
- PostgreSQL en StatefulSet
- stockage persistant via volume claim template
- service ClusterIP pour acces inter-services

## Dossier Infrastructure
- k8s/namespace.yaml
- k8s/postgres/configmap.yaml
- k8s/postgres/statefulset.yaml
- k8s/postgres/service.yaml
- database/init.sql
- scripts/deploy.sh
