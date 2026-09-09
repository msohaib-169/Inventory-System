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
        Schema::dropIfExists('quilt_batch_entries');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('quilt_batch_entries')) {
            Schema::create('quilt_batch_entries', function (Blueprint $table) {
                $table->id();
                $table->string('date')->nullable();
                $table->string('wadding_item_id')->nullable();
                $table->string('wadding_type_name')->nullable();
                $table->integer('wadding_gsm')->default(0);
                $table->string('wadding_lot_number')->nullable();
                $table->string('supplier_name')->nullable();
                $table->string('fabric_lot_id')->nullable();
                $table->string('fabric_lot_number')->nullable();
                $table->decimal('single_quilts_produced', 12, 2)->default(0);
                $table->decimal('double_quilts_produced', 12, 2)->default(0);
                $table->decimal('single_quilt_spec_kg', 12, 2)->default(0);
                $table->decimal('double_quilt_spec_kg', 12, 2)->default(0);
                $table->decimal('single_quilt_fabric_meters', 12, 2)->default(0);
                $table->decimal('double_quilt_fabric_meters', 12, 2)->default(0);
                $table->decimal('wadding_kg_used', 12, 2)->default(0);
                $table->decimal('fabric_meters_used', 12, 2)->default(0);
                $table->decimal('wadding_rate_per_kg', 12, 2)->default(0);
                $table->decimal('fabric_rate_per_meter', 12, 2)->default(0);
                $table->decimal('labor_cost_per_piece', 12, 2)->default(0);
                $table->decimal('total_wadding_cost', 12, 2)->default(0);
                $table->decimal('total_fabric_cost', 12, 2)->default(0);
                $table->decimal('total_labor_cost', 12, 2)->default(0);
                $table->decimal('total_manufacturing_cost', 12, 2)->default(0);
                $table->decimal('selling_price_single', 12, 2)->default(0);
                $table->decimal('selling_price_double', 12, 2)->default(0);
                $table->decimal('total_revenue', 12, 2)->default(0);
                $table->decimal('net_profit', 12, 2)->default(0);
                $table->decimal('profit_margin_percent', 12, 2)->default(0);
                $table->string('analysis_status')->default('Validated & Balanced');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }
};
