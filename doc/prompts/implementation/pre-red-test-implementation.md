# Voici ce qu'il faut respecter lorsque l'on prépare les tests (TDD => red)

- Lire les fichiers README.md, CONSTITUTION.md, ARCHITECTURE.md et INTENTION.md
- Dire s'il manque des informations pour pouvoir définir les tests correctements
- Décrire les tests manuelles dans le fichiers `TESTS.md`
  - Pour chaque scénario de test: 1. donner un LABEL-ID, 2. dire ce qui sera testé et 3. pourquoi c'est nécessaire
  - Donner la procédure manuel à suivre, pas à pas, pour tester chaque scénario incluant: 1. précondition, 2. comment procéder pour faire le test, 3. post conditions et 4. résultat attendu / critères de succès / critères d'échec
- NE PAS EXECUTER de code localement
  - toujours exécuter dans un environnement virtuel comme docker ou une vm qemu ou un remote sécuritaire
  - identifier les risques en matière de sécuriter pour l'exécution de code
  - DEMANDER À L'UTILISATEUR si l'environnement d'exécution est sécuritaire
