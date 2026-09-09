<?php

namespace App\Http\Controllers;

use App\Models\PaymentTransactions;
use Illuminate\Http\Request;

class PaymentTransactionsController extends Controller
{
    public function index()
    {
        $payments = PaymentTransactions::all();
        return response()->json($payments->map(function ($p) {
            return [
                'id' => (string)$p->id,
                'partyId' => $p->party_id ?? '',
                'partyName' => $p->party_name ?? '',
                'date' => $p->date ?? '',
                'amount' => (float)$p->amount,
                'paymentMethod' => $p->payment_method ?? 'Cash',
                'referenceNo' => $p->reference_no,
                'notes' => $p->notes,
            ];
        }));
    }

    public function sync(Request $request)
    {
        $paymentsData = $request->input('payments', []);

        $incomingIds = array_filter(array_column($paymentsData, 'id'), function($id) {
            return is_numeric($id);
        });
        PaymentTransactions::whereNotIn('id', $incomingIds)->delete();

        foreach ($paymentsData as $data) {
            $id = isset($data['id']) && is_numeric($data['id']) ? $data['id'] : null;
            PaymentTransactions::updateOrCreate(
                ['id' => $id],
                [
                    'party_id' => $data['partyId'] ?? '',
                    'party_name' => $data['partyName'] ?? '',
                    'date' => $data['date'] ?? '',
                    'amount' => $data['amount'] ?? 0,
                    'payment_method' => $data['paymentMethod'] ?? 'Cash',
                    'reference_no' => $data['referenceNo'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]
            );
        }

        return $this->index();
    }
}
