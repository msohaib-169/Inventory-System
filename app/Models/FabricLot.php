<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FabricLot extends Model
{
    use HasFactory;

    protected $guarded = [];
    protected $with = ['designs'];

    protected $casts = [
        'rate_per_meter' => 'float',
        'total_cost' => 'float',
        'amount_paid' => 'float',
    ];

    public function designs()
    {
        return $this->hasMany(FabricDesign::class, 'fabric_lot_id');
    }
}
