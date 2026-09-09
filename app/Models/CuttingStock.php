<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CuttingStock extends Model
{
    use HasFactory;

    protected $table = 'cutting_stocks';
    protected $guarded = [];

    protected $casts = [
        'front_meters_per_piece' => 'float',
        'reverse_meters_per_piece' => 'float',
        'quantity_cut' => 'float',
        'total_front_meters_used' => 'float',
        'total_reverse_meters_used' => 'float',
        'total_meters_used' => 'float',
        'wadding_kg_per_piece' => 'float',
        'wadding_used_kg' => 'float',
    ];
}
