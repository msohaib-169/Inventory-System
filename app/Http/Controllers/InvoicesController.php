<?php

namespace App\Http\Controllers;

use App\Models\Invoices;
use App\Models\InvoicesItems;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoicesController extends Controller
{
    public function index()
    {
        $invoices = Invoices::with('items')->get();
        return response()->json($invoices->map(function ($inv) {
            return [
                'id' => (string)$inv->id,
                'invoiceNumber' => $inv->invoice_number ?? '',
                'partyId' => $inv->party_id ?? '',
                'partyName' => $inv->party_name ?? '',
                'partyAddress' => $inv->party_address ?? '',
                'partyPhone' => $inv->party_phone ?? '',
                'date' => $inv->date ?? '',
                'dueDate' => $inv->due_date ?? '',
                'subtotal' => (float)$inv->subtotal,
                'taxRatePercent' => (float)$inv->tax_rate_percent,
                'taxAmount' => (float)$inv->tax_amount,
                'discountAmount' => (float)$inv->discount_amount,
                'grandTotal' => (float)$inv->grand_total,
                'amountPaid' => (float)$inv->amount_paid,
                'balanceDue' => (float)$inv->balance_due,
                'status' => $inv->status ?? 'Unpaid',
                'hasLooseFabric' => (bool)$inv->has_loose_fabric,
                'totalLooseFabricMeters' => (float)$inv->total_loose_fabric_meters,
                'notes' => $inv->notes,
                'currencyCode' => $inv->currency_code,
                'currencySymbol' => $inv->currency_symbol,
                'items' => $inv->items->map(function ($item) {
                    return [
                        'id' => (string)$item->id,
                        'productId' => $item->product_id,
                        'productName' => $item->product_name ?? '',
                        'designNumber' => $item->design_number,
                        'quantity' => (float)$item->quantity,
                        'unitPrice' => (float)$item->unit_price,
                        'totalPrice' => (float)$item->total_price,
                        'itemType' => $item->item_type,
                        'fabricLossId' => $item->fabric_loss_id,
                        'lotNumber' => $item->lot_number,
                        'meters' => $item->meters !== null ? (float)$item->meters : null,
                        'frontMeters' => $item->front_meters !== null ? (float)$item->front_meters : null,
                        'reverseMeters' => $item->reverse_meters !== null ? (float)$item->reverse_meters : null,
                        'looseFabricCategory' => $item->loose_fabric_category,
                    ];
                }),
            ];
        }));
    }

    public function sync(Request $request)
    {
        $invoicesData = $request->input('invoices', []);

        $incomingIds = array_filter(array_column($invoicesData, 'id'), function($id) {
            return is_numeric($id);
        });
        Invoices::whereNotIn('id', $incomingIds)->delete();

        foreach ($invoicesData as $data) {
            $id = isset($data['id']) && is_numeric($data['id']) ? $data['id'] : null;
            $invoice = Invoices::updateOrCreate(
                ['id' => $id],
                [
                    'invoice_number' => $data['invoiceNumber'] ?? '',
                    'party_id' => $data['partyId'] ?? '',
                    'party_name' => $data['partyName'] ?? '',
                    'party_address' => $data['partyAddress'] ?? '',
                    'party_phone' => $data['partyPhone'] ?? '',
                    'date' => $data['date'] ?? '',
                    'due_date' => $data['dueDate'] ?? '',
                    'subtotal' => $data['subtotal'] ?? 0,
                    'tax_rate_percent' => $data['taxRatePercent'] ?? 0,
                    'tax_amount' => $data['taxAmount'] ?? 0,
                    'discount_amount' => $data['discountAmount'] ?? 0,
                    'grand_total' => $data['grandTotal'] ?? 0,
                    'amount_paid' => $data['amountPaid'] ?? 0,
                    'balance_due' => $data['balanceDue'] ?? 0,
                    'status' => $data['status'] ?? 'Unpaid',
                    'has_loose_fabric' => $data['hasLooseFabric'] ?? false,
                    'total_loose_fabric_meters' => $data['totalLooseFabricMeters'] ?? 0,
                    'notes' => $data['notes'] ?? null,
                    'currency_code' => $data['currencyCode'] ?? null,
                    'currency_symbol' => $data['currencySymbol'] ?? null,
                ]
            );

            // Sync items
            $itemsData = $data['items'] ?? [];
            $itemIncomingIds = array_filter(array_column($itemsData, 'id'), function($iid) {
                return is_numeric($iid);
            });
            InvoicesItems::where('invoice_id', $invoice->id)->whereNotIn('id', $itemIncomingIds)->delete();

            foreach ($itemsData as $iData) {
                $iid = isset($iData['id']) && is_numeric($iData['id']) ? $iData['id'] : null;
                InvoicesItems::updateOrCreate(
                    ['id' => $iid, 'invoice_id' => $invoice->id],
                    [
                        'invoice_id' => $invoice->id,
                        'product_id' => $iData['productId'] ?? null,
                        'product_name' => $iData['productName'] ?? '',
                        'design_number' => $iData['designNumber'] ?? null,
                        'quantity' => $iData['quantity'] ?? 0,
                        'unit_price' => $iData['unitPrice'] ?? 0,
                        'total_price' => $iData['totalPrice'] ?? 0,
                        'item_type' => $iData['itemType'] ?? null,
                        'fabric_loss_id' => $iData['fabricLossId'] ?? null,
                        'lot_number' => $iData['lotNumber'] ?? null,
                        'meters' => $iData['meters'] ?? null,
                        'front_meters' => $iData['frontMeters'] ?? null,
                        'reverse_meters' => $iData['reverseMeters'] ?? null,
                        'loose_fabric_category' => $iData['looseFabricCategory'] ?? null,
                    ]
                );
            }
        }

        return $this->index();
    }

    public function update(Request $request, Invoices $invoice)
    {
        $data = $request->validate([
            'invoiceNumber' => ['required', 'string', 'max:255'],
            'partyId' => ['nullable', 'string', 'max:255'],
            'partyName' => ['required', 'string', 'max:255'],
            'date' => ['required', 'string', 'max:30'],
            'dueDate' => ['nullable', 'string', 'max:30'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productId' => ['nullable', 'string', 'max:255'],
            'items.*.productName' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
            'items.*.unitPrice' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($invoice, $request, $data) {
            $invoice->update([
                'invoice_number' => $data['invoiceNumber'],
                'party_id' => $data['partyId'] ?? null,
                'party_name' => $data['partyName'],
                'party_address' => $request->input('partyAddress'),
                'party_phone' => $request->input('partyPhone'),
                'date' => $data['date'],
                'due_date' => $data['dueDate'] ?? null,
                'subtotal' => $request->input('subtotal', 0),
                'tax_rate_percent' => $request->input('taxRatePercent', 0),
                'tax_amount' => $request->input('taxAmount', 0),
                'discount_amount' => $request->input('discountAmount', 0),
                'grand_total' => $request->input('grandTotal', 0),
                'amount_paid' => $request->input('amountPaid', 0),
                'balance_due' => $request->input('balanceDue', 0),
                'status' => $request->input('status', 'Unpaid'),
                'has_loose_fabric' => $request->boolean('hasLooseFabric'),
                'total_loose_fabric_meters' => $request->input('totalLooseFabricMeters', 0),
                'notes' => $request->input('notes'),
                'currency_code' => $request->input('currencyCode'),
                'currency_symbol' => $request->input('currencySymbol'),
            ]);

            $invoice->items()->delete();
            foreach ($data['items'] as $item) {
                $invoice->items()->create([
                    'product_id' => $item['productId'] ?? null,
                    'product_name' => $item['productName'],
                    'design_number' => $item['designNumber'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unitPrice'],
                    'total_price' => $item['totalPrice'] ?? ($item['quantity'] * $item['unitPrice']),
                    'item_type' => $item['itemType'] ?? null,
                    'fabric_loss_id' => $item['fabricLossId'] ?? null,
                    'lot_number' => $item['lotNumber'] ?? null,
                    'meters' => $item['meters'] ?? null,
                    'front_meters' => $item['frontMeters'] ?? null,
                    'reverse_meters' => $item['reverseMeters'] ?? null,
                    'loose_fabric_category' => $item['looseFabricCategory'] ?? null,
                ]);
            }
        });

        return response()->json($invoice->fresh('items'));
    }
}
