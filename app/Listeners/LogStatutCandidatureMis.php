<?php

namespace App\Listeners;

use App\Events\StatutCandidatureMis;
use Illuminate\Support\Facades\Log;

class LogStatutCandidatureMis
{
    public function handle(StatutCandidatureMis $event): void
    {
        Log::build([
            'driver' => 'single',
            'path' => storage_path('logs/candidatures.log'),
        ])->info('Statut candidature mis a jour', [
            'datetime' => now()->toDateTimeString(),
            'candidature_id' => $event->candidature->id,
            'ancien_statut' => $event->ancienStatut,
            'nouveau_statut' => $event->nouveauStatut,
        ]);
    }
}
