<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FabricLotController;
use App\Http\Controllers\FabricLossRecordController;
use App\Http\Controllers\WaddingStockController;
use App\Http\Controllers\RawMaterialStockController;
use App\Http\Controllers\CuttingStockController;
use App\Http\Controllers\ProductionRecordController;
use App\Http\Controllers\FinishedRecordController;
use App\Http\Controllers\PartiesController;
use App\Http\Controllers\PaymentTransactionsController;
use App\Http\Controllers\InvoicesController;
use App\Http\Controllers\SuppliersController;
use App\Http\Controllers\SystemResetController;

Route::prefix('erp')->group(function () {
    // Fabric Lots
    Route::get('/lots', [FabricLotController::class, 'index']);
    Route::post('/lots/sync', [FabricLotController::class, 'sync']);

    // Fabric Losses
    Route::get('/fabric-losses', [FabricLossRecordController::class, 'index']);
    Route::post('/fabric-losses/sync', [FabricLossRecordController::class, 'sync']);

    // Wadding Stock & Items & Batches
    Route::get('/wadding', [WaddingStockController::class, 'index']);
    Route::post('/wadding/sync', [WaddingStockController::class, 'sync']);

    // Raw Materials
    Route::get('/raw-materials', [RawMaterialStockController::class, 'index']);
    Route::post('/raw-materials/sync', [RawMaterialStockController::class, 'sync']);

    // Cutting Records & Cut Pieces
    Route::get('/cutting-records', [CuttingStockController::class, 'indexRecords']);
    Route::get('/cut-pieces', [CuttingStockController::class, 'indexCutPieces']);
    Route::post('/cutting/sync', [CuttingStockController::class, 'sync']);

    // Production Records
    Route::get('/production', [ProductionRecordController::class, 'index']);
    Route::post('/production/sync', [ProductionRecordController::class, 'sync']);

    // Finished Products
    Route::get('/products', [FinishedRecordController::class, 'index']);
    Route::post('/products/sync', [FinishedRecordController::class, 'sync']);

    // Parties
    Route::get('/parties', [PartiesController::class, 'index']);
    Route::post('/parties/sync', [PartiesController::class, 'sync']);

    // Payments
    Route::get('/payments', [PaymentTransactionsController::class, 'index']);
    Route::post('/payments/sync', [PaymentTransactionsController::class, 'sync']);

    // Invoices
    Route::get('/invoices', [InvoicesController::class, 'index']);
    Route::post('/invoices/sync', [InvoicesController::class, 'sync']);
    Route::put('/invoices/{invoice}', [InvoicesController::class, 'update']);

    // Suppliers (Accounts Payable)
    Route::get('/suppliers', [SuppliersController::class, 'index']);
    Route::post('/suppliers/sync', [SuppliersController::class, 'sync']);

    // System Reset
    Route::post('/reset/clear', [SystemResetController::class, 'clearAll']);
    Route::post('/reset/default', [SystemResetController::class, 'resetToDefault']);
});
