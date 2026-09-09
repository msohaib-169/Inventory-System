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
        Schema::create('fabric_designs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fabric_lot_id')->nullable();
            $table->string('design_number')->nullable();
            $table->string('design_name')->nullable();
            $table->decimal('front_meters', 12, 2)->default(0);
            $table->decimal('reverse_meters', 12, 2)->default(0);
            $table->string('fabric_type')->nullable();
            $table->decimal('total_meters', 12, 2)->nullable();
            $table->string('custom_fabric_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fabric_designs');
    }
};
