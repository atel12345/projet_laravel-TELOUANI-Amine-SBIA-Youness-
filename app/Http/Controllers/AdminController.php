<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\ToggleOffreStatusRequest;
use App\Models\Offre;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    public function users(): JsonResponse
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'created_at'])
            ->latest()
            ->get();

        return response()->json($users);
    }

    public function deleteUser(User $user): JsonResponse
    {
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot delete an admin user'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    public function toggleOffre(ToggleOffreStatusRequest $request, Offre $offre): JsonResponse
    {
        $offre->update([
            'actif' => $request->validated()['actif'],
        ]);

        return response()->json([
            'message' => 'Offre status updated',
            'offre' => $offre,
        ]);
    }
}