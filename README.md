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

Backend Laravel:

```bash
php artisan serve
```

Build front (optionnel):

```bash
npm run dev
```

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
