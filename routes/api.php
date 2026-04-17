<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CandidatureController;
use App\Http\Controllers\OffreController;
use App\Http\Controllers\ProfilController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/offres', [OffreController::class, 'index']);
Route::get('/offres/{offre}', [OffreController::class, 'show']);

Route::middleware('auth:api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('role:candidat')->group(function () {
        Route::post('/profil', [ProfilController::class, 'store']);
        Route::get('/profil', [ProfilController::class, 'show']);
        Route::put('/profil', [ProfilController::class, 'update']);
        Route::post('/profil/competences', [ProfilController::class, 'attachCompetence']);
        Route::delete('/profil/competences/{competence}', [ProfilController::class, 'detachCompetence']);

        Route::post('/offres/{offre}/candidater', [CandidatureController::class, 'candidater']);
        Route::get('/mes-candidatures', [CandidatureController::class, 'mesCandidatures']);
    });

    Route::middleware('role:recruteur')->group(function () {
        Route::post('/offres', [OffreController::class, 'store']);
        Route::put('/offres/{offre}', [OffreController::class, 'update']);
        Route::delete('/offres/{offre}', [OffreController::class, 'destroy']);

        Route::get('/offres/{offre}/candidatures', [CandidatureController::class, 'candidaturesOffre']);
        Route::patch('/candidatures/{candidature}/statut', [CandidatureController::class, 'updateStatut']);
    });
});
