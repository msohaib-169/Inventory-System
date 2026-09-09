<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FabricDesign extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'front_meters' => 'float',
        'reverse_meters' => 'float',
        'total_meters' => 'float',
    ];

    public function fabricLot()
    {
        return $this->belongsTo(FabricLot::class, 'fabric_lot_id');
    }
}
