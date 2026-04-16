<?php

namespace App\Http\Requests\Offre;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOffreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'localisation' => ['nullable', 'string', 'max:255'],
            'type' => ['sometimes', 'in:CDI,CDD,stage'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}