<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin123@gmail.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('zartab123@4'),
                'email_verified_at' => now(),
            ]
        );
    }
}
