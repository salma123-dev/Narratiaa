# Déploiement de Narratiaa sur Render

Le Blueprint `render.yaml` se trouve à la racine afin d’être détecté automatiquement. Il crée le service Docker Spring Boot et la base PostgreSQL managée.

Le Blueprint utilise les instances gratuites pour le prototype. Le service web s’arrête après 15 minutes sans trafic et redémarre à la requête suivante. La base PostgreSQL gratuite expire après 30 jours, ne fournit aucune sauvegarde et doit être remplacée par une base durable avant l’ouverture publique.

## Déployer

1. Pousser le dépôt sur GitHub ou GitLab.
2. Dans Render, choisir **New → Blueprint** puis sélectionner le dépôt.
3. Renseigner `MAIL_USERNAME`, `MAIL_PASSWORD` et `EMAIL_FROM` pour Gmail SMTP.
4. Attendre la construction de l’image et les migrations Flyway.
5. Vérifier `https://<service>.onrender.com/api/health`.

Réponse attendue :

```json
{"status":"ok","database":"postgres"}
```

## Développement local

```powershell
npm run install:all
npm run db:start
npm run dev
```

## Ancienne base SQLite

La base historique est conservée dans `storage/legacy`. Pour la transférer :

```powershell
$env:DATABASE_URL="postgresql://user:password@host:5432/narratiaa"
npm run db:transfer
```

## Sauvegarde

```powershell
.\tools\backup-postgres.ps1 -DatabaseUrl "postgresql://..."
```

Références : [Blueprint Render](https://render.com/docs/blueprint-spec), [Render Postgres](https://render.com/docs/postgresql-creating-connecting), [sauvegardes](https://render.com/docs/postgresql-backups).
