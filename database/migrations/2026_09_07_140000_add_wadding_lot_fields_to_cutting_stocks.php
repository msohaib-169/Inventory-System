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
        Schema::table('cutting_stocks', function (Blueprint $table) {
            $table->string('wadding_item_id')->nullable()->after('total_meters_used');
            $table->string('wadding_lot_number')->nullable()->after('wadding_item_id');
            $table->string('wadding_type_name')->nullable()->after('wadding_lot_number');
            $table->decimal('wadding_kg_per_piece', 12, 2)->default(0)->after('wadding_type_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cutting_stocks', function (Blueprint $table) {
            $table->dropColumn([
                'wadding_item_id',
                'wadding_lot_number',
                'wadding_type_name',
                'wadding_kg_per_piece',
            ]);
        });
    }
};
