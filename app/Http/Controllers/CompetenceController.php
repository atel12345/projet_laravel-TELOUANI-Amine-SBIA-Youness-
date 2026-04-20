<?php

namespace App\Http\Controllers;

use App\Models\Competence;
use Illuminate\Http\JsonResponse;

class CompetenceController extends Controller
{
    public function index(): JsonResponse
    {
        $competences = Competence::query()
            ->select(['id', 'nom', 'categorie'])
            ->orderBy('nom')
            ->get();

        return response()->json($competences);
    }
}
