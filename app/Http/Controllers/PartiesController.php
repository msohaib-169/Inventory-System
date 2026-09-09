<?php

namespace App\Http\Controllers;

use App\Models\Parties;
use Illuminate\Http\Request;

class PartiesController extends Controller
{
    public function index()
    {
        $parties = Parties::all();
        return response()->json($parties->map(function ($p) {
            return [
                'id' => (string)$p->id,
                'name' => $p->name ?? '',
                'companyName' => $p->company_name ?? '',
                'phone' => $p->phone ?? '',
                'address' => $p->address ?? '',
                'city' => $p->city ?? '',
                'partyType' => $p->party_type ?? 'Customer',
                'totalInvoiced' => (float)$p->total_invoiced,
                'totalPaid' => (float)$p->total_paid,
                'currentDues' => (float)$p->current_dues,
                'createdAt' => $p->created_at_date ?? ($p->created_at ? $p->created_at->toDateString() : date('Y-m-d')),
            ];
        }));
    }

    public function sync(Request $request)
    {
        $partiesData = $request->input('parties', []);

        $incomingIds = array_filter(array_column($partiesData, 'id'), function($id) {
            return is_numeric($id);
        });
        Parties::whereNotIn('id', $incomingIds)->delete();

        foreach ($partiesData as $data) {
            $id = isset($data['id']) && is_numeric($data['id']) ? $data['id'] : null;
            Parties::updateOrCreate(
                ['id' => $id],
                [
                    'name' => $data['name'] ?? '',
                    'company_name' => $data['companyName'] ?? '',
                    'phone' => $data['phone'] ?? '',
                    'address' => $data['address'] ?? '',
                    'city' => $data['city'] ?? '',
                    'party_type' => $data['partyType'] ?? 'Customer',
                    'total_invoiced' => $data['totalInvoiced'] ?? 0,
                    'total_paid' => $data['totalPaid'] ?? 0,
                    'current_dues' => $data['currentDues'] ?? 0,
                    'created_at_date' => $data['createdAt'] ?? date('Y-m-d'),
                ]
            );
        }

        return $this->index();
    }
}
