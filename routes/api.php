<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfilController;
use App\Http\Controllers\OffreController;
use App\Http\Controllers\CandidatureController;
use App\Http\Controllers\AdminController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/offres', [OffreController::class, 'index']);
    Route::get('/offres/{offre}', [OffreController::class, 'show']);
});

Route::middleware(['auth:api', 'role:candidat'])->group(function () {
    Route::post('/profil', [ProfilController::class, 'store']);
    Route::get('/profil', [ProfilController::class, 'show']);
    Route::put('/profil', [ProfilController::class, 'update']);
    Route::post('/profil/competences', [ProfilController::class, 'addCompetence']);
    Route::delete('/profil/competences/{competence}', [ProfilController::class, 'removeCompetence']);
    Route::post('/offres/{offre}/candidater', [CandidatureController::class, 'postuler']);
    Route::get('/mes-candidatures', [CandidatureController::class, 'mesCandidatures']);
});

Route::middleware(['auth:api', 'role:recruteur'])->group(function () {
    Route::post('/offres', [OffreController::class, 'store']);
    Route::put('/offres/{offre}', [OffreController::class, 'update']);
    Route::delete('/offres/{offre}', [OffreController::class, 'destroy']);
    Route::get('/offres/{offre}/candidatures', [CandidatureController::class, 'candidaturesRecues']);
    Route::patch('/candidatures/{candidature}/statut', [CandidatureController::class, 'updateStatut']);
});

Route::middleware(['auth:api', 'role:admin'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser']);
    Route::patch('/admin/offres/{offre}', [AdminController::class, 'toggleOffre']);
});