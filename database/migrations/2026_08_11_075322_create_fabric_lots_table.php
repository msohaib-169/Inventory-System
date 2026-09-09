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
        Schema::create('fabric_lots', function (Blueprint $table) {
            $table->id();
            $table->string('lot_number')->nullable();
            $table->string('supplier_name')->nullable();
            $table->string('date_received')->nullable();
            $table->decimal('rate_per_meter', 12, 2)->nullable();
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
        Schema::dropIfExists('fabric_lots');
    }
};
