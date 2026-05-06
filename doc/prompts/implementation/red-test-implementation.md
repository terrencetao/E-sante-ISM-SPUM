# Voici ce qu'il faut respecter lorsque l'on prépare les RED tests


## Contexte à prendre en compte


- Lire les fichiers `README.md`, `CONSTITUTION.md`, `ARCHITECTURE.md` et `INTENTION.md`
- Lire la commande: fichier `doc/implementation/IMP-<SEQ>-*`
- Lire tous le fichier dans le répertoire de travail `doc/implementation-workdir/IMP-<SEQ>`, notamment:
  - plan.md
- Lire les informations concernant les tests dans `tests/IMP-<SEQ>`

## Procédure

- DIRE SI IL Y A DES AMBIGUITÉS
- DIRE SI IL MANQUE DES INFORMAITONS
- Coder la préparation des tests pour avoir les précondition dans un environnement isolé
- Coder le boilerplate pour une exécution, mais ne pas fair autune impémentation
- Exécuter tous les tests

RÉSULTAT ATTENDU: TOUS LES TESTS ÉCHOUENT