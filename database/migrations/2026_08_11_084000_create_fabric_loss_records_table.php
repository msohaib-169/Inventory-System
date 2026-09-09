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
        Schema::create('fabric_loss_records', function (Blueprint $table) {
            $table->id();
            $table->string('date')->nullable();
            $table->string('lot_id')->nullable();
            $table->string('lot_number')->nullable();
            $table->string('design_number')->nullable();
            $table->string('design_name')->nullable();
            $table->string('category')->nullable();
            $table->string('party_id')->nullable();
            $table->string('party_name')->nullable();
            $table->decimal('front_meters', 12, 2)->nullable();
            $table->decimal('reverse_meters', 12, 2)->nullable();
            $table->decimal('meters_lost', 12, 2)->default(0);
            $table->decimal('rate_per_meter', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('billed')->default(false);
            $table->string('invoice_id')->nullable();
            $table->string('invoice_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fabric_loss_records');
    }
};
