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
        Schema::create('invoices_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->string('product_id')->nullable();
            $table->string('product_name')->nullable();
            $table->string('design_number')->nullable();
            $table->decimal('quantity', 12, 2)->default(0);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2)->default(0);
            $table->string('item_type')->nullable();
            $table->string('fabric_loss_id')->nullable();
            $table->string('lot_number')->nullable();
            $table->decimal('meters', 12, 2)->nullable();
            $table->decimal('front_meters', 12, 2)->nullable();
            $table->decimal('reverse_meters', 12, 2)->nullable();
            $table->string('loose_fabric_category')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices_items');
    }
};
