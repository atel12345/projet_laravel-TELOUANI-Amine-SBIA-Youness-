<?php

namespace App\Events;

use App\Models\Candidature;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StatutCandidatureMis
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Candidature $candidature,
        public string $ancienStatut,
        public string $nouveauStatut,
    ) {
    }
}
