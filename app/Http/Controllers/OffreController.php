<?php

namespace App\Http\Controllers;

use App\Models\Offre;
use Illuminate\Http\Request;

class OffreController extends Controller
{
    public function index(Request $request)
    {
        $query = Offre::where('actif', true)->orderBy('created_at', 'desc');

        if ($request->has('localisation')) {
            $query->where('localisation', $request->localisation);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->paginate(10));
    }

    public function show(Offre $offre)
    {
        return response()->json($offre);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'titre' => 'required|string',
            'description' => 'required|string',
            'localisation' => 'nullable|string',
            'type' => 'required|in:CDI,CDD,stage',
        ]);

        $offre = auth()->user()->offres()->create($data);

        return response()->json($offre, 201);
    }

    public function update(Request $request, Offre $offre)
    {
        if ($offre->user_id !== auth()->id()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'titre' => 'sometimes|string',
            'description' => 'sometimes|string',
            'localisation' => 'nullable|string',
            'type' => 'sometimes|in:CDI,CDD,stage',
        ]);

        $offre->update($data);

        return response()->json($offre);
    }

    public function destroy(Offre $offre)
    {
        if ($offre->user_id !== auth()->id()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $offre->delete();

        return response()->json(['message' => 'Offre deleted']);
    }
}