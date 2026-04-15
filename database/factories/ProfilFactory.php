<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ProfilFactory extends Factory
{
    public function definition(): array
    {
        return [
            'titre' => fake()->jobTitle(),
            'bio' => fake()->paragraph(),
            'localisation' => fake()->city(),
            'disponible' => fake()->boolean(),
        ];
    }
}