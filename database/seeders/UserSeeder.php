<?php

namespace Database\Seeders;

use App\Models\Competence;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->admin()->count(2)->create();

        User::factory()->recruteur()->count(5)->create();

        User::factory()->count(10)->create()->each(function ($user) {
            $profil = $user->profil()->create([
                'titre' => fake()->jobTitle(),
                'bio' => fake()->paragraph(),
                'localisation' => fake()->city(),
                'disponible' => true,
            ]);

            $competences = Competence::inRandomOrder()->take(rand(2, 3))->get();
            foreach ($competences as $competence) {
                $profil->competences()->attach($competence->id, [
                    'niveau' => fake()->randomElement(['débutant', 'intermédiaire', 'expert']),
                ]);
            }
        });
    }
}