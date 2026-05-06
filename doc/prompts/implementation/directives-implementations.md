---
apiVersion: ia.noumanity.com/v1alpha1
kind: ImplementationDirectives
---

# Respecter les 3 documents fondamentaux: CONSTITUTION.md, ARCHITECTURE.md, README.md

Les trois documents jouent des rôles distincts et complémentaires dans la gouvernance du travail de l'IA.

*SI ILS NE SONT PAS PRÉSENTS => INTERROMPRE LE PROCESSUS*

---

## CONSTITUTION.md — Le contrat invariant

C'est la **loi fondamentale du système**. Elle définit les principes qui ne peuvent pas changer, indépendamment de toute décision technique ou opérationnelle.

La Constitution répond à la question : **quelles règles l'IA ne peut jamais enfreindre ?**

---

## ARCHITECTURE.md — Le contrat technique

C'est la **description du rôle fonctionnel de l'IA** dans le pipeline. Elle est plus concrète que la Constitution et peut évoluer, mais décrit les mécanismes.

L'Architecture répond à la question : **comment l'IA s'intègre-t-elle techniquement dans le système ?**

---

## README.md — Le contrat sémantique

C'est le **lexique opérationnel** du système. Il explique ce que signifient les concepts (piliers, campagnes, actions, voix) et comment ils s'articulent.

Le README répond à la question : **quel est le vocabulaire et la logique du domaine que l'IA doit comprendre pour opérer correctement ?**

---

# Implémenter les modifications minimales

Apporter uniquement les modificaitons demandés dans le document d'implémentation. Celui-ci a comme préfixe `IMP` et la structure de nom suivante: `IMP-<XYZ>-<SLUG>.md` 

*SI IL Y A DES AMBIGUITÉS, DES CONTRADICTIONS OU SI IL MANQUE DES INFORMATIONS, INTERROMPRE LE TRAVAIL ET DEMANDER QUELS INFORMATIONS SUPPLÉMENTAIRES SONT NÉCESSAIRES*

*AVANT DE COMMENCER LE TRAVAIL, PRÉSENTER LE PLAN DE TRAVAIL ET DEMANDER UNE VALIDATION*

---

# Utiliser les documents pertinents fournis

Les autres documents passer dans le contexte doivent être utilisées.