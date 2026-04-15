<?php

namespace App\Http\Controllers;

use App\Models\Offre;
use App\Models\Candidature;
use Illuminate\Http\Request;

class CandidatureController extends Controller
{
    public function postuler(Request $request, Offre $offre)
    {
        $profil = auth()->user()->profil;

        if (!$profil) {
            return response()->json(['error' => 'You need a profil to apply'], 422);
        }

        $already = Candidature::where('offre_id', $offre->id)
            ->where('profil_id', $profil->id)
            ->exists();

        if ($already) {
            return response()->json(['error' => 'Already applied'], 422);
        }

        $data = $request->validate([
            'message' => 'nullable|string',
        ]);

        $candidature = Candidature::create([
            'offre_id' => $offre->id,
            'profil_id' => $profil->id,
            'message' => $data['message'] ?? null,
            'statut' => 'en_attente',
        ]);

        return response()->json($candidature, 201);
    }

    public function mesCandidatures()
    {
        $profil = auth()->user()->profil;

        return response()->json(
            $profil->candidatures()->with('offre')->get()
        );
    }

    public function candidaturesRecues(Offre $offre)
    {
        if ($offre->user_id !== auth()->id()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json(
            $offre->candidatures()->with('profil')->get()
        );
    }

    public function updateStatut(Request $request, Candidature $candidature)
    {
        if ($candidature->offre->user_id !== auth()->id()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'statut' => 'required|in:en_attente,acceptee,refusee',
        ]);

        $candidature->update($data);

        return response()->json($candidature);
    }
}