# API EasyBooking

Base URL locale : `http://localhost:8000/api`. Les réponses sont JSON. Sauf les routes d’authentification, les endpoints nécessitent `Authorization: Bearer <access>`.

## Authentification

| Méthode | Route | Accès | Rôle |
| --- | --- | --- | --- |
| `POST` | `/auth/register/` | Public | Créer un compte (`username`, `email`, `password`) |
| `POST` | `/token/` | Public | Obtenir `access` et `refresh` avec `email` et `password` |
| `POST` | `/token/refresh/` | Public | Renouveler les jetons avec `refresh` |

Les adresses sont normalisées en minuscules. Le mot de passe doit respecter les validateurs Django et faire au moins huit caractères. Les jetons d’accès durent 30 minutes; les jetons de rafraîchissement, sept jours.

## Salles

`GET /rooms/` renvoie les salles actives. Paramètres optionnels :

| Paramètre | Exemple | Effet |
| --- | --- | --- |
| `capacity` | `?capacity=8` | Capacité minimale |
| `equipment` | `?equipment=Écran` | Équipement requis |
| `available_from` et `available_to` | horodatages ISO 8601 | Exclut les salles occupées pendant le créneau |

Les deux paramètres de date doivent être fournis ensemble. Deux créneaux adjacents sont permis; les chevauchements ne le sont pas.

## Réservations

| Méthode | Route | Rôle |
| --- | --- | --- |
| `GET` | `/bookings/` | Historique du compte connecté |
| `POST` | `/bookings/` | Créer une réservation |
| `GET` | `/bookings/{id}/` | Lire une réservation appartenant au compte |
| `PATCH` | `/bookings/{id}/cancel/` | Annuler une réservation future appartenant au compte |

Exemple de création :

```json
{
  "room_id": 1,
  "starts_at": "2026-11-21T09:00:00+01:00",
  "ends_at": "2026-11-21T10:00:00+01:00"
}
```

Une réservation passée, un intervalle invalide ou un créneau déjà pris renvoie `400`. Une ressource appartenant à un autre compte est masquée (`404`). Les listes ne contiennent que les réservations de l’utilisateur authentifié.
