# Rapport de synthèse qualité

## État

MVP fonctionnel livré pour les parcours d’inscription, de connexion, de découverte, de réservation et d’annulation. Le frontend React/TypeScript s’appuie sur une API Django REST Framework séparée en applications `accounts`, `rooms` et `bookings`.

Exécution du 20 novembre 2026 : 13 tests Django réussis, 3 tests Vitest réussis, migrations à jour, build et lint réussis. Le parcours navigateur inscription → réservation → annulation a été vérifié avec les quatre salles seedées.

## Couverture de contrôle

- API : tests automatisés des validations, permissions, filtres de salles, conflits et annulation.
- Frontend : tests Vitest du formulaire d’authentification et du renouvellement JWT.
- Qualité statique : build TypeScript/Vite et lint ESLint.
- L’export des résultats est conservé dans [`test-execution.csv`](test-execution.csv); le parcours responsive a été contrôlé aux largeurs viewport 312 px et 1152 px sans débordement horizontal.

## Limites et risques connus

- SQLite est adapté au MVP local, mais ne constitue pas le choix conseillé pour une forte concurrence de réservations en production.
- Les jetons sont stockés dans `localStorage`; une application exposée doit évaluer le risque XSS et le stockage en cookies `HttpOnly`, `Secure`, `SameSite`.
- La recette navigateur couvre le parcours principal et les largeurs mobile/desktop; une vérification complémentaire sur appareils et navigateurs réels reste recommandée avant production.
- Les règles métier sont exécutées côté serveur; la disponibilité affichée peut changer entre la recherche et la confirmation, auquel cas l’API refuse proprement la réservation.

## Avis

Prêt pour une démonstration locale et une recette fonctionnelle. Une mise en production nécessite une configuration sécurisée, une base durable adaptée à la concurrence, et l’exécution de la recette manuelle responsive.
