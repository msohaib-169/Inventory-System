<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinishedRecord extends Model
{
    use HasFactory;

    protected $table = 'finished_records';
    protected $guarded = [];

    protected $casts = [
        'cost_price' => 'float',
        'selling_price' => 'float',
        'stock_quantity' => 'float',
        'reorder_level' => 'float',
    ];
}
