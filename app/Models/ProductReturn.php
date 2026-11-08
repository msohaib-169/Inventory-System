<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductReturn extends Model
{
    protected $table = 'product_returns';

    protected $fillable = [
        'invoice_id',
        'invoice_item_id',
        'party_name',
        'product_id',
        'product_name',
        'design_number',
        'quantity',
        'date',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'float',
        'date' => 'date:Y-m-d',
    ];

    public function invoiceItem()
    {
        return $this->belongsTo(InvoicesItems::class, 'invoice_item_id');
    }
}