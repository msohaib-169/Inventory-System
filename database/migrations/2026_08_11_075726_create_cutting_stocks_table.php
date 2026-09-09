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
        Schema::create('cutting_stocks', function (Blueprint $table) {
            $table->id();
            $table->string('date')->nullable();
            $table->string('lot_id')->nullable();
            $table->string('lot_number')->nullable();
            $table->string('design_number')->nullable();
            $table->string('product_type')->nullable();
            $table->decimal('front_meters_per_piece', 12, 2)->default(0);
            $table->decimal('reverse_meters_per_piece', 12, 2)->default(0);
            $table->decimal('quantity_cut', 12, 2)->default(0);
            $table->decimal('total_front_meters_used', 12, 2)->default(0);
            $table->decimal('total_reverse_meters_used', 12, 2)->default(0);
            $table->decimal('total_meters_used', 12, 2)->default(0);
            $table->decimal('wadding_used_kg', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cutting_stocks');
    }
};
