<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class OffreFactory extends Factory
{
    public function definition(): array
    {
        $offers = [
            [
                'titre' => 'Développeur Laravel',
                'description' => 'Nous recherchons un développeur Laravel pour construire des API propres, sécurisées et maintenables.',
            ],
            [
                'titre' => 'Responsable RH',
                'description' => 'Poste orienté recrutement, gestion des candidatures et coordination avec les recruteurs.',
            ],
            [
                'titre' => 'Designer UI/UX',
                'description' => 'Création d’interfaces modernes, lisibles et adaptées aux usages mobile et desktop.',
            ],
            [
                'titre' => 'Chef de projet digital',
                'description' => 'Pilotage des livrables, suivi des équipes et coordination avec les parties prenantes.',
            ],
            [
                'titre' => 'Intégrateur frontend',
                'description' => 'Intégration fidèle des maquettes et amélioration de l’expérience utilisateur.',
            ],
            [
                'titre' => 'Administrateur système',
                'description' => 'Maintenance des environnements, supervision et support technique des équipes.',
            ],
            [
                'titre' => 'Infirmier',
                'description' => 'Prise en charge des patients, suivi des soins et collaboration avec l’équipe médicale.',
            ],
            [
                'titre' => 'Professeur des écoles',
                'description' => 'Animation des cours, accompagnement des élèves et préparation des séquences pédagogiques.',
            ],
            [
                'titre' => 'Comptable',
                'description' => 'Suivi des factures, rapprochements bancaires et préparation des états financiers.',
            ],
            [
                'titre' => 'Conducteur de travaux',
                'description' => 'Coordination des chantiers, suivi des équipes et respect des délais de livraison.',
            ],
            [
                'titre' => 'Chef de cuisine',
                'description' => 'Organisation de la brigade, élaboration des menus et garantie de la qualité des plats.',
            ],
            [
                'titre' => 'Magasinier',
                'description' => 'Réception des marchandises, gestion des stocks et préparation des expéditions.',
            ],
            [
                'titre' => 'Agent d’accueil',
                'description' => 'Accueil des visiteurs, orientation du public et gestion des demandes courantes.',
            ],
            [
                'titre' => 'Auxiliaire de vie',
                'description' => 'Accompagnement des personnes au quotidien et maintien d’un cadre de vie rassurant.',
            ],
            [
                'titre' => 'Mécanicien automobile',
                'description' => 'Diagnostic des pannes, entretien des véhicules et réparations mécaniques.',
            ],
            [
                'titre' => 'Vendeur en magasin',
                'description' => 'Conseil client, mise en rayon et suivi des ventes en point de vente.',
            ],
            [
                'titre' => 'Assistant administratif',
                'description' => 'Gestion des dossiers, traitement des courriers et support administratif quotidien.',
            ],
        ];

        $cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Rennes', 'Lille', 'Bordeaux', 'Grenoble', 'Strasbourg', 'Nice', 'Caen'];

        $offer = fake()->randomElement($offers);

        return [
            'titre' => $offer['titre'],
            'description' => $offer['description'],
            'localisation' => fake()->randomElement($cities),
            'type' => fake()->randomElement(['CDI', 'CDD', 'stage']),
            'actif' => true,
        ];
    }
}