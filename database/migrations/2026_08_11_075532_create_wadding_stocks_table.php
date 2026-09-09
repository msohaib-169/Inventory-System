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
        Schema::create('wadding_stocks', function (Blueprint $table) {
            $table->id();
            $table->decimal('total_purchased_kg', 12, 2)->default(0);
            $table->decimal('used_kg', 12, 2)->default(0);
            $table->decimal('available_kg', 12, 2)->default(0);
            $table->decimal('single_quilt_spec_kg', 12, 2)->default(0.8);
            $table->decimal('double_quilt_spec_kg', 12, 2)->default(1.4);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wadding_stocks');
    }
};
