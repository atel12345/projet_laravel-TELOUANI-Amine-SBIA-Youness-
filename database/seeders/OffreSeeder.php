<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class OffreSeeder extends Seeder
{
    public function run(): void
    {
        $recruteurs = User::where('role', 'recruteur')->get();

        foreach ($recruteurs as $recruteur) {
            $recruteur->offres()->createMany(
                \Database\Factories\OffreFactory::new()->count(rand(2, 3))->make()->toArray()
            );
        }
    }
}