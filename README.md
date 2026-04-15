# Projet Laravel Backend

## Prerequisites

- PHP 8.2+
- Composer
- MySQL

## Installation

1. Clone the repository.
2. Install dependencies.

	composer install

3. Create your local environment file.

	copy .env.example .env

4. Configure your local database in .env.
5. Generate app and JWT keys.

	php artisan key:generate
	php artisan jwt:secret

6. Run migrations and seeders.

	php artisan migrate:fresh --seed

7. Start the server.

	php artisan serve

## Important

- Do not commit .env
- Do not commit any real credentials
- Each teammate uses their own local .env values
