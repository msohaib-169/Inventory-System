<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cut_piece_stock_items', function (Blueprint $table) {
            $table->id();
            $table->string('design_number')->nullable();
            $table->string('product_type')->nullable();
            $table->decimal('quantity_available', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cut_piece_stock_items');
    }
};
