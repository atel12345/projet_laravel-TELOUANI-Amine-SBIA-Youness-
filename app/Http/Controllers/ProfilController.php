<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Competence;

class ProfilController extends Controller
{
    public function store(Request $request)
    {
        $user = auth()->user();

        if ($user->profil) {
            return response()->json(['error' => 'Profil already exists'], 422);
        }

        $data = $request->validate([
            'titre' => 'required|string',
            'bio' => 'nullable|string',
            'localisation' => 'nullable|string',
            'disponible' => 'boolean',
        ]);

        $profil = $user->profil()->create($data);

        return response()->json($profil, 201);
    }

    public function show()
    {
        return response()->json(auth()->user()->profil()->with('competences')->first());
    }

    public function update(Request $request)
    {
        $profil = auth()->user()->profil;

        $data = $request->validate([
            'titre' => 'sometimes|string',
            'bio' => 'nullable|string',
            'localisation' => 'nullable|string',
            'disponible' => 'boolean',
        ]);

        $profil->update($data);

        return response()->json($profil);
    }

    public function addCompetence(Request $request)
    {
        $data = $request->validate([
            'competence_id' => 'required|exists:competences,id',
            'niveau' => 'required|in:débutant,intermédiaire,expert',
        ]);

        $profil = auth()->user()->profil;

        $profil->competences()->syncWithoutDetaching([
            $data['competence_id'] => ['niveau' => $data['niveau']]
        ]);

        return response()->json(['message' => 'Competence added']);
    }

    public function removeCompetence($competence_id)
    {
        $profil = auth()->user()->profil;

        $profil->competences()->detach($competence_id);

        return response()->json(['message' => 'Competence removed']);
    }
}