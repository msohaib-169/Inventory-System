<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierBill extends Model
{
    use HasFactory;

    protected $table = 'supplier_bills';
    protected $guarded = [];

    protected $casts = [
        'quantity' => 'float',
        'rate_per_unit' => 'float',
        'total_amount' => 'float',
        'amount_paid' => 'float',
        'balance_due' => 'float',
    ];
}
