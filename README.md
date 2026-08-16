# Narratiaa

Narratiaa est une application web pour organiser sa bibliothèque, suivre sa progression et conserver ses notes de lecture.

## Fonctionnalités

- inscription avec vérification de l’adresse e-mail ;
- bibliothèque personnelle et recherche Open Library ;
- progression et sessions de lecture ;
- notes, citations et étiquettes ;
- objectifs quotidiens et annuels ;
- statistiques et séries de lecture.

## Technologies

| Couche | Technologies |
|---|---|
| Web | React 19, Vite 8 |
| API | Java 21, Spring Boot 4.1 |
| Données | PostgreSQL, Flyway |
| E-mails | Resend |
| Production | Docker, Render |

## Structure

```text
narratiaa/
├── apps/
│   ├── api/              application Spring Boot
│   └── web/              application React/Vite
├── docs/                 documentation technique
├── infrastructure/       Docker et Compose
├── storage/legacy/       ancienne base SQLite locale
├── tools/                scripts de développement
├── .env.example          exemple de configuration
├── package.json          commandes globales
├── render.yaml           Blueprint Render
└── README.md
```

## Prérequis

- Java 21 ;
- Maven 3.6.3 ou supérieur ;
- Node.js 24 et npm ;
- Docker Desktop pour PostgreSQL local.

## Installation

```powershell
Copy-Item .env.example .env
npm run install:all
npm run db:start
npm run dev
```

Services locaux :

- interface : [http://localhost:5173](http://localhost:5173) ;
- API : [http://localhost:3107/api](http://localhost:3107/api) ;
- santé : [http://localhost:3107/api/health](http://localhost:3107/api/health).

Sans identifiants SMTP, le code de vérification est affiché localement. Pour envoyer de vrais e-mails, renseignez `MAIL_USERNAME`, `MAIL_PASSWORD` et `EMAIL_FROM` dans `.env`.

## Commandes

| Commande | Description |
|---|---|
| `npm run install:all` | Installe les dépendances web et outils |
| `npm run dev` | Lance React et Spring Boot |
| `npm run dev:web` | Lance uniquement React |
| `npm run dev:api` | Lance uniquement Spring Boot |
| `npm run db:start` | Démarre PostgreSQL local |
| `npm run db:stop` | Arrête PostgreSQL local |
| `npm run build` | Compile React |
| `npm run build:api` | Produit le JAR full-stack |
| `npm run lint` | Vérifie le frontend |
| `npm test` | Exécute les tests backend |
| `npm run clean` | Supprime uniquement les sorties générées |
| `npm run db:transfer` | Importe l’ancienne base SQLite |

## Documentation

- [API REST](docs/API.md)
- [OpenAPI 3.1](docs/openapi.yaml)
- [Architecture](docs/ARCHITECTURE.md)
- [Déploiement Render](docs/DEPLOYMENT.md)

## Déploiement

Render détecte automatiquement le fichier `render.yaml` à la racine. Le Blueprint crée un service Docker Spring Boot et une base PostgreSQL. Ajoutez `MAIL_USERNAME`, `MAIL_PASSWORD` et `EMAIL_FROM` comme secrets dans Render, jamais dans GitHub.

La configuration gratuite convient à une démonstration : le service peut s’endormir après 15 minutes et PostgreSQL expire après 30 jours. Ne l’utilisez pas pour conserver durablement les données d’utilisateurs réels.

Après le déploiement, vérifiez `/api/health`, puis testez l’inscription, l’onboarding, la bibliothèque, une session de lecture, le journal, les statistiques et la reconnexion.

## Sécurité

- mots de passe hachés avec scrypt ;
- jetons de session hachés en base ;
- cookie `HttpOnly`, `SameSite=Strict` et `Secure` en production ;
- codes e-mail temporaires avec limite d’essais ;
- requêtes SQL paramétrées et ressources isolées par utilisateur ;
- secrets et données locales exclus de Git.
