<?php

namespace App\Http\Controllers;

use App\Models\WaddingStock;
use App\Models\Waddingitems;
use Illuminate\Http\Request;

class WaddingStockController extends Controller
{
    public function index()
    {
        $stock = WaddingStock::first();
        if (!$stock) {
            $stock = WaddingStock::create([
                'total_purchased_kg' => 0,
                'used_kg' => 0,
                'available_kg' => 0,
                'single_quilt_spec_kg' => 0.8,
                'double_quilt_spec_kg' => 1.4,
            ]);
        }

        $items = Waddingitems::all()->map(function ($i) {
            return [
                'id' => (string)$i->id,
                'type' => $i->type ?? '',
                'gsm' => (int)$i->gsm,
                'supplierName' => $i->supplier_name,
                'supplierAddress' => $i->supplier_address,
                'lotNumber' => $i->lot_number,
                'ratePerKg' => $i->rate_per_kg !== null ? (float)$i->rate_per_kg : null,
                'availableKg' => (float)$i->available_kg,
                'totalPurchasedKg' => (float)$i->total_purchased_kg,
                'usedKg' => (float)$i->used_kg,
                'singleQuiltSpecKg' => (float)$i->single_quilt_spec_kg,
                'doubleQuiltSpecKg' => (float)$i->double_quilt_spec_kg,
                'gaddaSpecKg' => $i->gadda_spec_kg !== null ? (float)$i->gadda_spec_kg : null,
                'singleQuiltFabricMeters' => $i->single_quilt_fabric_meters !== null ? (float)$i->single_quilt_fabric_meters : null,
                'doubleQuiltFabricMeters' => $i->double_quilt_fabric_meters !== null ? (float)$i->double_quilt_fabric_meters : null,
                'gaddaFabricMeters' => $i->gadda_fabric_meters !== null ? (float)$i->gadda_fabric_meters : null,
                'fabricRatePerMeter' => $i->fabric_rate_per_meter !== null ? (float)$i->fabric_rate_per_meter : null,
                'totalCost' => $i->total_cost !== null ? (float)$i->total_cost : null,
                'amountPaid' => $i->amount_paid !== null ? (float)$i->amount_paid : null,
                'paymentStatus' => $i->payment_status,
                'paymentNotes' => $i->payment_notes,
                'notes' => $i->notes,
            ];
        });

        return response()->json([
            'totalPurchasedKg' => (float)$stock->total_purchased_kg,
            'usedKg' => (float)$stock->used_kg,
            'availableKg' => (float)$stock->available_kg,
            'singleQuiltSpecKg' => (float)$stock->single_quilt_spec_kg,
            'doubleQuiltSpecKg' => (float)$stock->double_quilt_spec_kg,
            'items' => $items,
        ]);
    }

    public function sync(Request $request)
    {
        $wadding = $request->input('wadding', []);

        $stock = WaddingStock::first();
        if (!$stock) {
            $stock = new WaddingStock();
        }
        $stock->total_purchased_kg = $wadding['totalPurchasedKg'] ?? 0;
        $stock->used_kg = $wadding['usedKg'] ?? 0;
        $stock->available_kg = $wadding['availableKg'] ?? 0;
        $stock->single_quilt_spec_kg = $wadding['singleQuiltSpecKg'] ?? 0.8;
        $stock->double_quilt_spec_kg = $wadding['doubleQuiltSpecKg'] ?? 1.4;
        $stock->save();

        // Sync Wadding items
        $itemsData = $wadding['items'] ?? [];
        $itemIncomingIds = array_filter(array_column($itemsData, 'id'), function($id) {
            return is_numeric($id);
        });
        Waddingitems::whereNotIn('id', $itemIncomingIds)->delete();

        foreach ($itemsData as $iData) {
            $id = isset($iData['id']) && is_numeric($iData['id']) ? $iData['id'] : null;
            Waddingitems::updateOrCreate(
                ['id' => $id],
                [
                    'type' => $iData['type'] ?? '',
                    'gsm' => $iData['gsm'] ?? 0,
                    'supplier_name' => $iData['supplierName'] ?? null,
                    'supplier_address' => $iData['supplierAddress'] ?? null,
                    'lot_number' => $iData['lotNumber'] ?? null,
                    'rate_per_kg' => $iData['ratePerKg'] ?? null,
                    'available_kg' => $iData['availableKg'] ?? 0,
                    'total_purchased_kg' => $iData['totalPurchasedKg'] ?? 0,
                    'used_kg' => $iData['usedKg'] ?? 0,
                    'single_quilt_spec_kg' => $iData['singleQuiltSpecKg'] ?? 0,
                    'double_quilt_spec_kg' => $iData['doubleQuiltSpecKg'] ?? 0,
                    'gadda_spec_kg' => $iData['gaddaSpecKg'] ?? null,
                    'single_quilt_fabric_meters' => $iData['singleQuiltFabricMeters'] ?? null,
                    'double_quilt_fabric_meters' => $iData['doubleQuiltFabricMeters'] ?? null,
                    'gadda_fabric_meters' => $iData['gaddaFabricMeters'] ?? null,
                    'fabric_rate_per_meter' => $iData['fabricRatePerMeter'] ?? null,
                    'total_cost' => $iData['totalCost'] ?? null,
                    'amount_paid' => $iData['amountPaid'] ?? null,
                    'payment_status' => $iData['paymentStatus'] ?? null,
                    'payment_notes' => $iData['paymentNotes'] ?? null,
                    'notes' => $iData['notes'] ?? null,
                ]
            );
        }

        return $this->index();
    }
}
