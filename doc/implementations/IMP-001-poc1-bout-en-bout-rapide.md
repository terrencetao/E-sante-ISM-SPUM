# IMP-001 - Prototype rapide bout en bout

Objectifs:

- avoir un système témoin qui peut être utilisé le plus rapidement possible
- avoir un système témoin qui est le plus simple possible
- avoir un système témoin qui capture toutes les caractéristiques souhaités du vrai système 


## Description du système à haut niveau

- Un système d'applications conteneurisés déployables localement dans k3d (environnement dev)
- Voici les parties du système:
  - une application mobile (optimisé d'abord pour cellulaires, puis pour tablettes) offline-first web PWA
  - un serveur web pour servir cette application web
  - un second serveur backend intermédiaire qui expose un API REST faisant la relation entre des données stockées localement (sur ce serveur), un serveur central et l'application mobile
  - une application web de gestion: administration système + administration de campagne + traitement/analyse des données,
  - un service de centralisation et de dispatch des données (selon le mécanisme de sync retenu)



## Type et organisation des données

- données décrivants les utilisateurs: identité, permissions, etc. Il y a 2 "classe" d'information pour ce type de donnés: 1. informations d'identification et 2. informations de rôle et permission
- données décrivants les sujets (personnes non-utilisateurs): identité, dossier informationnel avec persistance et suivi temporel. Il y a 3 "classes" d'informations: 1. informations d'identification et 2. données socio-démographiques et 3. données médicales
- données de gestion socio-géographique et administratives: 1. zones et découpage démographique
- données de projets: 1. quel projet, 2. le projet touche quel zone et 3. quels sont les intervenants associés à tel zone

## Métier et utilisation

Voici les types de personnes impliquées et impactées:
  - un "gestionnaire de campagne": gère les zones
  - un analyste: traite les données recueillis et en fait sortir de la connaissance
  - un intervenant terrain: utilise l'application mobile first pour la collecte de donnée
  - un patient: est le sujet sur lequel on collecte des données, n'est pas un utilisateur du système

Voici "en gros" ce qui se produit:

- le gestionnaire de campagne décide qu'il y a une nouvelle campagne
- le gestionnaire de campagne décide de l'information à recueillir lors d'une campagne
- le gestionnaire de campagne assigne un teritoire, une campagne à un intervenant terrain
- l'intervenant terrain va sur le terrain et collecte les données pour une campagne auprès des patients
- le système recueille et "centralise" les données
- l'analyse fait des analyses sur les données recueillis

## Stack technique

### 1. Frontend PWA offline-first

React + Vite + TypeScript + Workbox

- Avantages:
  - Ecosysteme mature PWA
  - DX rapide
  - Workbox robuste pour cache strategies
- Inconvenients:
  - Stack JS/TS (pas Python)
  - Dependance build chain JS

### 2. Stockage local offline

RxDB

- Avantages:
  - Offline/sync pense nativement

## 3. Backend API intermediaire (Python)
FastAPI + Uvicorn + SQLModel/SQLAlchemy
- Avantages:
  - Tres rapide a demarrer
  - Typage et OpenAPI auto
  - Bon fit POC
- Inconvenients:
  - Discipline de structure necessaire a mesure que ca grossit

## 4. Base de donnees backend

PostgreSQL

- Avantages:
  - Solide, standard prod
  - JSONB utile
- Inconvenients:
  - Setup plus lourd que SQLite


Sync et messaging

Option A: Pull REST periodique + endpoints /sync
- Avantages:
  - Simplicite maximale
- Inconvenients:
  - Moins elegant pour temps reel


## 6. Auth

JWT local + RBAC simple
- Avantages:
  - Rapide a implementer
- Inconvenients:
  - Rotation/revocation a traiter

## 7. Orchestration locale

k3d + manifests Kubernetes
- Avantages:
  - Conformite a la demande
  - Proche prod K8s
- Inconvenients:
  - Charge d'apprentissage pour equipe non-K8s


# Ce qui doit être produit par cette implémentation

La structure minimale pour être fonctionnelle.

- un répertoire pour chaque composant logiciel
- chaque composant logiciel est initialisé
- les manifestes nécessaires au déploiement
- un script permettant de déployer tous les composants dans un cluster k3d

Coder uniquement ce qui est nécessaire pour ce workflow:

1. Dans l'application de gestion système, l'administrateur de système crée les utilisateurs et assigne les rôles
  - 1 gestionnaire de campagne
  - 2 intervenants terrains
  - 1 analyste
2. Dans l'application de gestion de campagne, le gestionnaire de campagne crée 2 aires de santé contenant chacune 2 villages
3. Dans l'application de gestion de campagne, le gestionnaire de campagne crée une campagne et assigne chaque intervenant terrain à une aire de santé
4. Dans l'application pwa, l'intervenant terrain prend connaissance de son assignation sur internet
5. Dans l'application pwa, l'intervenant receuille des données dans sa zone d'intervention attitrée en mode offline
5. Dans l'application pwa, lorsque l'intervenant se reconnecte, les données sont envoyés vers le backend
6. Dans une application d'analyse de données, l'analyste voit les données qui ont été transmises par les 2 intervenants

## information supplémentaire

- la biométrie est hors scope pour cette phase de prototypage.
- pour le déploiement, on couvre seulement k3d en mode développement
- pour la synchronisation, adopter last-write-win. mais logger tous les conflits et les envoyer pour analyse au gestionnaire de système
- login: c'est une poc simple qui est destiné à du développement seulement. Alors: courriel + pin à 4 caractères. Définit par administrateur système avec pin à changé par l'utilisateur au premier login
- rôles:
  - administrateur système
  - administrateur campagne
  - intervenant terrain
  - analyste
- chaque rôle à le droit ou pas d'accéder à chaque vue
- chaque vue expose certaines ressources
- chaque rôle recoit des permissions par rapport à chaque ressource

## sécurité et conformité

- les données sont chiffrées dans la base de donnée
- tout transport de donnée et tout accès et toute modification de donnée est envoyé aux logs
