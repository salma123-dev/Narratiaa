# Déploiement de Narratiaa sur Render

Le Blueprint `render.yaml` se trouve à la racine afin d’être détecté automatiquement. Il crée le service Docker Spring Boot et la base PostgreSQL managée.

## Déployer

1. Pousser le dépôt sur GitHub ou GitLab.
2. Dans Render, choisir **New → Blueprint** puis sélectionner le dépôt.
3. Renseigner `RESEND_API_KEY` et `EMAIL_FROM`.
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
