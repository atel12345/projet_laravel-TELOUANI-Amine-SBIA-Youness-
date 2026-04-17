<?php

namespace App\Http\Requests\Profil;

use Illuminate\Foundation\Http\FormRequest;

class AttachCompetenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'competence_id' => ['required', 'integer', 'exists:competences,id'],
            'niveau' => ['required', 'in:débutant,intermédiaire,expert'],
        ];
    }
}
