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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->nullable();
            $table->string('party_id')->nullable();
            $table->string('party_name')->nullable();
            $table->text('party_address')->nullable();
            $table->string('party_phone')->nullable();
            $table->string('date')->nullable();
            $table->string('due_date')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_rate_percent', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('balance_due', 12, 2)->default(0);
            $table->string('status')->nullable();
            $table->boolean('has_loose_fabric')->default(false);
            $table->decimal('total_loose_fabric_meters', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->string('currency_code')->nullable();
            $table->string('currency_symbol')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
