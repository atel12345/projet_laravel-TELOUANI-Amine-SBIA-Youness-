<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CandidatureFactory extends Factory
{
    public function definition(): array
    {
        return [
            'message' => fake()->paragraph(),
            'statut' => 'en_attente',
        ];
    }
}