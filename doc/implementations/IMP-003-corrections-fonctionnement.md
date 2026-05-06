# IMP-003 - Corrections du fonctionnement de la POC-1

Voici des erreurs à corriger:

## mode superuser pas vraiment superuser

- Lorsqu'on est en mode superuser, on peut basculer vers n'importe quel utilisateur
- mais une fois dans ce autre utilisateur, on ne peut pas rebasculer vers un autre utilisateur
- le système retourne l'erreur suivante: Bascule utilisateur refusee. Connectez-vous avec admin-system ou dev-superuser.
- comportement attendu: en mode dev, on peut toujours basculer entre les utilisateurs, peu importe l'utilisateur que l'on est

## Utilisabilité générale

- ajouter des fonctionalité d'aide à la navigation
  - notamment un bouton permettant de revenir à la page d'accueil
  - avoir un bouton logout dans toutes les vue (et au même endroit)
- la vue synchronisation n'est pas nécessaire

## gestion de campagne

### Améliore la gestion des campagnes

- Pour les 3 types de ressources (aires de santé, campagne et assignation), implémenter un CRUD complet:
  - afficher la liste
  - créer un nouveau
  - modifier
  - supprimer

## Améliore la collecte de données

- Lorsque l'on va a "demarrer collecte", on devrait avoir une liste de campagnes assignés.
- lors d'une campagne, l'utilisateur ne doit pas devoir entrer l'id de la campagne, ni l'id de la zone. Ces informations sont fixés par le gestionnaire de campagne.
- Ensuite, remplacer "données json" par données. Et permettre de mettre n'importe quel texte. Convertir en un json à l'interne, mais l'utilisateur peut entrer n'importe quoi, sans restriction de format.
- Enlever les boutons "sauvegarder localement" et "synchroniser". La sauvegarde locale doit être automatique et la synchronisation également.
- La synchronisation doit avoir lieu automatiquement à intervale régulier ou dès qu'il y a une mise à jour de donnée (avec debounce).


## Supervision

- séparer la vu analytics de la vue supervision
- la vue supervision est uniquement visible par l'admin-system (et super user bien évidemment ;-) )



