<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return view('dashboard');
    })->name('dashboard');

    Route::get('/dashboard/lots', function () {
        return view('dashboard');
    })->name('dashboard.lots');

    Route::get('/dashboard/wadding', function () {
        return view('dashboard');
    })->name('dashboard.wadding');

    Route::get('/dashboard/raw-materials', function () {
        return view('dashboard');
    })->name('dashboard.raw_materials');

    Route::get('/dashboard/cutting', function () {
        return view('dashboard');
    })->name('dashboard.cutting');

    Route::get('/dashboard/production', function () {
        return view('dashboard');
    })->name('dashboard.production');

    Route::get('/dashboard/products', function () {
        return view('dashboard');
    })->name('dashboard.products');

    Route::get('/dashboard/parties', function () {
        return view('dashboard');
    })->name('dashboard.parties');

    Route::get('/dashboard/billing', function () {
        return view('dashboard');
    })->name('dashboard.billing');

    Route::get('/dashboard/reports', function () {
        return view('dashboard');
    })->name('dashboard.reports');

    Route::get('/dashboard/{any}', function () {
        return view('dashboard');
    })->where('any', '.*');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
