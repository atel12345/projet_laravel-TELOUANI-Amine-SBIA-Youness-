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
