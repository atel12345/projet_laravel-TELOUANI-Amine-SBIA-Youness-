<?php

namespace App\Providers;

use App\Events\CandidatureDeposee;
use App\Events\StatutCandidatureMis;
use App\Listeners\LogCandidatureDeposee;
use App\Listeners\LogStatutCandidatureMis;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Event::listen(CandidatureDeposee::class, LogCandidatureDeposee::class);
        Event::listen(StatutCandidatureMis::class, LogStatutCandidatureMis::class);
    }

    public function register(): void
    {
        //
    }
}