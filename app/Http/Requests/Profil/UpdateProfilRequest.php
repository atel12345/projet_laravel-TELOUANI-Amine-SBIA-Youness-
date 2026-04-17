<?php

namespace App\Http\Requests\Profil;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre' => ['sometimes', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'localisation' => ['nullable', 'string', 'max:255'],
            'disponible' => ['sometimes', 'boolean'],
        ];
    }
}