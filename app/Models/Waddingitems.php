<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Waddingitems extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'gsm' => 'integer',
        'rate_per_kg' => 'float',
        'available_kg' => 'float',
        'total_purchased_kg' => 'float',
        'used_kg' => 'float',
        'single_quilt_spec_kg' => 'float',
        'double_quilt_spec_kg' => 'float',
        'gadda_spec_kg' => 'float',
        'single_quilt_fabric_meters' => 'float',
        'double_quilt_fabric_meters' => 'float',
        'gadda_fabric_meters' => 'float',
        'fabric_rate_per_meter' => 'float',
        'total_cost' => 'float',
        'amount_paid' => 'float',
    ];
}
