<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Offre;

class AdminController extends Controller
{
    public function users()
    {
        return response()->json(User::all());
    }

    public function deleteUser(User $user)
    {
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    public function toggleOffre(Offre $offre)
    {
        $offre->update(['actif' => !$offre->actif]);

        return response()->json($offre);
    }
}