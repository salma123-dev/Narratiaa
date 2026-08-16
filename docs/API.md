# Narratiaa API — Documentation complète

Version documentée : `1.0.0`  
Base locale : `http://localhost:3107/api`  
Format : JSON UTF-8

## 1. Vue d’ensemble

L’API Narratiaa gère :

- l’authentification et la vérification d’e-mail ;
- l’onboarding du lecteur ;
- la bibliothèque personnelle ;
- les sessions et la progression de lecture ;
- les notes et citations ;
- les objectifs et statistiques ;
- la recherche de livres via Open Library.

Le serveur est implémenté avec Spring Boot et PostgreSQL. Les données sont isolées par utilisateur.

## 2. Authentification

L’API utilise un cookie de session :

```http
Set-Cookie: narratiaa_session=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800
```

Le cookie est valable 7 jours, inaccessible au JavaScript du navigateur (`HttpOnly`) et envoyé seulement dans un contexte same-site (`SameSite=Strict`). Toutes les routes sont protégées sauf :

- `GET /api/auth/me`
- `POST /api/auth/send-verification`
- `POST /api/auth/verify-email`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Avec `curl`, utilisez `-c cookies.txt` pour enregistrer le cookie et `-b cookies.txt` pour le renvoyer.

## 3. Format des erreurs

Erreur générale :

```json
{ "message": "Book not found." }
```

Erreur de formulaire :

```json
{
  "message": "Check the form fields.",
  "errors": {
    "email": "Verify your email before creating the account."
  }
}
```

Codes courants :

| Code | Signification |
|---|---|
| `200` | Requête réussie |
| `201` | Ressource créée |
| `400` | Données invalides |
| `401` | Session absente ou expirée |
| `404` | Ressource introuvable |
| `409` | Conflit ou doublon |
| `502` | Service externe indisponible |
| `500` | Erreur serveur inattendue |

La taille maximale du corps JSON est d’environ 3 Mo.

## 4. Modèles

### User

```json
{
  "id": 1,
  "fullName": "Salma Reader",
  "email": "salma@example.com",
  "onboardingCompleted": 1
}
```

### Book

```json
{
  "id": 12,
  "title": "The Alchemist",
  "author": "Paulo Coelho",
  "genre": "Fiction",
  "description": "A journey about following a dream.",
  "coverUrl": "https://covers.openlibrary.org/b/id/123-M.jpg",
  "totalPages": 208,
  "currentPage": 54,
  "status": "reading",
  "favorite": 1,
  "startedAt": "2026-08-01",
  "finishedAt": null,
  "createdAt": "2026-08-01 12:00:00",
  "updatedAt": "2026-08-12 18:00:00"
}
```

Statuts possibles : `want_to_read`, `reading`, `completed`, `abandoned`. `favorite` est un booléen dans les réponses JSON.

### ReadingSession

```json
{
  "id": 8,
  "startPage": 40,
  "endPage": 54,
  "minutes": 25,
  "readAt": "2026-08-12T18:30:00"
}
```

### JournalEntry

```json
{
  "id": 4,
  "bookId": 12,
  "bookTitle": "The Alchemist",
  "type": "quote",
  "content": "A memorable passage.",
  "pageNumber": 54,
  "tags": "dream,favorite",
  "createdAt": "2026-08-12 18:40:00",
  "updatedAt": "2026-08-12 18:40:00"
}
```

Types possibles : `note`, `quote`. Les tags sont stockés comme une chaîne séparée par des virgules.

### Goal

```json
{
  "dailyType": "pages",
  "dailyTarget": 30,
  "annualBooks": 20
}
```

`dailyType` accepte `pages` ou `minutes`.

## 5. Authentification et vérification

### Envoyer un code — `POST /api/auth/send-verification`

Corps :

```json
{ "email": "salma@example.com" }
```

Réponse réelle `200` :

```json
{
  "message": "Verification code sent. Check your inbox and spam folder.",
  "development": false
}
```

En développement sans fournisseur d’e-mail, la réponse contient `developmentCode`. Ce code ne doit jamais être exposé en production. Le code comporte 6 chiffres, expire après 10 minutes et autorise 5 essais.

Erreurs : format invalide `400`, e-mail déjà enregistré `409`, fournisseur indisponible `502`.

### Confirmer le code — `POST /api/auth/verify-email`

```json
{ "email": "salma@example.com", "code": "728233" }
```

Réponse `200` :

```json
{
  "message": "Email verified successfully.",
  "verificationToken": "opaque-token"
}
```

Le jeton doit être transmis à l’inscription avec le même e-mail.

### Inscription — `POST /api/auth/register`

```json
{
  "fullName": "Salma Reader",
  "email": "salma@example.com",
  "password": "Reader2026",
  "confirmPassword": "Reader2026",
  "emailVerificationToken": "opaque-token"
}
```

Règles : nom de 2 caractères minimum, e-mail valide et vérifié, mot de passe d’au moins 8 caractères avec une lettre et un chiffre, confirmation identique.

Réponse `201` : `{ "user": User }`, plus le cookie de session. Le jeton de vérification est consommé.

### Connexion — `POST /api/auth/login`

```json
{ "email": "salma@example.com", "password": "Reader2026" }
```

Réponse `200` : `{ "user": User }`, plus le cookie. Identifiants incorrects : `401`.

### Utilisateur courant — `GET /api/auth/me`

Réponse `200` : `{ "user": User }`. Sans session : `401`.

### Déconnexion — `POST /api/auth/logout`

Supprime la session serveur et expire le cookie. Réponse :

```json
{ "message": "Signed out." }
```

## 6. Onboarding

### Lire le profil — `GET /api/onboarding`

Réponse :

```json
{
  "profile": {
    "favoriteGenres": "Fantasy,History",
    "onboardingCompleted": 0
  },
  "goal": {
    "dailyType": "pages",
    "dailyTarget": 30,
    "annualBooks": 12
  }
}
```

### Terminer l’onboarding — `PUT /api/onboarding`

```json
{
  "favoriteGenres": ["Fantasy", "History"],
  "dailyType": "pages",
  "dailyTarget": 25,
  "annualBooks": 18
}
```

Marque l’onboarding comme terminé et met à jour les objectifs.

## 7. Bibliothèque

### Lister — `GET /api/books`

Réponse : `{ "books": [Book] }`. Tri : favoris d’abord, puis dernière modification.

### Ajouter — `POST /api/books`

```json
{
  "title": "The Alchemist",
  "author": "Paulo Coelho",
  "genre": "Fiction",
  "description": "A journey about following a dream.",
  "coverUrl": "https://covers.openlibrary.org/b/id/123-M.jpg",
  "totalPages": 208,
  "currentPage": 0,
  "status": "want_to_read",
  "favorite": false,
  "startedAt": null,
  "finishedAt": null
}
```

`title` et `author` sont obligatoires. Un titre/auteur identique, sans distinction de casse ou espaces externes, retourne `409` avec `duplicateId`. `totalPages` est ramené au minimum à 1 ; `currentPage` reste entre 0 et `totalPages`. Si la dernière page est atteinte, le statut devient automatiquement `completed`.

### Détail — `GET /api/books/{id}`

Réponse :

```json
{ "book": {}, "sessions": [] }
```

Le détail inclut l’historique des sessions, de la plus récente à la plus ancienne.

### Modifier — `PUT /api/books/{id}`

Accepte les mêmes champs que la création. Les champs omis conservent leur valeur. Réponse : `{ "book": Book }`.

### Supprimer — `DELETE /api/books/{id}`

Réponse : `{ "message": "Book deleted." }`. La suppression est définitive et cascade sur les sessions et entrées de journal du livre.

## 8. Sessions de lecture

### Créer — `POST /api/books/{id}/sessions`

```json
{
  "endPage": 54,
  "minutes": 25,
  "readAt": "2026-08-12T18:30:00"
}
```

La page de départ est automatiquement la page courante. La page finale ne peut pas reculer ni dépasser le total. Les minutes sont ramenées au minimum à 1. En l’absence de `readAt`, la date courante ISO est utilisée. Le livre passe à `reading`, ou à `completed` à la dernière page.

Réponse `201` :

```json
{ "session": {}, "book": {} }
```

### Consulter une session — `GET /api/reading-sessions/{id}`

```bash
curl -b cookies.txt http://localhost:3107/api/reading-sessions/8
```

Réponse `200` : `{ "session": ReadingSession }`. Une session absente ou appartenant à un autre utilisateur retourne `404`.

### Modifier une session — `PUT /api/reading-sessions/{id}`

```bash
curl -b cookies.txt -X PUT http://localhost:3107/api/reading-sessions/8 \
  -H "Content-Type: application/json" \
  -d '{"endPage":60,"minutes":32,"readAt":"2026-08-12T19:00:00"}'
```

Les champs sont facultatifs et conservent leur ancienne valeur lorsqu’ils sont omis. La progression du livre est recalculée après modification.

Réponse `200` : `{ "session": ReadingSession, "book": Book }`.

### Supprimer une session — `DELETE /api/reading-sessions/{id}`

```bash
curl -b cookies.txt -X DELETE http://localhost:3107/api/reading-sessions/8
```

Supprime la session et recalcule la progression à partir de la dernière session restante. Réponse `200` :

```json
{ "message": "Reading session deleted.", "book": {} }
```

## 9. Journal

### Lister — `GET /api/journal`

Réponse : `{ "entries": [JournalEntry] }`, par ordre antéchronologique.

### Consulter une entrée — `GET /api/journal/{id}`

```bash
curl -b cookies.txt http://localhost:3107/api/journal/4
```

Réponse `200` : `{ "entry": JournalEntry }`. Entrée absente ou appartenant à un autre utilisateur : `404`.

### Ajouter — `POST /api/journal`

```json
{
  "bookId": 12,
  "type": "quote",
  "content": "A memorable passage.",
  "pageNumber": 54,
  "tags": "dream,favorite"
}
```

Le livre doit appartenir à l’utilisateur et le contenu ne peut pas être vide. Toute valeur `type` autre que `quote` devient `note`. Réponse `201` : `{ "id": 4 }`.

### Modifier — `PUT /api/journal/{id}`

Accepte partiellement `type`, `content`, `pageNumber` et `tags`. Le contenu vide est refusé. Réponse : `{ "entry": JournalEntry }`.

### Supprimer — `DELETE /api/journal/{id}`

Réponse : `{ "message": "Entry deleted." }`.

## 10. Objectifs et statistiques

### Lire les objectifs — `GET /api/goals`

Crée les valeurs par défaut si nécessaire. Réponse : `{ "goal": Goal }`.

### Modifier les objectifs — `PUT /api/goals`

```json
{ "dailyType": "minutes", "dailyTarget": 20, "annualBooks": 24 }
```

Les cibles sont ramenées au minimum à 1. Toute valeur de type autre que `minutes` devient `pages`.

### Statistiques — `GET /api/stats`

```json
{
  "stats": {
    "totalBooks": 8,
    "completedBooks": 3,
    "libraryPages": 840,
    "pagesRead": 430,
    "minutesRead": 620,
    "today": { "pages": 20, "minutes": 30 },
    "activity": [{ "date": "2026-08-12", "pages": 20, "minutes": 30 }],
    "streak": 4,
    "completedThisYear": 3,
    "goal": {}
  }
}
```

`activity` couvre les 30 derniers jours. La série commence aujourd’hui et remonte jusqu’au premier jour sans activité.

## 11. Catalogue Open Library

### Rechercher — `GET /api/catalog/search?q={texte}`

Deux caractères minimum. Le serveur appelle Open Library, limite à 10 résultats et normalise chaque résultat :

```json
{
  "results": [{
    "externalId": "/works/OL27448W",
    "title": "The Lord of the Rings",
    "author": "J. R. R. Tolkien",
    "genre": "Fantasy",
    "description": "First published in 1954.",
    "coverUrl": "https://covers.openlibrary.org/b/id/258027-M.jpg",
    "totalPages": 448
  }]
}
```

Si le catalogue ne fournit pas le nombre de pages, la valeur par défaut est 300. Une panne Open Library retourne `502`.

## 12. Exemple de parcours complet avec curl

```bash
# 1. Demander le code
curl -c cookies.txt -X POST http://localhost:3107/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"salma@example.com"}'

# 2. Confirmer le code et récupérer verificationToken
curl -X POST http://localhost:3107/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"salma@example.com","code":"728233"}'

# 3. Créer le compte et stocker le cookie
curl -c cookies.txt -X POST http://localhost:3107/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Salma Reader","email":"salma@example.com","password":"Reader2026","confirmPassword":"Reader2026","emailVerificationToken":"TOKEN"}'

# 4. Ajouter un livre
curl -b cookies.txt -X POST http://localhost:3107/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"The Alchemist","author":"Paulo Coelho","totalPages":208,"status":"reading"}'

# 5. Ajouter une session
curl -b cookies.txt -X POST http://localhost:3107/api/books/1/sessions \
  -H "Content-Type: application/json" \
  -d '{"endPage":30,"minutes":25}'
```

## 13. Configuration

Variables optionnelles/nécessaires :

```env
PORT=3107
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=narratiaa.app@gmail.com
MAIL_PASSWORD=your_google_app_password
EMAIL_FROM=Narratiaa <narratiaa.app@gmail.com>
NODE_ENV=production
```

En développement sans Resend, l’API renvoie un code local. En production, configurez obligatoirement l’envoi réel.

## 14. Limites actuelles

- pas de pagination sur la bibliothèque ou le journal ;
- pas de réinitialisation de mot de passe ;
- pas de rate limiting sur les routes publiques ;
- suppression de livre définitive ;
- les tags et genres favoris sont stockés comme chaînes CSV ;
- aucune version explicite dans l’URL (`/api/v1`) ;
- la recherche dépend de la disponibilité d’Open Library.

La spécification machine correspondante se trouve dans [`openapi.yaml`](./openapi.yaml).
