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
        Schema::create('waddingitems', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->integer('gsm')->default(0);
            $table->string('supplier_name')->nullable();
            $table->string('lot_number')->nullable();
            $table->decimal('rate_per_kg', 12, 2)->nullable();
            $table->decimal('available_kg', 12, 2)->default(0);
            $table->decimal('total_purchased_kg', 12, 2)->default(0);
            $table->decimal('used_kg', 12, 2)->default(0);
            $table->decimal('single_quilt_spec_kg', 12, 2)->default(0);
            $table->decimal('double_quilt_spec_kg', 12, 2)->default(0);
            $table->decimal('gadda_spec_kg', 12, 2)->nullable();
            $table->decimal('single_quilt_fabric_meters', 12, 2)->nullable();
            $table->decimal('double_quilt_fabric_meters', 12, 2)->nullable();
            $table->decimal('gadda_fabric_meters', 12, 2)->nullable();
            $table->decimal('fabric_rate_per_meter', 12, 2)->nullable();
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
        Schema::dropIfExists('waddingitems');
    }
};
