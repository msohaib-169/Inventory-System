<?php

namespace App\Http\Controllers;

use App\Models\RawMaterialStock;
use Illuminate\Http\Request;

class RawMaterialStockController extends Controller
{
    public function index()
    {
        $items = RawMaterialStock::all();
        return response()->json($items->map(function ($i) {
            return [
                'id' => (string)$i->id,
                'name' => $i->name ?? '',
                'category' => $i->category ?? 'other',
                'subCategory' => $i->sub_category,
                'customCategoryName' => $i->custom_category_name,
                'designCardFor' => $i->design_card_for,
                'cardDesigns' => $i->card_designs ? json_decode($i->card_designs, true) : null,
                'bagType' => $i->bag_type,
                'quantityInStock' => (float)$i->quantity_in_stock,
                'unit' => $i->unit ?? 'pcs',
                'reorderLevel' => (float)$i->reorder_level,
                'costPerUnit' => (float)$i->cost_per_unit,
                'supplierName' => $i->supplier_name,
                'supplierAddress' => $i->supplier_address,
                'lotNumber' => $i->lot_number,
                'totalPurchasedQty' => $i->total_purchased_qty !== null ? (float)$i->total_purchased_qty : null,
                'totalCost' => $i->total_cost !== null ? (float)$i->total_cost : null,
                'amountPaid' => $i->amount_paid !== null ? (float)$i->amount_paid : null,
                'paymentStatus' => $i->payment_status,
                'paymentNotes' => $i->payment_notes,
                'notes' => $i->notes,
            ];
        }));
    }

    public function sync(Request $request)
    {
        $itemsData = $request->input('rawMaterials', []);

        $incomingIds = array_filter(array_column($itemsData, 'id'), function($id) {
            return is_numeric($id);
        });
        RawMaterialStock::whereNotIn('id', $incomingIds)->delete();

        foreach ($itemsData as $data) {
            $id = isset($data['id']) && is_numeric($data['id']) ? $data['id'] : null;
            $cardDesigns = isset($data['cardDesigns']) && is_array($data['cardDesigns']) ? json_encode($data['cardDesigns']) : (isset($data['cardDesigns']) ? $data['cardDesigns'] : null);
            RawMaterialStock::updateOrCreate(
                ['id' => $id],
                [
                    'name' => $data['name'] ?? '',
                    'category' => $data['category'] ?? 'other',
                    'sub_category' => $data['subCategory'] ?? null,
                    'custom_category_name' => $data['customCategoryName'] ?? null,
                    'design_card_for' => $data['designCardFor'] ?? null,
                    'card_designs' => $cardDesigns,
                    'bag_type' => $data['bagType'] ?? null,
                    'quantity_in_stock' => $data['quantityInStock'] ?? 0,
                    'unit' => $data['unit'] ?? 'pcs',
                    'reorder_level' => $data['reorderLevel'] ?? 0,
                    'cost_per_unit' => $data['costPerUnit'] ?? 0,
                    'supplier_name' => $data['supplierName'] ?? null,
                    'supplier_address' => $data['supplierAddress'] ?? null,
                    'lot_number' => $data['lotNumber'] ?? null,
                    'total_purchased_qty' => $data['totalPurchasedQty'] ?? null,
                    'total_cost' => $data['totalCost'] ?? null,
                    'amount_paid' => $data['amountPaid'] ?? null,
                    'payment_status' => $data['paymentStatus'] ?? null,
                    'payment_notes' => $data['paymentNotes'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]
            );
        }

        return $this->index();
    }
}
