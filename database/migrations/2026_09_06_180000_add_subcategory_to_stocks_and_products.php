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
        Schema::table('raw_material_stocks', function (Blueprint $table) {
            if (!Schema::hasColumn('raw_material_stocks', 'sub_category')) {
                $table->string('sub_category')->nullable()->after('category');
            }
            if (!Schema::hasColumn('raw_material_stocks', 'card_designs')) {
                $table->text('card_designs')->nullable()->after('design_card_for');
            }
        });

        Schema::table('finished_records', function (Blueprint $table) {
            if (!Schema::hasColumn('finished_records', 'sub_category')) {
                $table->string('sub_category')->nullable()->after('category');
            }
        });

        Schema::table('production_records', function (Blueprint $table) {
            if (!Schema::hasColumn('production_records', 'product_sub_category')) {
                $table->string('product_sub_category')->nullable()->after('product_category');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('raw_material_stocks', function (Blueprint $table) {
            $table->dropColumn(['sub_category', 'card_designs']);
        });

        Schema::table('finished_records', function (Blueprint $table) {
            $table->dropColumn(['sub_category']);
        });

        Schema::table('production_records', function (Blueprint $table) {
            $table->dropColumn(['product_sub_category']);
        });
    }
};
