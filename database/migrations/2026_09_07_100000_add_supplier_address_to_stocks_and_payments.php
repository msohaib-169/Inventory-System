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
        if (Schema::hasTable('fabric_lots') && !Schema::hasColumn('fabric_lots', 'supplier_address')) {
            Schema::table('fabric_lots', function (Blueprint $table) {
                $table->text('supplier_address')->nullable()->after('supplier_name');
            });
        }

        if (Schema::hasTable('raw_material_stocks') && !Schema::hasColumn('raw_material_stocks', 'supplier_address')) {
            Schema::table('raw_material_stocks', function (Blueprint $table) {
                $table->text('supplier_address')->nullable()->after('supplier_name');
            });
        }

        if (Schema::hasTable('waddingitems') && !Schema::hasColumn('waddingitems', 'supplier_address')) {
            Schema::table('waddingitems', function (Blueprint $table) {
                $table->text('supplier_address')->nullable()->after('supplier_name');
            });
        }

        if (Schema::hasTable('supplier_payments') && !Schema::hasColumn('supplier_payments', 'supplier_address')) {
            Schema::table('supplier_payments', function (Blueprint $table) {
                $table->text('supplier_address')->nullable()->after('supplier_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('fabric_lots') && Schema::hasColumn('fabric_lots', 'supplier_address')) {
            Schema::table('fabric_lots', function (Blueprint $table) {
                $table->dropColumn('supplier_address');
            });
        }

        if (Schema::hasTable('raw_material_stocks') && Schema::hasColumn('raw_material_stocks', 'supplier_address')) {
            Schema::table('raw_material_stocks', function (Blueprint $table) {
                $table->dropColumn('supplier_address');
            });
        }

        if (Schema::hasTable('waddingitems') && Schema::hasColumn('waddingitems', 'supplier_address')) {
            Schema::table('waddingitems', function (Blueprint $table) {
                $table->dropColumn('supplier_address');
            });
        }

        if (Schema::hasTable('supplier_payments') && Schema::hasColumn('supplier_payments', 'supplier_address')) {
            Schema::table('supplier_payments', function (Blueprint $table) {
                $table->dropColumn('supplier_address');
            });
        }
    }
};
