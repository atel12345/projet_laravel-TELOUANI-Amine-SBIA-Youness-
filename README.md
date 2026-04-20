# Projet Laravel - Plateforme de Recrutement

## Description

Ce projet est avant tout un backend Laravel pour une plateforme type mini-LinkedIn.
Nous avons aussi construit une interface frontend React/Vite dans le projet, mais elle reste secondaire par rapport au backend et sert surtout a faciliter l'utilisation de l'API.

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
- Front add-on: React ^19, Vite ^8, TailwindCSS ^4

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

Si vous ne voulez utiliser que le backend, cette etape n'est pas obligatoire. Elle sert uniquement pour l'interface React ajoutee au projet.

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

8. Compiler le front si vous voulez l'utiliser:

```bash
npm run build
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

Frontend React/Vite en mode developpement:

```bash
npm run dev
```

## Resolution Erreur React Preamble

Si vous voyez l'erreur `@vitejs/plugin-react can't detect preamble`, les protections suivantes sont deja en place:
Le frontend existe bien dans le projet, mais il reste volontairement plus simple et moins central que le backend.

- `@viteReactRefresh` est injecte dans la Blade avant `@vite`, ce qui installe correctement le preamble React.
- Nettoyage automatique de l'etat de dev avant chaque `npm run dev:full`.

Procedure recommandee:

1. Arreter tous les serveurs Node/PHP en cours.
2. Executer `npm run dev:full`.
3. Ouvrir uniquement `http://127.0.0.1:8000`.

## Backend Implementation

Cette section resume le travail realise sur le backend selon les specifications du projet.

### Partie 1: Modelisation & Base de Donnees

Implementation complete de la base de donnees relationnelle:

- **Migrations**: Creation de toutes les tables conformes au Modele Logique de Donnees (MLD):
  - `users` avec colonne `role` enum (candidat, recruteur, admin)
  - `profils` lies aux candidats
  - `competences` et pivot `profil_competence` avec niveau (debutant, intermediaire, expert)
  - `offres` publiees par les recruteurs
  - `candidatures` representant les applications aux offres

- **Modeles Eloquent**: Implementation des relations:
  - `User` hasMany Offres (pour recruteurs) et hasOne Profil (pour candidats)
  - `Profil` belongsTo User et belongsToMany Competences
  - `Offre` belongsTo User et hasMany Candidatures
  - `Candidature` belongsTo Offre et belongsTo Profil

- **Factories**: Generateurs de donnees pour tests:
  - `UserFactory` avec roles aleatoires
  - `OffreFactory` avec titres et descriptions varies
  - `ProfilFactory`, `CompetenceFactory`, `CandidatureFactory`

- **Seeders**: Population initiale de la base de donnees:
  - 2 administrateurs
  - 5 recruteurs avec 2 a 3 offres chacun (13 offres differentes couvrant roles IT et non-IT)
  - 10 candidats avec profils complets et competences
  - Toutes les offres contiennent des descriptions francaises et sont localisees en villes francaises

### Partie 2: Authentification & Autorisation

Implementation complete du systeme d'authentification et d'autorisation:

- **JWT (JSON Web Tokens)**: Integration de `tymon/jwt-auth` ^2.3
  - Configuration JWT dans `config/jwt.php`
  - Middleware `auth:api` pour proteger les routes
  - Tokens generes a l'inscription et connexion

- **Autorisation par Roles**: Middleware personnalise verifiant les roles:
  - Routes candidat: accessibles uniquement par role `candidat`
  - Routes recruteur: accessibles uniquement par role `recruteur`
  - Routes admin: accessibles uniquement par role `admin`
  - Ownership rules: Recruteur ne peut modifier/supprimer que ses propres offres, candidat ne voit que ses propres candidatures
  - Reponse 403 en cas d'acces non autorise

### Partie 3: Endpoints de l'API

Implementation complete de tous les endpoints specifies:

- **Authentification** (publique):
  - `POST /api/register` - Inscription avec role
  - `POST /api/login` - Connexion et generation JWT
  - `GET /api/me` - Utilisateur courant (JWT)
  - `POST /api/logout` - Deconnexion (JWT)

- **Gestion Profil** (role candidat):
  - `POST /api/profil` - Creation du profil (une seule fois)
  - `GET /api/profil` - Consultation du profil personnel
  - `PUT /api/profil` - Modification du profil
  - `POST /api/profil/competences` - Ajout de competences avec niveau
  - `DELETE /api/profil/competences/{competence}` - Retrait de competences

- **Gestion Offres** (tous):
  - `GET /api/offres` - Liste des offres actives avec pagination (10 par page), tri par date, filtres localisation et type
  - `GET /api/offres/{offre}` - Detail d'une offre
  - `POST /api/offres` - Creation (role recruteur)
  - `PUT /api/offres/{offre}` - Modification (role recruteur, proprietaire)
  - `DELETE /api/offres/{offre}` - Suppression (role recruteur, proprietaire)

- **Candidatures** (tous):
  - `POST /api/offres/{offre}/candidater` - Postulation a une offre (role candidat)
  - `GET /api/mes-candidatures` - Ses propres candidatures (role candidat)
  - `GET /api/offres/{offre}/candidatures` - Candidatures recues (role recruteur, proprietaire)
  - `PATCH /api/candidatures/{candidature}/statut` - Changement de statut (role recruteur, proprietaire)

- **Administration** (role admin):
  - `GET /api/admin/users` - Liste de tous les utilisateurs
  - `DELETE /api/admin/users/{user}` - Suppression d'un compte
  - `PATCH /api/admin/offres/{offre}` - Activation/desactivation des offres

### Partie 4: Events & Listeners

Implementation du systeme d'Events & Listeners pour le decouplage logique:

- **CandidatureDeposee**: Event declenche quand un candidat postule a une offre
  - Listener enregistre l'evenement dans `storage/logs/candidatures.log`
  - Informations loggees: date, nom du candidat, titre de l'offre

- **StatutCandidatureMis**: Event declenche quand un recruteur change le statut d'une candidature
  - Listener enregistre dans le meme fichier de log
  - Informations loggees: ancien statut, nouveau statut, date

Ces events permettent un suivi complet des actions critiques independamment du controller, facilitant audits et monitoring.

## Frontend Implementation (Bonus)

En addition aux specifications du projet backend, nous avons developpe une interface React/Vite complete pour faciliter l'interaction avec l'API. Cette partie reste volontairement secondaire et n'est pas obligatoire pour l'evaluation.

### Architecture et Technologies

- **Framework**: React 19 avec hooks (useState, useEffect, useRef, useMemo)
- **Build Tool**: Vite 8 avec HMR (Hot Module Replacement)
- **Styling**: TailwindCSS 4 avec theme personnalise (mode sombre)
- **Authentification**: JWT tokens stockes en localStorage
- **Communication API**: Fetch avec header Authorization automatique

### Fonctionnalites Implementees

**Authentification (public)**:
- Page de connexion avec gestion d'erreurs
- Page d'inscription avec selection de role (candidat/recruteur/admin)
- Persistence JWT automatique entre sessions
- Deconnexion et nettoyage du localStorage

**Candidat**:
- Creation et modification de profil (titre, bio, localisation, disponibilite)
- Gestion des competences (ajout/suppression avec niveaux: debutant/intermediaire/expert)
- Consultation des offres actives avec filtres (localisation, type)
- Selection et consultation detaillee d'une offre
- Postulation aux offres avec message personnalise
- Suivi de ses candidatures et leurs statuts

**Recruteur**:
- Creation d'offres avec titre, description, localisation, type (CDI/CDD/stage)
- Liste de ses offres avec possibilite de modification/suppression
- Consultation des candidatures recues pour chaque offre
- Changement du statut des candidatures (en_attente/acceptee/refusee)
- Visualisation du profil et des competences des candidats

**Admin**:
- Liste de tous les utilisateurs avec details (role, email, date creation)
- Suppression de comptes utilisateurs
- Activation/desactivation des offres (toggle)
- Acces complet aux donnees de la plateforme

### Choix Techniques

- **Fetch Wrapper**: Fonction helper qui gere automatiquement les headers JWT et Content-Type
- **Role-based Rendering**: Interface adaptee selon le role de l'utilisateur connecte
- **Visual Feedback**: Indicateurs visuels pour confirmation d'actions (selection offre, changement statut)
- **Error Handling**: Gestion des reponses d'erreur API (401, 403, 422) avec messages explicites
- **State Management**: Utilisation exclusive de React hooks pour gestion etat simple et maintenable

Cette interface frontend offre une experience utilisateur complete tout en restant basee sur l'API backend strictement definie dans les specifications.

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
