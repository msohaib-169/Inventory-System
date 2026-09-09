<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FabricLossRecord extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'front_meters' => 'float',
        'reverse_meters' => 'float',
        'meters_lost' => 'float',
        'rate_per_meter' => 'float',
        'billed' => 'boolean',
    ];
}
