<?php

use App\Models\FinishedRecord;
use App\Models\Invoices;
use App\Models\InvoicesItems;
use App\Models\ProductReturn;

beforeEach(function () {
    $this->product = FinishedRecord::create([
        'name' => 'Bedsheet Set',
        'design_number' => 'ZF-100',
        'stock_quantity' => 8,
        'unit' => 'pcs',
    ]);

    $invoice = Invoices::create([
        'invoice_number' => 'INV-100',
        'party_name' => 'Customer One',
        'date' => '2026-10-08',
    ]);

    $this->invoiceItem = InvoicesItems::create([
        'invoice_id' => $invoice->id,
        'product_id' => (string) $this->product->id,
        'product_name' => 'Bedsheet Set',
        'design_number' => 'ZF-100',
        'quantity' => 5,
        'unit_price' => 100,
        'total_price' => 500,
        'item_type' => 'product',
    ]);
});

it('restores finished product stock and records a valid return', function () {
    $this->postJson('/api/erp/returns', [
        'invoiceItemId' => (string) $this->invoiceItem->id,
        'quantity' => 2,
        'date' => '2026-10-08',
    ])
        ->assertCreated()
        ->assertJsonPath('return.quantity', 2)
        ->assertJsonPath('return.partyName', 'Customer One')
        ->assertJsonPath('productStockQuantity', 10);

    expect($this->product->fresh()->stock_quantity)->toBe(10.0)
        ->and(ProductReturn::count())->toBe(1)
        ->and(ProductReturn::first()->party_name)->toBe('Customer One');
});

it('rejects returns greater than the invoice quantity', function () {
    $this->postJson('/api/erp/returns', [
        'invoiceItemId' => (string) $this->invoiceItem->id,
        'quantity' => 6,
        'date' => '2026-10-08',
    ])->assertUnprocessable();

    expect($this->product->fresh()->stock_quantity)->toBe(8.0)
        ->and(ProductReturn::count())->toBe(0);
});