<?php

namespace App\Http\Controllers;

use App\Events\CandidatureDeposee;
use App\Events\StatutCandidatureMis;
use App\Http\Requests\Candidature\ApplyToOffreRequest;
use App\Http\Requests\Candidature\UpdateCandidatureStatusRequest;
use App\Models\Candidature;
use App\Models\Offre;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CandidatureController extends Controller
{
    public function candidater(ApplyToOffreRequest $request, Offre $offre): JsonResponse
    {
        if (!$offre->actif) {
            return response()->json(['message' => 'Offre not active'], 422);
        }

        $profil = Auth::user()->profil;

        if (!$profil) {
            return response()->json(['message' => 'Create profil before applying'], 422);
        }

        $exists = Candidature::where('offre_id', $offre->id)
            ->where('profil_id', $profil->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Already applied to this offer'], 422);
        }

        $candidature = Candidature::create([
            'offre_id' => $offre->id,
            'profil_id' => $profil->id,
            'message' => $request->validated()['message'] ?? null,
            'statut' => 'en_attente',
        ]);

        CandidatureDeposee::dispatch($candidature);

        return response()->json($candidature, 201);
    }

    public function mesCandidatures(): JsonResponse
    {
        $profil = Auth::user()->profil;

        if (!$profil) {
            return response()->json(['message' => 'Profil not found'], 404);
        }

        $candidatures = Candidature::with('offre')
            ->where('profil_id', $profil->id)
            ->latest()
            ->get();

        return response()->json($candidatures);
    }

    public function candidaturesOffre(Offre $offre): JsonResponse
    {
        if ($offre->user_id !== Auth::id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $candidatures = Candidature::with(['profil.user'])
            ->where('offre_id', $offre->id)
            ->latest()
            ->get();

        return response()->json($candidatures);
    }

    public function updateStatut(UpdateCandidatureStatusRequest $request, Candidature $candidature): JsonResponse
    {
        $candidature->load('offre');

        if ($candidature->offre->user_id !== Auth::id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $ancienStatut = $candidature->statut;
        $nouveauStatut = $request->validated()['statut'];

        $candidature->update([
            'statut' => $nouveauStatut,
        ]);

        StatutCandidatureMis::dispatch($candidature->fresh(), $ancienStatut, $nouveauStatut);

        return response()->json($candidature->fresh(['offre', 'profil.user']));
    }
}