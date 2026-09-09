<?php

namespace App\Http\Controllers;

use App\Models\FabricLot;
use App\Models\FabricDesign;
use App\Models\FabricLossRecord;
use App\Models\WaddingStock;
use App\Models\Waddingitems;
use App\Models\RawMaterialStock;
use App\Models\CuttingStock;
use App\Models\CutPieceStockItem;
use App\Models\ProductionRecord;
use App\Models\FinishedRecord;
use App\Models\Parties;
use App\Models\PaymentTransactions;
use App\Models\Invoices;
use App\Models\InvoicesItems;
use Illuminate\Http\Request;
use Database\Seeders\DatabaseSeeder;

class SystemResetController extends Controller
{
    public function clearAll()
    {
        FabricDesign::query()->delete();
        FabricLot::query()->delete();
        FabricLossRecord::query()->delete();
        Waddingitems::query()->delete();
        WaddingStock::query()->delete();
        RawMaterialStock::query()->delete();
        CuttingStock::query()->delete();
        CutPieceStockItem::query()->delete();
        ProductionRecord::query()->delete();
        FinishedRecord::query()->delete();
        Parties::query()->delete();
        PaymentTransactions::query()->delete();
        InvoicesItems::query()->delete();
        Invoices::query()->delete();

        WaddingStock::create([
            'total_purchased_kg' => 0,
            'used_kg' => 0,
            'available_kg' => 0,
            'single_quilt_spec_kg' => 0.8,
            'double_quilt_spec_kg' => 1.4,
        ]);

        return response()->json(['message' => 'System data cleared successfully']);
    }

    public function resetToDefault()
    {
        $this->clearAll();
        $seeder = new DatabaseSeeder();
        $seeder->run();

        return response()->json(['message' => 'System reset to default seed data successfully']);
    }
}
