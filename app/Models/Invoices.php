<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoices extends Model
{
    use HasFactory;

    protected $table = 'invoices';
    protected $guarded = [];
    protected $with = ['items'];

    protected $casts = [
        'subtotal' => 'float',
        'tax_rate_percent' => 'float',
        'tax_amount' => 'float',
        'discount_amount' => 'float',
        'grand_total' => 'float',
        'amount_paid' => 'float',
        'balance_due' => 'float',
        'has_loose_fabric' => 'boolean',
        'total_loose_fabric_meters' => 'float',
    ];

    public function items()
    {
        return $this->hasMany(InvoicesItems::class, 'invoice_id');
    }
}
