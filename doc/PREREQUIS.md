# Prerequis et installation

## Objectif
Ce document explique les prerequis necessaires au projet et comment les installer s'ils sont manquants.

## Outils obligatoires
- Docker (CLI + daemon)
- kubectl
- k3d

## Outil recommande
- psql (client PostgreSQL) pour les tests manuels de connexion

## Verification rapide
Depuis la racine du projet:

```bash
./scripts/check-prereqs.sh
```

Verification complementaire recommande:

```bash
command -v psql || echo "psql absent (optionnel mais recommande)"
```

## Installation sur Linux (Ubuntu/Debian)

### 1. Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Apres cette commande, ouvrir une nouvelle session shell puis verifier:

```bash
docker info
```

### 2. kubectl

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl
```

Verification:

```bash
kubectl version --client
```

### 3. k3d

```bash
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
```

Verification:

```bash
k3d version
```

### 4. psql (recommande)

```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```

Verification:

```bash
psql --version
```

## Installation sur Fedora

### Docker

```bash
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

### kubectl

```bash
sudo dnf install -y kubernetes-client
```

### k3d

```bash
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
```

### psql (recommande)

```bash
sudo dnf install -y postgresql
```

## Installation sur Arch Linux

```bash
sudo pacman -Syu --noconfirm docker kubectl k3d postgresql-libs
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

## En cas d'outil manquant

Si `./scripts/check-prereqs.sh` echoue:
1. Installer la commande manquante avec les sections ci-dessus.
2. Ouvrir une nouvelle session shell.
3. Relancer:

```bash
./scripts/check-prereqs.sh
```

## Cas courant: psql absent

Symptome:

```text
psql: command not found
```

Resolution rapide (Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
```

## Test final avant deploiement

```bash
./scripts/check-prereqs.sh
./scripts/deploy.sh
```

Apres deploiement, verifier PostgreSQL:

```bash
kubectl -n e-sante-ism-spum get pods
kubectl -n e-sante-ism-spum port-forward svc/postgres 5432:5432
psql -h localhost -U postgres -d e_sante_ism_spum
```
