<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Parties extends Model
{
    use HasFactory;

    protected $table = 'parties';
    protected $guarded = [];

    protected $casts = [
        'total_invoiced' => 'float',
        'total_paid' => 'float',
        'current_dues' => 'float',
    ];
}
