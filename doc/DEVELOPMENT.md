# Development Setup

## Initialisation locale

1. Verifier pre-requis:

```bash
./scripts/check-prereqs.sh
```

2. Deployer la phase 1:

```bash
./scripts/deploy.sh
```

3. Verifier l'etat:

```bash
kubectl -n e-sante-ism-spum get all
```

## Workflow Dev
- Utiliser le namespace e-sante-ism-spum
- Ajouter les futurs manifests dans k8s/
- Garder les scripts idempotents
