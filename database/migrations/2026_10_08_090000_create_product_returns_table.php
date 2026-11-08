<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_returns', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->unsignedBigInteger('invoice_item_id');
            $table->string('product_id');
            $table->string('product_name');
            $table->string('design_number')->nullable();
            $table->decimal('quantity', 12, 2);
            $table->date('date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('invoice_item_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_returns');
    }
};