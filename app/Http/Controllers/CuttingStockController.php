<?php

namespace App\Http\Controllers;

use App\Models\CuttingStock;
use App\Models\CutPieceStockItem;
use Illuminate\Http\Request;

class CuttingStockController extends Controller
{
    public function indexRecords()
    {
        $records = CuttingStock::all();
        return response()->json($records->map(function ($r) {
            return [
                'id' => (string)$r->id,
                'date' => $r->date ?? '',
                'lotId' => $r->lot_id ?? '',
                'lotNumber' => $r->lot_number ?? '',
                'designNumber' => $r->design_number ?? '',
                'productType' => $r->product_type ?? 'Bedsheet',
                'frontMetersPerPiece' => (float)$r->front_meters_per_piece,
                'reverseMetersPerPiece' => (float)$r->reverse_meters_per_piece,
                'quantityCut' => (float)$r->quantity_cut,
                'totalFrontMetersUsed' => (float)$r->total_front_meters_used,
                'totalReverseMetersUsed' => (float)$r->total_reverse_meters_used,
                'totalMetersUsed' => (float)$r->total_meters_used,
                'waddingItemId' => $r->wadding_item_id ?? null,
                'waddingLotNumber' => $r->wadding_lot_number ?? null,
                'waddingTypeName' => $r->wadding_type_name ?? null,
                'waddingKgPerPiece' => $r->wadding_kg_per_piece !== null ? (float)$r->wadding_kg_per_piece : 0,
                'waddingUsedKg' => $r->wadding_used_kg !== null ? (float)$r->wadding_used_kg : null,
                'notes' => $r->notes,
            ];
        }));
    }

    public function indexCutPieces()
    {
        $pieces = CutPieceStockItem::all();
        return response()->json($pieces->map(function ($p) {
            return [
                'id' => (string)$p->id,
                'designNumber' => $p->design_number ?? '',
                'productType' => $p->product_type ?? '',
                'quantityAvailable' => (float)$p->quantity_available,
            ];
        }));
    }

    public function sync(Request $request)
    {
        $recordsData = $request->input('cuttingRecords', []);
        $piecesData = $request->input('cutPiecesStock', []);

        // Sync cutting records
        $recordIncomingIds = array_filter(array_column($recordsData, 'id'), function($id) {
            return is_numeric($id);
        });
        CuttingStock::whereNotIn('id', $recordIncomingIds)->delete();

        foreach ($recordsData as $data) {
            $id = isset($data['id']) && is_numeric($data['id']) ? $data['id'] : null;
            CuttingStock::updateOrCreate(
                ['id' => $id],
                [
                    'date' => $data['date'] ?? '',
                    'lot_id' => $data['lotId'] ?? '',
                    'lot_number' => $data['lotNumber'] ?? '',
                    'design_number' => $data['designNumber'] ?? '',
                    'product_type' => $data['productType'] ?? 'Bedsheet',
                    'front_meters_per_piece' => $data['frontMetersPerPiece'] ?? 0,
                    'reverse_meters_per_piece' => $data['reverseMetersPerPiece'] ?? 0,
                    'quantity_cut' => $data['quantityCut'] ?? 0,
                    'total_front_meters_used' => $data['totalFrontMetersUsed'] ?? 0,
                    'total_reverse_meters_used' => $data['totalReverseMetersUsed'] ?? 0,
                    'total_meters_used' => $data['totalMetersUsed'] ?? 0,
                    'wadding_item_id' => $data['waddingItemId'] ?? null,
                    'wadding_lot_number' => $data['waddingLotNumber'] ?? null,
                    'wadding_type_name' => $data['waddingTypeName'] ?? null,
                    'wadding_kg_per_piece' => $data['waddingKgPerPiece'] ?? 0,
                    'wadding_used_kg' => $data['waddingUsedKg'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]
            );
        }

        // Sync cut pieces
        $pieceIncomingIds = array_filter(array_column($piecesData, 'id'), function($id) {
            return is_numeric($id);
        });
        CutPieceStockItem::whereNotIn('id', $pieceIncomingIds)->delete();

        foreach ($piecesData as $pData) {
            $id = isset($pData['id']) && is_numeric($pData['id']) ? $pData['id'] : null;
            CutPieceStockItem::updateOrCreate(
                ['id' => $id],
                [
                    'design_number' => $pData['designNumber'] ?? '',
                    'product_type' => $pData['productType'] ?? '',
                    'quantity_available' => $pData['quantityAvailable'] ?? 0,
                ]
            );
        }

        return response()->json([
            'cuttingRecords' => $this->indexRecords()->getData(),
            'cutPiecesStock' => $this->indexCutPieces()->getData(),
        ]);
    }
}
