<?php

namespace App\Listeners;

use App\Events\CandidatureDeposee;
use Illuminate\Support\Facades\Log;

class LogCandidatureDeposee
{
    public function handle(CandidatureDeposee $event): void
    {
        $event->candidature->loadMissing(['profil.user', 'offre']);

        $candidatNom = $event->candidature->profil?->user?->name ?? 'unknown';
        $offreTitre = $event->candidature->offre?->titre ?? 'unknown';

        Log::build([
            'driver' => 'single',
            'path' => storage_path('logs/candidatures.log'),
        ])->info('Candidature deposee', [
            'datetime' => now()->toDateTimeString(),
            'candidat' => $candidatNom,
            'offre' => $offreTitre,
            'candidature_id' => $event->candidature->id,
        ]);
    }
}
