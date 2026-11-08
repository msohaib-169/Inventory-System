<?php

namespace App\Http\Controllers;

use App\Models\FinishedRecord;
use App\Models\InvoicesItems;
use App\Models\ProductReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductReturnController extends Controller
{
    public function index()
    {
        return response()->json(ProductReturn::with('invoiceItem.invoice')->latest()->get()->map(
            fn (ProductReturn $return) => $this->formatReturn($return)
        ));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoiceItemId' => ['required', 'integer', 'exists:invoices_items,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        [$return, $product] = DB::transaction(function () use ($data) {
            $invoiceItem = InvoicesItems::with('invoice')->lockForUpdate()->findOrFail($data['invoiceItemId']);

            if (!$invoiceItem->product_id || in_array($invoiceItem->item_type, ['loose_fabric', 'fabric_sample_loss'], true)) {
                throw ValidationException::withMessages([
                    'invoiceItemId' => 'Only finished products can be returned through this screen.',
                ]);
            }

            $product = FinishedRecord::whereKey($invoiceItem->product_id)->lockForUpdate()->first();
            if (!$product) {
                throw ValidationException::withMessages([
                    'invoiceItemId' => 'The finished product for this invoice item no longer exists.',
                ]);
            }

            $alreadyReturned = (float) ProductReturn::where('invoice_item_id', $invoiceItem->id)->sum('quantity');
            $remaining = (float) $invoiceItem->quantity - $alreadyReturned;
            if ((float) $data['quantity'] > $remaining) {
                throw ValidationException::withMessages([
                    'quantity' => "Only {$remaining} units remain returnable for this invoice item.",
                ]);
            }

            $return = ProductReturn::create([
                'invoice_id' => $invoiceItem->invoice_id,
                'invoice_item_id' => $invoiceItem->id,
                'party_name' => $invoiceItem->invoice?->party_name,
                'product_id' => (string) $product->id,
                'product_name' => $invoiceItem->product_name ?: $product->name,
                'design_number' => $invoiceItem->design_number ?: $product->design_number,
                'quantity' => $data['quantity'],
                'date' => $data['date'],
                'notes' => $data['notes'] ?? null,
            ]);

            $product->increment('stock_quantity', $data['quantity']);

            return [$return->load('invoiceItem.invoice'), $product->fresh()];
        });

        return response()->json([
            'return' => $this->formatReturn($return),
            'productStockQuantity' => (float) $product->stock_quantity,
        ], 201);
    }

    private function formatReturn(ProductReturn $return): array
    {
        $invoice = $return->invoiceItem?->invoice;

        return [
            'id' => (string) $return->id,
            'invoiceItemId' => (string) $return->invoice_item_id,
            'invoiceId' => (string) $return->invoice_id,
            'productId' => (string) $return->product_id,
            'productName' => $return->product_name ?? '',
            'designNumber' => $return->design_number,
            'invoiceNumber' => $invoice?->invoice_number ?? '',
            'partyName' => $return->party_name ?? $invoice?->party_name ?? '',
            'quantity' => (float) $return->quantity,
            'date' => $return->date?->format('Y-m-d') ?? '',
            'notes' => $return->notes,
        ];
    }
}