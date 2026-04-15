<?php

namespace Database\Seeders;

use App\Models\Offre;
use App\Models\Profil;
use App\Models\Candidature;
use Illuminate\Database\Seeder;

class CandidatureSeeder extends Seeder
{
    public function run(): void
    {
        $profils = Profil::all();
        $offres = Offre::all();

        foreach ($profils as $profil) {
            $offre = $offres->random();
            Candidature::create([
                'profil_id' => $profil->id,
                'offre_id' => $offre->id,
                'message' => fake()->paragraph(),
                'statut' => 'en_attente',
            ]);
        }
    }
}