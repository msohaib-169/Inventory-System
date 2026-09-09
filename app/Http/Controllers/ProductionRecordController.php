<?php

namespace App\Http\Controllers;

use App\Models\ProductionRecord;
use Illuminate\Http\Request;

class ProductionRecordController extends Controller
{
    public function index()
    {
        $records = ProductionRecord::all();
        return response()->json($records->map(function ($r) {
            return [
                'id' => (string)$r->id,
                'date' => $r->date ?? '',
                'productId' => $r->product_id ?? '',
                'productName' => $r->product_name ?? '',
                'productCategory' => $r->product_category ?? '',
                'productSubCategory' => $r->product_sub_category,
                'quantityProduced' => (float)$r->quantity_produced,
                'designNumber' => $r->design_number ?? '',
                'waddingUsedKg' => (float)$r->wadding_used_kg,
                'stiffenersUsed' => (float)$r->stiffeners_used,
                'polybagsUsed' => (float)$r->polybags_used,
                'cardsUsed' => (float)$r->cards_used,
                'quiltBagsUsed' => (float)$r->quilt_bags_used,
                'comforterBagsUsed' => (float)$r->comforter_bags_used,
                'operatorName' => $r->operator_name,
                'notes' => $r->notes,
            ];
        }));
    }

    public function sync(Request $request)
    {
        $recordsData = $request->input('productionRecords', []);

        $incomingIds = array_filter(array_column($recordsData, 'id'), function($id) {
            return is_numeric($id);
        });
        ProductionRecord::whereNotIn('id', $incomingIds)->delete();

        foreach ($recordsData as $data) {
            $id = isset($data['id']) && is_numeric($data['id']) ? $data['id'] : null;
            ProductionRecord::updateOrCreate(
                ['id' => $id],
                [
                    'date' => $data['date'] ?? '',
                    'product_id' => $data['productId'] ?? '',
                    'product_name' => $data['productName'] ?? '',
                    'product_category' => $data['productCategory'] ?? '',
                    'product_sub_category' => $data['productSubCategory'] ?? null,
                    'quantity_produced' => $data['quantityProduced'] ?? 0,
                    'design_number' => $data['designNumber'] ?? '',
                    'wadding_used_kg' => $data['waddingUsedKg'] ?? 0,
                    'stiffeners_used' => $data['stiffenersUsed'] ?? 0,
                    'polybags_used' => $data['polybagsUsed'] ?? 0,
                    'cards_used' => $data['cardsUsed'] ?? 0,
                    'quilt_bags_used' => $data['quiltBagsUsed'] ?? 0,
                    'comforter_bags_used' => $data['comforterBagsUsed'] ?? 0,
                    'operator_name' => $data['operatorName'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]
            );
        }

        return $this->index();
    }
}
