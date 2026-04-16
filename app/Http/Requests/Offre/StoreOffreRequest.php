<?php

namespace App\Http\Requests\Offre;

use Illuminate\Foundation\Http\FormRequest;

class StoreOffreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'localisation' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:CDI,CDD,stage'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}