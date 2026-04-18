# Projet Laravel - Plateforme de Recrutement

## Description

Ce projet est un backend Laravel pour une plateforme type mini-LinkedIn.

Entites principales:

- Utilisateurs avec role: candidat, recruteur, admin
- Profils candidats
- Competences
- Offres publiees par les recruteurs
- Candidatures des profils sur les offres

## Stack Technique

- PHP ^8.3
- Laravel ^13
- MySQL
- JWT Auth: tymon/jwt-auth ^2.3
- Front build: Vite ^8 + TailwindCSS ^4

## Dependances Principales

Dependances PHP (production):

- laravel/framework
- laravel/tinker
- tymon/jwt-auth

Dependances PHP (dev):

- fakerphp/faker
- laravel/pail
- laravel/pint
- phpunit/phpunit

Dependances Node (dev):

- vite
- laravel-vite-plugin
- tailwindcss
- @tailwindcss/vite
- concurrently

## Prerequis

- PHP 8.3+
- Composer
- Node.js + npm
- MySQL

## Installation (Nouvelle Machine)

1. Cloner le repository:

```bash
git clone https://github.com/atel12345/projet_laravel-TELOUANI-Amine-SBIA-Youness-.git
cd projet_laravel-TELOUANI-Amine-SBIA-Youness-
```

2. Installer les dependances PHP:

```bash
composer install
```

3. Installer les dependances front:

```bash
npm install
```

4. Creer le fichier d'environnement:

```bash
copy .env.example .env
```

5. Configurer la base de donnees dans `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mini_linkedin
DB_USERNAME=
DB_PASSWORD=
```

6. Generer les cles:

```bash
php artisan key:generate
php artisan jwt:secret
```

7. Lancer migrations + seeders:

```bash
php artisan migrate:fresh --seed
```

## Lancement du Projet

Option recommandee (backend + frontend en une commande):

```bash
npm run dev:full
```

Puis ouvrir:

```text
http://127.0.0.1:8000
```

Important:

- `npm run dev` seul demarre uniquement Vite (HMR), pas la page Laravel complete.
- Si vous ouvrez l'URL Vite (ex: `http://127.0.0.1:5173` ou `5174`), vous verrez la page d'aide Vite et non l'app React Laravel.
- Le script `dev:full` nettoie automatiquement les caches Laravel et le fichier `public/hot` avant de demarrer, ce qui evite les problemes de preamble React/Vite sur d'autres machines.

Execution separee (si necessaire):

Backend Laravel:

```bash
php artisan serve
```

Frontend Vite:

```bash
npm run dev
```

## Resolution Erreur React Preamble

Si vous voyez l'erreur `@vitejs/plugin-react can't detect preamble`, les protections suivantes sont deja en place:

- `@viteReactRefresh` est injecte dans la Blade avant `@vite`, ce qui installe correctement le preamble React.
- Nettoyage automatique de l'etat de dev avant chaque `npm run dev:full`.

Procedure recommandee:

1. Arreter tous les serveurs Node/PHP en cours.
2. Executer `npm run dev:full`.
3. Ouvrir uniquement `http://127.0.0.1:8000`.

## Donner Acces Au Professeur Sans Hosting Payant

Option la plus simple: partager temporairement votre machine locale via un tunnel.

### Option 1: Cloudflare Tunnel (gratuit)

1. Installer `cloudflared`.
2. Demarrer le projet avec `npm run dev:full`.
3. Dans un autre terminal, lancer:

```bash
cloudflared tunnel --url http://127.0.0.1:8000
```

4. Partager l'URL HTTPS publique generee avec votre professeur.

Avantages:

- Gratuit.
- HTTPS direct.
- Stable pour une demo en direct.

### Option 2: ngrok (plan gratuit)

1. Demarrer le projet avec `npm run dev:full`.
2. Lancer:

```bash
ngrok http 8000
```

3. Partager l'URL HTTPS ngrok.

### Option 3: GitHub + video + guide de lancement (zero infra)

Si l'acces reseau est complique:

1. Pousser le code complet sur GitHub.
2. Fournir ce README + un court screencast (2-3 min).
3. Donner les commandes exactes:

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate:fresh --seed
npm install
npm run dev:full
```

Cette option ne publie pas l'application en ligne, mais reste souvent acceptee pour une evaluation academique.

## Seeders Inclus

Ordre d'execution via `DatabaseSeeder`:

- `CompetenceSeeder`
- `UserSeeder`
- `OffreSeeder`
- `CandidatureSeeder`

## Collaboration GitHub

Regles importantes:

- Ne jamais commit `.env`
- Ne jamais commit des credentials reels
- Chaque membre du binome utilise son propre `.env`

Verification rapide avant push:

```bash
git ls-files | findstr /I ".env"
```

Resultat attendu:

- `.env.example` present
- `.env` absent

## Collection Postman (Scenarios Complets)

Le depot contient une collection Postman prete a importer:

- `postman/Laravel JWT Recruitment API.postman_collection.json` (collection principale)
- `postman/MiniLinkedIn_API.postman_collection.json` (version compacte)

Un prompt long est aussi fourni pour regenerer/adapter automatiquement la collection:

- `postman/POSTMAN_COLLECTION_GENERATION_PROMPT.md`

### Couverture incluse

La collection couvre au minimum:

- Inscription (`POST /register`)
- Connexion (`POST /login`)
- Verification utilisateur courant (`GET /me`)
- CRUD Profil (Create/Read/Update + suppression via detach competence)
- CRUD Offres (Create/Read/Update/Delete)
- Candidature a une offre
- Changement de statut d'une candidature
- Cas d'erreur obligatoires: `401`, `403`, `422`

### Import et execution

1. Ouvrir Postman
2. Importer `postman/Laravel JWT Recruitment API.postman_collection.json`
3. Verifier la variable `baseUrl` (defaut: `http://127.0.0.1:8000/api`)
4. Demarrer l'API Laravel (`php artisan serve`)
5. Lancer les requetes dans l'ordre des dossiers:
    - `01 - Auth`
    - `02 - Profil (Candidat)`
    - `03 - Offres`
    - `04 - Candidatures & Statut`
    - `05 - Offre Delete (CRUD completion)`

La collection utilise des scripts Postman pour sauvegarder automatiquement tokens et IDs dans les variables de collection.

## Recapitulatif des Routes API

Authentification:

- `POST /api/register`
- `POST /api/login`
- `GET /api/me` (auth JWT)
- `POST /api/logout` (auth JWT)

Profil (role candidat):

- `POST /api/profil`
- `GET /api/profil`
- `PUT /api/profil`
- `POST /api/profil/competences`
- `DELETE /api/profil/competences/{competence}`

Offres:

- `GET /api/offres` (public, filtre `localisation`, `type`, pagination 10, tri desc)
- `GET /api/offres/{offre}` (public)
- `POST /api/offres` (role recruteur)
- `PUT /api/offres/{offre}` (role recruteur, proprietaire)
- `DELETE /api/offres/{offre}` (role recruteur, proprietaire)

Candidatures:

- `POST /api/offres/{offre}/candidater` (role candidat)
- `GET /api/mes-candidatures` (role candidat)
- `GET /api/offres/{offre}/candidatures` (role recruteur, proprietaire)
- `PATCH /api/candidatures/{candidature}/statut` (role recruteur, proprietaire)

Administration:

- `GET /api/admin/users` (role admin)
- `DELETE /api/admin/users/{user}` (role admin)
- `PATCH /api/admin/offres/{offre}` (role admin)
