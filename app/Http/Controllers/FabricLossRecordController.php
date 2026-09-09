<?php

namespace App\Http\Controllers;

use App\Models\FabricLossRecord;
use Illuminate\Http\Request;

class FabricLossRecordController extends Controller
{
    public function index()
    {
        $records = FabricLossRecord::all();
        return response()->json($records->map(function ($r) {
            return [
                'id' => (string)$r->id,
                'date' => $r->date ?? '',
                'lotId' => $r->lot_id,
                'lotNumber' => $r->lot_number ?? '',
                'designNumber' => $r->design_number,
                'designName' => $r->design_name,
                'category' => $r->category ?? 'Loss Fabric',
                'partyId' => $r->party_id,
                'partyName' => $r->party_name,
                'frontMeters' => $r->front_meters !== null ? (float)$r->front_meters : null,
                'reverseMeters' => $r->reverse_meters !== null ? (float)$r->reverse_meters : null,
                'metersLost' => (float)$r->meters_lost,
                'ratePerMeter' => $r->rate_per_meter !== null ? (float)$r->rate_per_meter : null,
                'notes' => $r->notes,
                'billed' => (bool)$r->billed,
                'invoiceId' => $r->invoice_id,
                'invoiceNumber' => $r->invoice_number,
            ];
        }));
    }

    public function sync(Request $request)
    {
        $recordsData = $request->input('records', []);

        $incomingIds = array_filter(array_column($recordsData, 'id'), function($id) {
            return is_numeric($id);
        });
        FabricLossRecord::whereNotIn('id', $incomingIds)->delete();

        foreach ($recordsData as $data) {
            $id = isset($data['id']) && is_numeric($data['id']) ? $data['id'] : null;
            FabricLossRecord::updateOrCreate(
                ['id' => $id],
                [
                    'date' => $data['date'] ?? '',
                    'lot_id' => $data['lotId'] ?? null,
                    'lot_number' => $data['lotNumber'] ?? '',
                    'design_number' => $data['designNumber'] ?? null,
                    'design_name' => $data['designName'] ?? null,
                    'category' => $data['category'] ?? 'Loss Fabric',
                    'party_id' => $data['partyId'] ?? null,
                    'party_name' => $data['partyName'] ?? null,
                    'front_meters' => $data['frontMeters'] ?? null,
                    'reverse_meters' => $data['reverseMeters'] ?? null,
                    'meters_lost' => $data['metersLost'] ?? 0,
                    'rate_per_meter' => $data['ratePerMeter'] ?? null,
                    'notes' => $data['notes'] ?? null,
                    'billed' => $data['billed'] ?? false,
                    'invoice_id' => $data['invoiceId'] ?? null,
                    'invoice_number' => $data['invoiceNumber'] ?? null,
                ]
            );
        }

        return $this->index();
    }
}
