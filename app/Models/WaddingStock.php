<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaddingStock extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'total_purchased_kg' => 'float',
        'used_kg' => 'float',
        'available_kg' => 'float',
        'single_quilt_spec_kg' => 'float',
        'double_quilt_spec_kg' => 'float',
    ];
}
