<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->redirectGuestsTo(function (Request $request) {
            return null;
        });

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (TokenInvalidException $e, Request $request) {
            return response()->json(['error' => 'Token invalide'], 401);
        });

        $exceptions->render(function (TokenExpiredException $e, Request $request) {
            return response()->json(['error' => 'Token expire'], 401);
        });

        $exceptions->render(function (JWTException $e, Request $request) {
            return response()->json(['error' => 'Token absent ou invalide'], 401);
        });

        $exceptions->render(function (UnauthorizedHttpException $e, Request $request) {
            return response()->json(['error' => 'Unauthorized'], 401);
        });
    })->create();
