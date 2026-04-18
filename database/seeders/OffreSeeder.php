<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class OffreSeeder extends Seeder
{
    public function run(): void
    {
        $recruteurs = User::where('role', 'recruteur')->get();

        $offers = [
            [
                'titre' => 'Développeur Laravel',
                'description' => 'Créer et maintenir des points d’accès API pour une application de recrutement moderne.',
                'localisation' => 'Paris',
                'type' => 'CDI',
                'actif' => true,
            ],
            [
                'titre' => 'Chargé de recrutement',
                'description' => 'Suivre les candidatures, qualifier les profils et accompagner les recruteurs.',
                'localisation' => 'Rennes',
                'type' => 'stage',
                'actif' => true,
            ],
            [
                'titre' => 'Infirmier',
                'description' => 'Assurer le suivi des soins, l’accompagnement des patients et la coordination avec l’équipe médicale.',
                'localisation' => 'Lille',
                'type' => 'CDD',
                'actif' => true,
            ],
            [
                'titre' => 'Professeur des écoles',
                'description' => 'Préparer les cours, accompagner les élèves et participer au projet pédagogique de l’établissement.',
                'localisation' => 'Toulouse',
                'type' => 'CDI',
                'actif' => true,
            ],
            [
                'titre' => 'Comptable',
                'description' => 'Gérer les écritures comptables, les rapprochements bancaires et les clôtures mensuelles.',
                'localisation' => 'Marseille',
                'type' => 'CDI',
                'actif' => true,
            ],
            [
                'titre' => 'Conducteur de travaux',
                'description' => 'Superviser les chantiers, coordonner les intervenants et garantir la qualité des travaux.',
                'localisation' => 'Nantes',
                'type' => 'CDD',
                'actif' => true,
            ],
            [
                'titre' => 'Chef de cuisine',
                'description' => 'Organiser la production en cuisine et veiller à la qualité des préparations servies.',
                'localisation' => 'Montpellier',
                'type' => 'stage',
                'actif' => true,
            ],
            [
                'titre' => 'Magasinier',
                'description' => 'Assurer la réception des marchandises, la gestion des stocks et la préparation des commandes.',
                'localisation' => 'Rennes',
                'type' => 'CDD',
                'actif' => true,
            ],
            [
                'titre' => 'Agent d’accueil',
                'description' => 'Accueillir les visiteurs, orienter le public et répondre aux demandes courantes.',
                'localisation' => 'Lyon',
                'type' => 'CDI',
                'actif' => true,
            ],
            [
                'titre' => 'Auxiliaire de vie',
                'description' => 'Accompagner les personnes au quotidien, assurer l’aide aux gestes simples et maintenir le lien social.',
                'localisation' => 'Grenoble',
                'type' => 'CDD',
                'actif' => true,
            ],
            [
                'titre' => 'Mécanicien automobile',
                'description' => 'Diagnostiquer les pannes, réaliser l’entretien courant et assurer les réparations mécaniques.',
                'localisation' => 'Strasbourg',
                'type' => 'CDI',
                'actif' => true,
            ],
            [
                'titre' => 'Vendeur en magasin',
                'description' => 'Conseiller les clients, assurer la mise en rayon et participer au suivi des ventes.',
                'localisation' => 'Nice',
                'type' => 'CDD',
                'actif' => true,
            ],
            [
                'titre' => 'Assistant administratif',
                'description' => 'Gérer les dossiers, traiter les documents et assister l’équipe dans les tâches quotidiennes.',
                'localisation' => 'Caen',
                'type' => 'stage',
                'actif' => true,
            ],
        ];

        foreach ($recruteurs as $recruteur) {
            $recruteur->offres()->delete();
            $recruteur->offres()->createMany($offers);
        }
    }
}