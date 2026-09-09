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
        if (Schema::hasTable('payment_transactions')) {
            Schema::table('payment_transactions', function (Blueprint $table) {
                if (Schema::hasColumn('payment_transactions', 'currency_code')) {
                    $table->dropColumn('currency_code');
                }
                if (Schema::hasColumn('payment_transactions', 'currency_symbol')) {
                    $table->dropColumn('currency_symbol');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('payment_transactions')) {
            Schema::table('payment_transactions', function (Blueprint $table) {
                if (!Schema::hasColumn('payment_transactions', 'currency_code')) {
                    $table->string('currency_code')->nullable();
                }
                if (!Schema::hasColumn('payment_transactions', 'currency_symbol')) {
                    $table->string('currency_symbol')->nullable();
                }
            });
        }
    }
};
