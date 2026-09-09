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
        Schema::create('production_records', function (Blueprint $table) {
            $table->id();
            $table->string('date')->nullable();
            $table->string('product_id')->nullable();
            $table->string('product_name')->nullable();
            $table->string('product_category')->nullable();
            $table->decimal('quantity_produced', 12, 2)->default(0);
            $table->string('design_number')->nullable();
            $table->decimal('wadding_used_kg', 12, 2)->default(0);
            $table->decimal('stiffeners_used', 12, 2)->default(0);
            $table->decimal('polybags_used', 12, 2)->default(0);
            $table->decimal('cards_used', 12, 2)->default(0);
            $table->decimal('quilt_bags_used', 12, 2)->default(0);
            $table->decimal('comforter_bags_used', 12, 2)->default(0);
            $table->string('operator_name')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_records');
    }
};
