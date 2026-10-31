# Architecture de Narratiaa

## Organisation du dépôt

```text
narratiaa/
├── apps/
│   ├── api/                 application Spring Boot
│   │   └── src/
│   │       ├── main/java/   domaines et contrôleurs REST
│   │       └── main/resources/db/migration/
│   └── web/                 application React/Vite
│       ├── public/
│       └── src/
│           ├── assets/
│           ├── components/
│           ├── pages/
│           └── services/
├── docs/                    documentation technique
├── infrastructure/          Docker et Compose
├── storage/legacy/          ancienne base SQLite locale
├── tools/                   scripts de développement
├── .env.example
├── package.json             commandes globales
└── README.md
```

## Flux applicatif

En développement, Vite transmet `/api` à Spring Boot. En production, le frontend compilé est intégré au JAR et servi par Spring Boot.

```text
React/Vite → Spring Boot REST → PostgreSQL
                   ├──────────→ Brevo API
                   └──────────→ Open Library
```

## Règles d’organisation

- Les propriétés JSON utilisent `camelCase` et les colonnes SQL `snake_case`.
- Les appels HTTP du frontend restent dans `apps/web/src/services`.
- Chaque domaine backend possède son propre package sous `apps/api/src/main/java/com/narratiaa`.
- Chaque modification de schéma ajoute une nouvelle migration Flyway.
- Les fichiers générés restent exclus de Git.
- Les données historiques ne sont jamais supprimées par `npm run clean`.

## Ajouter une fonctionnalité

1. Ajouter une migration Flyway si le modèle change.
2. Ajouter le service et le contrôleur Java dans le domaine concerné.
3. Mettre à jour `docs/API.md` et `docs/openapi.yaml`.
4. Ajouter le client HTTP puis l’interface React.
5. Exécuter `npm run lint`, `npm run build` et `npm test`.
