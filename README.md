# EasyBooking

EasyBooking est un MVP de réservation de salles, avec un frontend React/TypeScript et une API Django REST Framework. L’interface et les messages sont en français. Les comptes utilisent JWT, les données sont stockées dans SQLite et les créneaux sont définis par une date/heure de début et de fin.

## Fonctionnalités

- Inscription et connexion par adresse e-mail, avec validation du mot de passe.
- Catalogue de salles, filtre par capacité et équipement.
- Recherche de disponibilité pour un créneau précis et contrôle des conflits lors de la réservation.
- Historique personnel, annulation d’une réservation future et libération du créneau.
- Renouvellement automatique du jeton d’accès par le jeton de rafraîchissement.

## Prérequis

- Node.js 20.19+ et npm.
- Python 3.12+ (le projet a été vérifié avec Python 3.14).

## Démarrage local

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Dans un autre terminal :

```sh
cd frontend
npm install
npm run dev
```

Ouvrir http://localhost:5173. L’API est exposée sur http://localhost:8000/api. Les salles de démonstration peuvent être recréées avec `python manage.py seed_demo` depuis `backend/`.

## Tests et qualité

```sh
cd backend
source ../.venv/bin/activate
python manage.py test accounts.tests rooms.tests bookings.tests
cd ../frontend
npm test
npm run build
npm run lint
```

Le plan de test détaillé se trouve dans [`docs/test-plan.md`](docs/test-plan.md), l’export des dernières exécutions dans [`docs/test-execution.csv`](docs/test-execution.csv), et le rapport qualité dans [`docs/quality-report.md`](docs/quality-report.md).

## Architecture

```text
backend/
  accounts/   utilisateur email, inscription et JWT
  rooms/      catalogue et recherche de disponibilité
  bookings/   création, historique, annulation et conflits
  easybooking/ configuration et routes du projet
frontend/
  src/App.tsx écran et parcours utilisateur
  src/api.ts  client HTTP typé et renouvellement JWT
```

Chaque fonctionnalité métier est isolée dans son application Django. SQLite convient au MVP local; `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` et `CORS_ALLOWED_ORIGINS` sont configurables par variables d’environnement. Avant un déploiement public, utiliser une clé secrète dédiée, désactiver le mode debug, activer HTTPS et évaluer une base adaptée à la concurrence.

## API

La documentation des routes, paramètres et exemples de requêtes est dans [`docs/api.md`](docs/api.md). Les routes métier requièrent un en-tête `Authorization: Bearer <access>`; l’inscription et l’obtention des jetons sont publiques.

## Dépôt Git

Le projet est initialisé en dépôt Git local. Aucun dépôt distant n’a été fourni ou configuré; le lien distant pourra être ajouté avec `git remote add origin <URL>`.
