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

Le backend a ete developpe en conformite stricte avec les specifications du projet, couvrant modele de donnees, authentification JWT, endpoints API, et systeme d'events pour le logging.

### Partie 1: Modelisation & Base de Donnees

La base de donnees repose sur 5 entites principales avec relations Eloquent complexes.

**Migrations et Schema**:

Les migrations Laravel creent toutes les tables selon le MLD fourni. Exemple pour la table des utilisateurs:

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('password');
    $table->enum('role', ['candidat', 'recruteur', 'admin']);
    $table->timestamps();
});
```

La table `profils` pour les candidats:

```php
Schema::create('profils', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->string('titre');
    $table->text('bio');
    $table->string('localisation');
    $table->boolean('disponible')->default(true);
    $table->timestamps();
});
```

Pivot table pour la relation many-to-many entre profils et competences:

```php
Schema::create('profil_competence', function (Blueprint $table) {
    $table->foreignId('profil_id')->constrained();
    $table->foreignId('competence_id')->constrained();
    $table->enum('niveau', ['debutant', 'intermediaire', 'expert']);
});
```

Table des offres publiees par recruteurs:

```php
Schema::create('offres', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained(); // recruteur proprietaire
    $table->string('titre');
    $table->text('description');
    $table->string('localisation');
    $table->enum('type', ['CDI', 'CDD', 'stage']);
    $table->boolean('actif')->default(true);
    $table->timestamps();
});
```

Table des candidatures (applications):

```php
Schema::create('candidatures', function (Blueprint $table) {
    $table->id();
    $table->foreignId('offre_id')->constrained();
    $table->foreignId('profil_id')->constrained();
    $table->text('message');
    $table->enum('statut', ['en_attente', 'acceptee', 'refusee'])->default('en_attente');
    $table->timestamps();
});
```

**Modeles Eloquent et Relations**:

Modele `User` avec relations pour les differents roles:

```php
class User extends Authenticatable {
    public function offres() { // Pour recruteurs
        return $this->hasMany(Offre::class);
    }
    
    public function profil() { // Pour candidats
        return $this->hasOne(Profil::class);
    }
}
```

Modele `Profil` avec relation many-to-many vers competences:

```php
class Profil extends Model {
    public function user() {
        return $this->belongsTo(User::class);
    }
    
    public function competences() {
        return $this->belongsToMany(Competence::class, 'profil_competence')
                    ->withPivot('niveau');
    }
    
    public function candidatures() {
        return $this->hasMany(Candidature::class);
    }
}
```

Modele `Offre` avec ses candidatures:

```php
class Offre extends Model {
    public function user() {
        return $this->belongsTo(User::class); // Recruteur proprietaire
    }
    
    public function candidatures() {
        return $this->hasMany(Candidature::class);
    }
}
```

**Factories et Seeders**:

Factory pour generer des offres avec donnees variees:

```php
class OffreFactory extends Factory {
    public function definition(): array {
        $jobs = [
            'Senior Developper PHP', 'Infirmier', 'Professeur de Mathematiques',
            'Comptable', 'Manager de Projet', 'Architecte Logiciel',
            'Community Manager', 'Electricien', 'Chef de Cuisine',
            'Conducteur de Bus', 'Psychologue', 'Webdesigner', 'DevOps Engineer'
        ];
        
        return [
            'titre' => $this->faker->randomElement($jobs),
            'description' => $this->faker->paragraph(5),
            'localisation' => $this->faker->randomElement(['Paris', 'Lyon', 'Marseille', 'Toulouse']),
            'type' => $this->faker->randomElement(['CDI', 'CDD', 'stage']),
            'actif' => true,
        ];
    }
}
```

Seeder pour initialiser la base de donnees:

```php
class DatabaseSeeder extends Seeder {
    public function run(): void {
        Competence::factory(15)->create();
        User::factory(2)->recruteur()->create();  // 2 admins
        
        User::factory(5)->recruteur()->create()->each(function ($user) {
            $user->offres()->createMany(
                Offre::factory(rand(2, 3))->make()->toArray()
            );
        });
        
        User::factory(10)->candidat()->create()->each(function ($user) {
            $profil = Profil::factory()->create(['user_id' => $user->id]);
            $profil->competences()->attach(
                Competence::inRandomOrder()->limit(rand(2, 5))->pluck('id')
            );
        });
    }
}
```

### Partie 2: Authentification & Autorisation

**JWT Setup**:

Configuration dans `config/jwt.php` apres installation de `tymon/jwt-auth`:

```php
'secret' => env('JWT_SECRET'),
'ttl' => 60, // Token valide 60 minutes
'refresh_ttl' => 20160, // Refresh token 2 semaines
```

Middleware `auth:api` applique sur les routes protegees:

```php
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
```

**Authentification Utilisateur**:

Controller `AuthController` gerant inscription/login:

```php
class AuthController extends Controller {
    public function register(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|in:candidat,recruteur,admin'
        ]);
        
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role']
        ]);
        
        $token = Auth::login($user);
        return response()->json(['token' => $token]);
    }
    
    public function login(Request $request) {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);
        
        if (!$token = Auth::attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }
        
        return response()->json(['token' => $token]);
    }
}
```

**Middleware de Role**:

Middleware personnalise `RoleMiddleware` verifiant les roles:

```php
class RoleMiddleware {
    public function handle($request, Closure $next, ...$roles) {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        
        if (!in_array(Auth::user()->role, $roles)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        
        return $next($request);
    }
}
```

Utilisation dans les routes:

```php
Route::post('/offres', [OffreController::class, 'store'])
    ->middleware('auth:api', 'role:recruteur');

Route::post('/offres/{offre}/candidater', [CandidatureController::class, 'store'])
    ->middleware('auth:api', 'role:candidat');
```

### Partie 3: Endpoints de l'API

**Endpoints d'Authentification** (publiques):

```
POST   /api/register
POST   /api/login
GET    /api/me           (auth:api)
POST   /api/logout       (auth:api)
```

**Gestion du Profil** (role candidat):

```
POST   /api/profil                      (candidat) - Creer profil
GET    /api/profil                      (candidat) - Consulter son profil
PUT    /api/profil                      (candidat) - Modifier profil
POST   /api/profil/competences          (candidat) - Ajouter competence
DELETE /api/profil/competences/{id}     (candidat) - Retirer competence
```

Exemple de creation de profil:

```php
public function store(Request $request) {
    $validated = $request->validate([
        'titre' => 'required|string',
        'bio' => 'required|string',
        'localisation' => 'required|string',
    ]);
    
    $profil = Profil::firstOrCreate(
        ['user_id' => Auth::id()],
        $validated
    );
    
    return response()->json($profil, 201);
}
```

**Gestion des Offres** (tous les roles):

```
GET    /api/offres                      (public) - Liste pagination 10, tri desc, filtre localisation/type
GET    /api/offres/{offre}              (public) - Detail offre
POST   /api/offres                      (recruteur) - Creer offre
PUT    /api/offres/{offre}              (recruteur/proprietaire) - Modifier
DELETE /api/offres/{offre}              (recruteur/proprietaire) - Supprimer
```

Methode listing avec pagination et filtres:

```php
public function index(Request $request) {
    $query = Offre::where('actif', true)
        ->orderBy('created_at', 'desc');
    
    if ($request->has('localisation')) {
        $query->where('localisation', $request->localisation);
    }
    if ($request->has('type')) {
        $query->where('type', $request->type);
    }
    
    return $query->paginate(10);
}
```

**Gestion des Candidatures**:

```
POST   /api/offres/{offre}/candidater   (candidat) - Postuler
GET    /api/mes-candidatures            (candidat) - Ses candidatures
GET    /api/offres/{offre}/candidatures (recruteur/proprietaire) - Candidatures recues
PATCH  /api/candidatures/{id}/statut    (recruteur/proprietaire) - Changer statut
```

Exemple de postulation:

```php
public function candidater(Offre $offre, Request $request) {
    $profil = Auth::user()->profil;
    
    $candidature = Candidature::create([
        'offre_id' => $offre->id,
        'profil_id' => $profil->id,
        'message' => $request->message,
        'statut' => 'en_attente'
    ]);
    
    event(new CandidatureDeposee($candidature));
    
    return response()->json($candidature, 201);
}
```

**Administration**:

```
GET    /api/admin/users                 (admin) - Liste utilisateurs
DELETE /api/admin/users/{user}          (admin) - Supprimer user
PATCH  /api/admin/offres/{offre}        (admin) - Toggle actif offre
```

### Partie 4: Events & Listeners

Systeme d'events decouplant la logique applicative pour logging et audits.

**Event CandidatureDeposee**:

```php
class CandidatureDeposee {
    public $candidature;
    
    public function __construct(Candidature $candidature) {
        $this->candidature = $candidature;
    }
}
```

**Listener pour CandidatureDeposee**:

```php
class LogCandidatureDeposee implements ShouldQueue {
    public function handle(CandidatureDeposee $event) {
        $candidature = $event->candidature;
        $candidat = $candidature->profil->user->name;
        $offre = $candidature->offre->titre;
        
        Log::channel('candidatures')->info(
            "Candidature deposee - Candidat: $candidat - Offre: $offre - Date: " . now()
        );
    }
}
```

**Event StatutCandidatureMis**:

```php
class StatutCandidatureMis {
    public $candidature;
    public $ancienStatut;
    
    public function __construct(Candidature $candidature, $ancienStatut) {
        $this->candidature = $candidature;
        $this->ancienStatut = $ancienStatut;
    }
}
```

**Listener pour StatutCandidatureMis**:

```php
class LogStatutCandidatureMis implements ShouldQueue {
    public function handle(StatutCandidatureMis $event) {
        $ancien = $event->ancienStatut;
        $nouveau = $event->candidature->statut;
        
        Log::channel('candidatures')->info(
            "Statut change - Ancien: $ancien -> Nouveau: $nouveau - Date: " . now()
        );
    }
}
```

Registration dans `EventServiceProvider`:

```php
protected $listen = [
    CandidatureDeposee::class => [
        LogCandidatureDeposee::class,
    ],
    StatutCandidatureMis::class => [
        LogStatutCandidatureMis::class,
    ],
];
```

## Frontend Implementation (Bonus)

En addition aux specifications du projet backend, nous avons developpe une interface React/Vite complete pour faciliter l'interaction avec l'API. Cette partie reste volontairement secondaire et n'est pas obligatoire pour l'evaluation.

### Architecture et Technologies

- **Framework**: React 19 avec hooks (useState, useEffect, useRef, useMemo)
- **Build Tool**: Vite 8 avec HMR (Hot Module Replacement)
- **Styling**: TailwindCSS 4 avec theme personnalise (mode sombre)
- **Authentification**: JWT tokens stockes en localStorage
- **Communication API**: Fetch avec header Authorization automatique

### Fonctionnalites Implementees

**Authentification**:
- Connexion/Inscription avec selection de role
- Persistence JWT automatique entre sessions
- Deconnexion

**Candidat**:
- Creation et modification de profil
- Gestion des competences (ajout/suppression avec niveaux)
- Consultation et filtrage des offres
- Postulation aux offres avec message
- Suivi des candidatures

**Recruteur**:
- Creation et gestion des offres
- Consultation des candidatures recues
- Changement de statut des candidatures

**Admin**:
- Gestion des utilisateurs
- Activation/desactivation des offres

### Code Principal

**Request Helper avec gestion JWT**:

```javascript
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  
  const response = await fetch(`http://127.0.0.1:8000/api${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return response.json();
};
```

**Authentification**:

```javascript
const handleLogin = async (email, password) => {
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  localStorage.setItem('token', data.token);
  setUser(data.user);
};

const handleLogout = () => {
  localStorage.removeItem('token');
  setUser(null);
};
```

**Selection et postulation a une offre** (role candidat):

```javascript
const handleSelectOffer = (offre) => {
  setSelectedOffer(offre);
  scrollToApplicationForm();
};

const handleApply = async (message) => {
  const candidature = await request(`/offres/${selectedOffer.id}/candidater`, {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  
  setApplications([...applications, candidature]);
};
```

**Gestion des offres** (role recruteur):

```javascript
const handleCreateOffer = async (formData) => {
  const offre = await request('/offres', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  
  setOffres([...offres, offre]);
};

const handleDeleteOffer = async (offreId) => {
  await request(`/offres/${offreId}`, { method: 'DELETE' });
  setOffres(offres.filter(o => o.id !== offreId));
};
```

**Admin panel** (role admin):

```javascript
const toggleOfferStatus = async (offreId, currentStatus) => {
  const updated = await request(`/admin/offres/${offreId}`, {
    method: 'PATCH',
    body: JSON.stringify({ actif: !currentStatus })
  });
  
  setOffres(offres.map(o => o.id === offreId ? updated : o));
};

const deleteUser = async (userId) => {
  await request(`/admin/users/${userId}`, { method: 'DELETE' });
  setUsers(users.filter(u => u.id !== userId));
};
```

L'interface adapte l'affichage selon le role de l'utilisateur et fournit une experience utilisateur complete tout en restant basee sur l'API backend strictement definie dans les specifications.

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
