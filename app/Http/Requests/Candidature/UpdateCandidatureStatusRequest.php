<?php

namespace App\Http\Requests\Candidature;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCandidatureStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statut' => ['required', 'in:en_attente,acceptee,refusee'],
        ];
    }
}