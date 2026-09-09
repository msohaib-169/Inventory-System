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
        Schema::create('supplier_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('company_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->string('category')->default('general');
            $table->decimal('total_purchases', 12, 2)->default(0);
            $table->decimal('total_paid', 12, 2)->default(0);
            $table->decimal('current_dues', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->string('created_at_date')->nullable();
            $table->timestamps();
        });

        Schema::create('supplier_bills', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_name')->nullable();
            $table->string('supplier_phone')->nullable();
            $table->text('supplier_address')->nullable();
            $table->string('category')->default('general');
            $table->string('bill_number')->nullable();
            $table->string('date')->nullable();
            $table->string('due_date')->nullable();
            $table->string('item_description')->nullable();
            $table->decimal('quantity', 12, 2)->nullable();
            $table->string('unit')->nullable();
            $table->decimal('rate_per_unit', 12, 2)->nullable();
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('balance_due', 12, 2)->default(0);
            $table->string('payment_status')->default('Unpaid');
            $table->text('payment_notes')->nullable();
            $table->string('source_type')->nullable();
            $table->string('source_id')->nullable();
            $table->timestamps();
        });

        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_name')->nullable();
            $table->string('bill_id')->nullable();
            $table->string('bill_number')->nullable();
            $table->string('date')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('payment_method')->default('Cash');
            $table->string('reference_no')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_payments');
        Schema::dropIfExists('supplier_bills');
        Schema::dropIfExists('supplier_profiles');
    }
};
