<?php

namespace App\Http\Controllers;

use App\Models\FabricLot;
use App\Models\FabricDesign;
use Illuminate\Http\Request;

class FabricLotController extends Controller
{
    public function index()
    {
        $lots = FabricLot::with('designs')->get();
        return response()->json($lots->map(function ($lot) {
            return [
                'id' => (string)$lot->id,
                'lotNumber' => $lot->lot_number ?? '',
                'supplierName' => $lot->supplier_name ?? '',
                'supplierAddress' => $lot->supplier_address ?? '',
                'dateReceived' => $lot->date_received ?? '',
                'ratePerMeter' => $lot->rate_per_meter !== null ? (float)$lot->rate_per_meter : null,
                'totalCost' => $lot->total_cost !== null ? (float)$lot->total_cost : null,
                'amountPaid' => $lot->amount_paid !== null ? (float)$lot->amount_paid : null,
                'paymentStatus' => $lot->payment_status,
                'paymentNotes' => $lot->payment_notes,
                'notes' => $lot->notes,
                'designs' => $lot->designs->map(function ($d) {
                    return [
                        'id' => (string)$d->id,
                        'designNumber' => $d->design_number ?? '',
                        'designName' => $d->design_name ?? '',
                        'frontMeters' => (float)$d->front_meters,
                        'reverseMeters' => (float)$d->reverse_meters,
                        'fabricType' => $d->fabric_type,
                        'totalMeters' => $d->total_meters !== null ? (float)$d->total_meters : null,
                        'customFabricName' => $d->custom_fabric_name,
                    ];
                }),
            ];
        }));
    }

    public function sync(Request $request)
    {
        $lotsData = $request->input('lots', []);

        // Delete lots not present in sync payload
        $incomingIds = array_filter(array_column($lotsData, 'id'), function($id) {
            return is_numeric($id);
        });
        FabricLot::whereNotIn('id', $incomingIds)->delete();

        foreach ($lotsData as $data) {
            $id = isset($data['id']) && is_numeric($data['id']) ? $data['id'] : null;
            $lot = FabricLot::updateOrCreate(
                ['id' => $id],
                [
                    'lot_number' => $data['lotNumber'] ?? '',
                    'supplier_name' => $data['supplierName'] ?? '',
                    'supplier_address' => $data['supplierAddress'] ?? null,
                    'date_received' => $data['dateReceived'] ?? '',
                    'rate_per_meter' => $data['ratePerMeter'] ?? null,
                    'total_cost' => $data['totalCost'] ?? null,
                    'amount_paid' => $data['amountPaid'] ?? null,
                    'payment_status' => $data['paymentStatus'] ?? null,
                    'payment_notes' => $data['paymentNotes'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]
            );

            // Sync designs
            $designDataList = $data['designs'] ?? [];
            $designIncomingIds = array_filter(array_column($designDataList, 'id'), function($did) {
                return is_numeric($did);
            });
            FabricDesign::where('fabric_lot_id', $lot->id)->whereNotIn('id', $designIncomingIds)->delete();

            foreach ($designDataList as $dData) {
                $did = isset($dData['id']) && is_numeric($dData['id']) ? $dData['id'] : null;
                FabricDesign::updateOrCreate(
                    ['id' => $did, 'fabric_lot_id' => $lot->id],
                    [
                        'fabric_lot_id' => $lot->id,
                        'design_number' => $dData['designNumber'] ?? '',
                        'design_name' => $dData['designName'] ?? '',
                        'front_meters' => $dData['frontMeters'] ?? 0,
                        'reverse_meters' => $dData['reverseMeters'] ?? 0,
                        'fabric_type' => $dData['fabricType'] ?? null,
                        'total_meters' => $dData['totalMeters'] ?? null,
                        'custom_fabric_name' => $dData['customFabricName'] ?? null,
                    ]
                );
            }
        }

        return $this->index();
    }
}
