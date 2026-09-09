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
        Schema::create('raw_material_stocks', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('category')->nullable();
            $table->string('custom_category_name')->nullable();
            $table->string('design_card_for')->nullable();
            $table->string('bag_type')->nullable();
            $table->decimal('quantity_in_stock', 12, 2)->default(0);
            $table->string('unit')->default('pcs');
            $table->decimal('reorder_level', 12, 2)->default(0);
            $table->decimal('cost_per_unit', 12, 2)->default(0);
            $table->string('supplier_name')->nullable();
            $table->string('lot_number')->nullable();
            $table->decimal('total_purchased_qty', 12, 2)->nullable();
            $table->decimal('total_cost', 12, 2)->nullable();
            $table->decimal('amount_paid', 12, 2)->nullable();
            $table->string('payment_status')->nullable();
            $table->text('payment_notes')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('raw_material_stocks');
    }
};
