<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RawMaterialStock extends Model
{
    use HasFactory;

    protected $table = 'raw_material_stocks';
    protected $guarded = [];

    protected $casts = [
        'quantity_in_stock' => 'float',
        'reorder_level' => 'float',
        'cost_per_unit' => 'float',
        'total_purchased_qty' => 'float',
        'total_cost' => 'float',
        'amount_paid' => 'float',
    ];
}
