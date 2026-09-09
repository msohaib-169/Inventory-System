<?php

namespace App\Http\Controllers;

use App\Models\SupplierProfile;
use App\Models\SupplierBill;
use App\Models\SupplierPayment;
use Illuminate\Http\Request;

class SuppliersController extends Controller
{
    public function index()
    {
        $suppliers = SupplierProfile::all()->map(function ($s) {
            return [
                'id' => (string)$s->id,
                'name' => $s->name ?? '',
                'companyName' => $s->company_name,
                'phone' => $s->phone,
                'city' => $s->city,
                'address' => $s->address,
                'category' => $s->category ?? 'general',
                'totalPurchases' => (float)$s->total_purchases,
                'totalPaid' => (float)$s->total_paid,
                'currentDues' => (float)$s->current_dues,
                'notes' => $s->notes,
                'createdAt' => $s->created_at_date ?? ($s->created_at ? $s->created_at->format('Y-m-d') : ''),
            ];
        });

        $bills = SupplierBill::all()->map(function ($b) {
            return [
                'id' => (string)$b->id,
                'supplierName' => $b->supplier_name ?? '',
                'supplierPhone' => $b->supplier_phone,
                'supplierAddress' => $b->supplier_address,
                'category' => $b->category ?? 'general',
                'billNumber' => $b->bill_number ?? '',
                'date' => $b->date ?? '',
                'dueDate' => $b->due_date,
                'itemDescription' => $b->item_description ?? '',
                'quantity' => $b->quantity !== null ? (float)$b->quantity : null,
                'unit' => $b->unit,
                'ratePerUnit' => $b->rate_per_unit !== null ? (float)$b->rate_per_unit : null,
                'totalAmount' => (float)$b->total_amount,
                'amountPaid' => (float)$b->amount_paid,
                'balanceDue' => (float)$b->balance_due,
                'paymentStatus' => $b->payment_status ?? 'Unpaid',
                'paymentNotes' => $b->payment_notes,
                'sourceType' => $b->source_type,
                'sourceId' => $b->source_id,
            ];
        });

        $payments = SupplierPayment::all()->map(function ($p) {
            return [
                'id' => (string)$p->id,
                'supplierName' => $p->supplier_name ?? '',
                'supplierAddress' => $p->supplier_address ?? '',
                'billId' => $p->bill_id,
                'billNumber' => $p->bill_number,
                'date' => $p->date ?? '',
                'amount' => (float)$p->amount,
                'paymentMethod' => $p->payment_method ?? 'Cash',
                'referenceNo' => $p->reference_no,
                'notes' => $p->notes,
            ];
        });

        return response()->json([
            'suppliers' => $suppliers,
            'bills' => $bills,
            'payments' => $payments,
        ]);
    }

    public function sync(Request $request)
    {
        $suppliersData = $request->input('suppliers', []);
        $billsData = $request->input('bills', []);
        $paymentsData = $request->input('payments', []);

        // Sync suppliers
        $supplierIncomingIds = array_filter(array_column($suppliersData, 'id'), function($id) {
            return is_numeric($id);
        });
        SupplierProfile::whereNotIn('id', $supplierIncomingIds)->delete();

        foreach ($suppliersData as $s) {
            $id = isset($s['id']) && is_numeric($s['id']) ? $s['id'] : null;
            SupplierProfile::updateOrCreate(
                ['id' => $id],
                [
                    'name' => $s['name'] ?? '',
                    'company_name' => $s['companyName'] ?? null,
                    'phone' => $s['phone'] ?? null,
                    'city' => $s['city'] ?? null,
                    'address' => $s['address'] ?? null,
                    'category' => $s['category'] ?? 'general',
                    'total_purchases' => $s['totalPurchases'] ?? 0,
                    'total_paid' => $s['totalPaid'] ?? 0,
                    'current_dues' => $s['currentDues'] ?? 0,
                    'notes' => $s['notes'] ?? null,
                    'created_at_date' => $s['createdAt'] ?? date('Y-m-d'),
                ]
            );
        }

        // Sync bills
        $billIncomingIds = array_filter(array_column($billsData, 'id'), function($id) {
            return is_numeric($id);
        });
        SupplierBill::whereNotIn('id', $billIncomingIds)->delete();

        foreach ($billsData as $b) {
            $id = isset($b['id']) && is_numeric($b['id']) ? $b['id'] : null;
            SupplierBill::updateOrCreate(
                ['id' => $id],
                [
                    'supplier_name' => $b['supplierName'] ?? '',
                    'supplier_phone' => $b['supplierPhone'] ?? null,
                    'supplier_address' => $b['supplierAddress'] ?? null,
                    'category' => $b['category'] ?? 'general',
                    'bill_number' => $b['billNumber'] ?? '',
                    'date' => $b['date'] ?? '',
                    'due_date' => $b['dueDate'] ?? null,
                    'item_description' => $b['itemDescription'] ?? '',
                    'quantity' => $b['quantity'] ?? null,
                    'unit' => $b['unit'] ?? null,
                    'rate_per_unit' => $b['ratePerUnit'] ?? null,
                    'total_amount' => $b['totalAmount'] ?? 0,
                    'amount_paid' => $b['amountPaid'] ?? 0,
                    'balance_due' => $b['balanceDue'] ?? 0,
                    'payment_status' => $b['paymentStatus'] ?? 'Unpaid',
                    'payment_notes' => $b['paymentNotes'] ?? null,
                    'source_type' => $b['sourceType'] ?? null,
                    'source_id' => $b['sourceId'] ?? null,
                ]
            );
        }

        // Sync payments
        $paymentIncomingIds = array_filter(array_column($paymentsData, 'id'), function($id) {
            return is_numeric($id);
        });
        SupplierPayment::whereNotIn('id', $paymentIncomingIds)->delete();

        foreach ($paymentsData as $p) {
            $id = isset($p['id']) && is_numeric($p['id']) ? $p['id'] : null;
            SupplierPayment::updateOrCreate(
                ['id' => $id],
                [
                    'supplier_name' => $p['supplierName'] ?? '',
                    'supplier_address' => $p['supplierAddress'] ?? null,
                    'bill_id' => $p['billId'] ?? null,
                    'bill_number' => $p['billNumber'] ?? null,
                    'date' => $p['date'] ?? '',
                    'amount' => $p['amount'] ?? 0,
                    'payment_method' => $p['paymentMethod'] ?? 'Cash',
                    'reference_no' => $p['referenceNo'] ?? null,
                    'notes' => $p['notes'] ?? null,
                ]
            );
        }

        return $this->index();
    }
}
