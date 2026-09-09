<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierProfile extends Model
{
    use HasFactory;

    protected $table = 'supplier_profiles';
    protected $guarded = [];

    protected $casts = [
        'total_purchases' => 'float',
        'total_paid' => 'float',
        'current_dues' => 'float',
    ];
}
