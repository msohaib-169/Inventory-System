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
use App\Models\ProductReturn;
use App\Models\SupplierBill;
use App\Models\SupplierPayment;
use App\Models\SupplierProfile;

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
        ProductReturn::query()->delete();
        InvoicesItems::query()->delete();
        Invoices::query()->delete();
        SupplierPayment::query()->delete();
        SupplierBill::query()->delete();
        SupplierProfile::query()->delete();

        return response()->json(['message' => 'System data cleared successfully']);
    }

}
