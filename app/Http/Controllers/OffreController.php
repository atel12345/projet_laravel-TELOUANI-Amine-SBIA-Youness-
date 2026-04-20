<?php

namespace App\Http\Controllers;

use App\Http\Requests\Offre\StoreOffreRequest;
use App\Http\Requests\Offre\UpdateOffreRequest;
use App\Models\Offre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;


class OffreController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Offre::query()
            ->where('actif', true)
            ->when($request->filled('localisation'), fn($q) => $q->where('localisation', $request->string('localisation')))
            ->when($request->filled('type'), fn($q) => $q->where('type', $request->string('type')))
            ->orderByDesc('created_at');

        $offres = $query->paginate(10);

        return response()->json($offres);
    }

    public function show(Offre $offre): JsonResponse
    {
        if (!$offre->actif) {
            return response()->json(['message' => 'Offre not found'], 404);
        }

        return response()->json($offre);
    }

    public function store(StoreOffreRequest $request): JsonResponse
    {
        $offre = Offre::create([
            ...$request->validated(),
            'user_id' => Auth::id(),
        ]);

        return response()->json($offre, 201);
    }

    public function mesOffres(): JsonResponse
    {
        $offres = Offre::query()
            ->where('user_id', Auth::id())
            ->withCount('candidatures')
            ->latest()
            ->get();

        return response()->json($offres);
    }

    public function update(UpdateOffreRequest $request, Offre $offre): JsonResponse
    {
        if ($offre->user_id !== Auth::id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $offre->update($request->validated());

        return response()->json($offre);
    }

    public function destroy(Offre $offre): JsonResponse
    {
        if ($offre->user_id !== Auth::id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $offre->delete();

        return response()->json(['message' => 'Offre deleted']);
    }
}
