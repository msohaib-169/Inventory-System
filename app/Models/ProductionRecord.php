<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionRecord extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'quantity_produced' => 'float',
        'wadding_used_kg' => 'float',
        'stiffeners_used' => 'float',
        'polybags_used' => 'float',
        'cards_used' => 'float',
        'quilt_bags_used' => 'float',
        'comforter_bags_used' => 'float',
    ];
}
