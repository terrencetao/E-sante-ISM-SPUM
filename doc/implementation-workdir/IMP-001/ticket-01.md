# TICKET IMP-001-01: Setup k3d Cluster Local

**Status:** 🔴 NOT STARTED  
**Assigné à:** DevOps  
**Phase:** 1 - Infrastructure  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 4h  
**Dépendances:** Aucune

---

## Objectif

Mettre en place un cluster Kubernetes local k3d pour supporter le déploiement des services du POC.

## Description Détaillée

### Tâches

1. **Vérification des Prérequis**
   - Docker Engine installé et running
   - k3d CLI installé (sinon installer)
   - kubectl CLI installé (sinon installer)
   - Bash disponible

2. **Création du Cluster k3d**
   - Créer cluster nommé `e-sante-ism-spum`
   - Configuration minimale: 1 server + 3 agents
   - Port mapping: 80, 443, 8000 (backend), 5432 (postgres)
   - Image: k3s:latest-amd64

3. **Configuration kubectl**
   - Context automatiquement configuré
   - Vérifier: `kubectl get nodes` → 4 nodes Ready

4. **Création Namespace**
   - Namespace: `e-sante-ism-spum`
   - Label: `project=e-sante-ism-spum`

5. **Documentation**
   - Notes: cluster endpoints, kubeconfig location
   - Troubleshooting pour k3d issues

### Commandes de Référence

```bash
# Installation k3d si absent
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Créer cluster
k3d cluster create e-sante-ism-spum \
  -s 1 -a 3 \
  -p "80:80@loadbalancer" \
  -p "443:443@loadbalancer" \
  -p "8000:8000@server:0" \
  -p "5432:5432@server:0"

# Vérifier
kubectl get nodes
kubectl get ns

# Créer namespace
kubectl create namespace e-sante-ism-spum
```

## Critères d'Acceptation

- [ ] k3d cluster `e-sante-ism-spum` crée
- [ ] `kubectl get nodes` retourne 4 nodes en état Ready
- [ ] Namespace `e-sante-ism-spum` créé
- [ ] kubectl context automatiquement sélectionné
- [ ] `kubectl cluster-info` affiche cluster info
- [ ] Documentation mise à jour

## Fichiers à Créer/Modifier

- `scripts/check-prereqs.sh` - Script de vérification prérequis
- `doc/DEPLOYMENT.md` - Section k3d setup
- `doc/.k3d-config` (optionnel) - Config k3d

## Notes

- Cluster peut être supprimé avec `k3d cluster delete e-sante-ism-spum`
- Pour Windows/Mac: Docker Desktop doit être running
- Linux: Docker daemon doit être accessible sans sudo

## Definition of Done (D.O.D.)

- [x] Cluster crée et fonctionnel
- [x] Tous les pods et services accessibles
- [x] Namespace prêt pour déploiement
- [x] Documentation complète

---

**Created:** 5 mai 2026  
**Last Updated:** -
