<?php

namespace App\Http\Controllers;

use App\Models\FinishedRecord;
use Illuminate\Http\Request;

class FinishedRecordController extends Controller
{
    public function index()
    {
        $products = FinishedRecord::all();
        return response()->json($products->map(function ($p) {
            return [
                'id' => (string)$p->id,
                'name' => $p->name ?? '',
                'sku' => $p->sku ?? '',
                'category' => $p->category ?? 'Bedsheet',
                'subCategory' => $p->sub_category,
                'designNumber' => $p->design_number ?? '',
                'costPrice' => (float)$p->cost_price,
                'sellingPrice' => (float)$p->selling_price,
                'stockQuantity' => (float)$p->stock_quantity,
                'reorderLevel' => (float)$p->reorder_level,
                'unit' => $p->unit ?? 'pcs',
            ];
        }));
    }

    public function sync(Request $request)
    {
        $productsData = $request->input('products', []);

        $incomingIds = array_filter(array_column($productsData, 'id'), function($id) {
            return is_numeric($id);
        });
        FinishedRecord::whereNotIn('id', $incomingIds)->delete();

        foreach ($productsData as $data) {
            $id = isset($data['id']) && is_numeric($data['id']) ? $data['id'] : null;
            FinishedRecord::updateOrCreate(
                ['id' => $id],
                [
                    'name' => $data['name'] ?? '',
                    'sku' => $data['sku'] ?? '',
                    'category' => $data['category'] ?? 'Bedsheet',
                    'sub_category' => $data['subCategory'] ?? null,
                    'design_number' => $data['designNumber'] ?? '',
                    'cost_price' => $data['costPrice'] ?? 0,
                    'selling_price' => $data['sellingPrice'] ?? 0,
                    'stock_quantity' => $data['stockQuantity'] ?? 0,
                    'reorder_level' => $data['reorderLevel'] ?? 0,
                    'unit' => $data['unit'] ?? 'pcs',
                ]
            );
        }

        return $this->index();
    }
}
