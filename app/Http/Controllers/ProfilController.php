<?php

namespace App\Http\Controllers;

use App\Http\Requests\Profil\AttachCompetenceRequest;
use App\Http\Requests\Profil\StoreProfilRequest;
use App\Http\Requests\Profil\UpdateProfilRequest;
use App\Models\Profil;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ProfilController extends Controller
{
    public function store(StoreProfilRequest $request): JsonResponse
    {
        $user = Auth::user();

        if ($user->profil) {
            return response()->json(['message' => 'Profil already exists'], 422);
        }

        $profil = Profil::create([
            ...$request->validated(),
            'user_id' => $user->id,
        ]);

        return response()->json($profil, 201);
    }

    public function show(): JsonResponse
    {
        $profil = Auth::user()->profil;

        if (!$profil) {
            return response()->json(['message' => 'Profil not found'], 404);
        }

        $profil->load('competences');

        return response()->json($profil);
    }

    public function update(UpdateProfilRequest $request): JsonResponse
    {
        $profil = Auth::user()->profil;

        if (!$profil) {
            return response()->json(['message' => 'Profil not found'], 404);
        }

        $profil->update($request->validated());

        return response()->json($profil->fresh('competences'));
    }

    public function attachCompetence(AttachCompetenceRequest $request): JsonResponse
    {
        $profil = Auth::user()->profil;

        if (!$profil) {
            return response()->json(['message' => 'Create profil first'], 422);
        }

        $data = $request->validated();

        $profil->competences()->syncWithoutDetaching([
            $data['competence_id'] => ['niveau' => $data['niveau']],
        ]);

        return response()->json([
            'message' => 'Competence attached',
            'profil' => $profil->fresh('competences'),
        ]);
    }

    public function detachCompetence(int $competence): JsonResponse
    {
        $profil = Auth::user()->profil;

        if (!$profil) {
            return response()->json(['message' => 'Profil not found'], 404);
        }

        $profil->competences()->detach($competence);

        return response()->json([
            'message' => 'Competence detached',
            'profil' => $profil->fresh('competences'),
        ]);
    }
}
