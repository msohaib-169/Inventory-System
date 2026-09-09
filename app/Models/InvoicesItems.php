<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoicesItems extends Model
{
    use HasFactory;

    protected $table = 'invoices_items';
    protected $guarded = [];

    protected $casts = [
        'quantity' => 'float',
        'unit_price' => 'float',
        'total_price' => 'float',
        'meters' => 'float',
        'front_meters' => 'float',
        'reverse_meters' => 'float',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoices::class, 'invoice_id');
    }
}
