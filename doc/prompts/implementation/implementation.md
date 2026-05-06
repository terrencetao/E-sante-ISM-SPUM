# Voici ce qu'il faut respecter durant l'implémentation

- Lire les fichiers README.md, CONSTITUTION.md, ARCHITECTURE.md et INTENTION.md
- Prendre connaissance:
  - du plan d'implémentation `doc/implementation-workdir/IMP-<SEQ>/plan.md`
  - des tests à passer `tests/IMP-<SEQ>`
- Analyser le travail à faire pour chaque tests et produire un document expliquant ce qu'il faut faire pour chaque scénario de test dans `doc/implementation-workdir/IMP-<SEQ>/tdd.md`
- implémenter le minimum pour que UN des scénario de test passe, puis tester le scénario avec `nou testit --scenario TEST_ID`
- Commencer l'implémentation du prochain scénario seulement lorsque le précédent passe avec succès.
- Lorsque tous les tests passe, analyser les changements et mettre à jour `doc/implementation-workdir/IMP-<SEQ>/tdd.md`
- Faire un refactoring si nécessaire


## Contraintes à respecter

- ne jamais modifier les fichiers de tests durant l'implémentation. Si c'est nécessaire, expliquer pourquoi et demander avant de procéder
- ne pas exécuter localement le code, toujours travailler dans un environnement virtuel (docker ou vm qemu)
- une fois terminer, vérifier qu'il n'y a pas de régression en exécutant tous les tests 
- ne pas hardcodé les paramètres et les secrets