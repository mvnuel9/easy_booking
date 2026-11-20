# Plan de test EasyBooking

## Objectif

Vérifier le parcours complet du compte à la réservation, la confidentialité des données entre comptes et les règles de disponibilité. Les tests automatisés sont exécutables localement sans service tiers.

## Niveaux

- **Unitaire frontend** : transmission du JWT, renouvellement après expiration, navigation entre formulaires.
- **API Django** : validations d’authentification, filtres, autorisations, règles de créneaux et annulation.
- **Build statique** : TypeScript, bundle Vite et lint.
- **Recette manuelle** : vérification responsive et parcours réel navigateur avec le serveur backend démarré.

## Scénarios de recette

| ID | Scénario | Résultat attendu |
| --- | --- | --- |
| AUTH-01 | Inscription avec identifiant, e-mail valide et mot de passe conforme | Compte créé; mot de passe absent de la réponse |
| AUTH-02 | Inscription avec e-mail déjà utilisé, sans tenir compte de la casse | Réponse de validation, aucun doublon |
| AUTH-03 | Inscription avec mot de passe faible | Erreur de validation compréhensible |
| AUTH-04 | Connexion avec e-mail et mot de passe valides | Jetons d’accès et de rafraîchissement retournés |
| AUTH-05 | Connexion avec identifiants invalides | Réponse 401 |
| AUTH-06 | Appel API sans JWT | Réponse 401 sur les routes privées |
| ROOM-01 | Filtrage par capacité minimale et équipement | Seules les salles satisfaisant les deux critères sont listées |
| ROOM-02 | Recherche chevauchant une réservation confirmée | Salle occupée exclue |
| ROOM-03 | Recherche sur un intervalle adjacent | Salle disponible |
| ROOM-04 | Capacité mal formée ou intervalle incomplet | Réponse 400 |
| BOOK-01 | Réservation d’un créneau futur libre | Réponse 201 et détails de la salle |
| BOOK-02 | Réservation d’un créneau déjà pris | Réponse 400, aucune seconde réservation |
| BOOK-03 | Créneau de durée nulle, inversé ou passé | Réponse 400 |
| BOOK-04 | Deux utilisateurs lisent ou annulent la réservation de l’autre | Aucune fuite; réponse 404 |
| BOOK-05 | Annulation d’une réservation future | Statut annulé, créneau à nouveau disponible |
| UI-01 | Basculer Connexion/Inscription | Champs attendus et langue française |
| UI-02 | Jeton d’accès expiré avec refresh valide | Refresh automatique et reprise de l’appel initial |
| UI-03 | Vérifier les vues salles et historique à 320 px et desktop | Contrôles lisibles, sans chevauchement ni débordement |

## Critères d’acceptation

- Tous les tests automatisés passent.
- `npm run build` et `npm run lint` sont sans erreur.
- Les opérations d’écriture et de lecture des réservations sont isolées par utilisateur.
- Aucun chevauchement confirmé n’est possible pour une même salle.
- La recette manuelle confirme l’affichage mobile et desktop avant livraison en production.
