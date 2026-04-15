<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CompetenceFactory extends Factory
{
    public function definition(): array
    {
        $competences = [
            ['nom' => 'PHP', 'categorie' => 'Backend'],
            ['nom' => 'Laravel', 'categorie' => 'Backend'],
            ['nom' => 'JavaScript', 'categorie' => 'Frontend'],
            ['nom' => 'React', 'categorie' => 'Frontend'],
            ['nom' => 'MySQL', 'categorie' => 'Database'],
            ['nom' => 'Python', 'categorie' => 'Backend'],
            ['nom' => 'Docker', 'categorie' => 'DevOps'],
            ['nom' => 'Git', 'categorie' => 'DevOps'],
            ['nom' => 'Vue.js', 'categorie' => 'Frontend'],
            ['nom' => 'Node.js', 'categorie' => 'Backend'],
        ];

        $pick = fake()->unique()->randomElement($competences);

        return [
            'nom' => $pick['nom'],
            'categorie' => $pick['categorie'],
        ];
    }
}