<?php

namespace App\Http\Requests\Candidature;

use Illuminate\Foundation\Http\FormRequest;

class ApplyToOffreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => ['nullable', 'string'],
        ];
    }
}