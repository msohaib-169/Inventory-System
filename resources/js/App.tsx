// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ERPStorage } from './lib/storage';
import { ERPAPI } from './lib/api';
import {
  FabricLot,
  FabricLossRecord,
  WaddingStock,
  RawMaterialStockItem,
  CuttingRecord,
  CutPieceStockItem,
  ProductionRecord,
  FinishedProduct,
  Party,
  PaymentTransaction,
  Invoice,
  ProductReturn,
  SupplierProfile,
  SupplierBill,
  SupplierPayment,
  CurrencyOption,
  CURRENCIES,
} from './types';

import { Header } from './Components/Header';
import { Sidebar } from './Components/Sidebar';
import { ConfirmDeleteModal } from './Components/ConfirmDeleteModal';
import { ResetSystemModal } from './Components/Resetsystem';
import { syncSupplierLedgers } from './lib/syncSuppliers';
import { DashboardView } from './Components/DashboardView';
import { RawMaterialLotsView } from './Components/RawMaterialLotsView';
import { FabricLossView } from './Components/FabricLoss';
import { WaddingCalculatorView } from './Components/WaddingCalculatorView';
import { PackagingStockView } from './Components/PackagingStockView';
import { CuttingManagementView } from './Components/CuttingManagementView';
import { ProductionManagementView } from './Components/ProductionManagementView';
import { ProductsStockView } from './Components/ProductsStockView';
import { PartiesLedgerView } from './Components/PartiesLedgerView';
import { SupplierPayablesView } from './Components/SupplierPayablesView';
import { BillingSystemView } from './Components/BillingSystemView';
import { ReportsView } from './Components/ReportsView';
import { ProductReturnsView } from './Components/ProductReturnsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(CURRENCIES[0]);

  // ERP Persistent Data State
  const [lots, setLots] = useState<FabricLot[]>([]);
  const [fabricLosses, setFabricLosses] = useState<FabricLossRecord[]>([]);
  const [wadding, setWadding] = useState<WaddingStock>({
    totalPurchasedKg: 0,
    usedKg: 0,
    availableKg: 0,
    singleQuiltSpecKg: 0,
    doubleQuiltSpecKg: 0,
    items: [],
  });
  const [rawMaterials, setRawMaterials] = useState<RawMaterialStockItem[]>([]);
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>([]);
  const [cutPiecesStock, setCutPiecesStock] = useState<CutPieceStockItem[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [productReturns, setProductReturns] = useState<ProductReturn[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Business records are loaded from the database API; remove legacy browser-cached records.
  useEffect(() => {
    ERPStorage.clearAllData();
    Promise.all([
      ERPAPI.fetchLots().catch(() => null),
      ERPAPI.fetchFabricLosses().catch(() => null),
      ERPAPI.fetchWadding().catch(() => null),
      ERPAPI.fetchRawMaterials().catch(() => null),
      ERPAPI.fetchCuttingRecords().catch(() => null),
      ERPAPI.fetchCutPiecesStock().catch(() => null),
      ERPAPI.fetchProductionRecords().catch(() => null),
      ERPAPI.fetchProducts().catch(() => null),
      ERPAPI.fetchParties().catch(() => null),
      ERPAPI.fetchPayments().catch(() => null),
      ERPAPI.fetchInvoices().catch(() => null),
      ERPAPI.fetchReturns().catch(() => null),
      ERPAPI.fetchSuppliers().catch(() => null),
    ]).then(([apiLots, apiLosses, apiWadding, apiRaw, apiCutting, apiCutPieces, apiProd, apiProducts, apiParties, apiPayments, apiInvoices, apiReturns, apiSuppliers]) => {
      if (apiLots !== null) setLots(apiLots);
      if (apiLosses !== null) setFabricLosses(apiLosses);
      if (apiWadding !== null && apiWadding?.items) setWadding(apiWadding);
      if (apiRaw !== null) setRawMaterials(apiRaw);
      if (apiCutting !== null) setCuttingRecords(apiCutting);
      if (apiCutPieces !== null) setCutPiecesStock(apiCutPieces);
      if (apiProd !== null) setProductionRecords(apiProd);
      if (apiProducts !== null) setProducts(apiProducts);
      if (apiParties !== null) setParties(apiParties);
      if (apiPayments !== null) setPayments(apiPayments);
      if (apiInvoices !== null) setInvoices(apiInvoices);
      if (apiReturns !== null) setProductReturns(apiReturns);
      if (apiSuppliers !== null) {
        setSuppliers(apiSuppliers.suppliers || []);
        setSupplierBills(apiSuppliers.bills || []);
        setSupplierPayments(apiSuppliers.payments || []);
      }
    });

  }, []); // Run once on mount

  // Save State Wrappers with Auto-Sync to Backend & Supplier Accounts Payable Dues
  const handleSaveLots = (updatedLots: FabricLot[]) => {
    setLots(updatedLots);
    ERPAPI.saveLots(updatedLots).catch(() => { });

    // Automatically sync Fabric Lots into Supplier Accounts Payable Dues
    const { syncedSuppliers, syncedBills, syncedPayments } = syncSupplierLedgers(
      updatedLots,
      wadding,
      rawMaterials,
      suppliers,
      supplierBills,
      supplierPayments
    );
    setSuppliers(syncedSuppliers);
    setSupplierBills(syncedBills);
    setSupplierPayments(syncedPayments);
    ERPAPI.saveSuppliers(syncedSuppliers, syncedBills, syncedPayments).catch(() => { });
  };

  const handleSaveFabricLosses = (updatedLosses: FabricLossRecord[]) => {
    setFabricLosses(updatedLosses);
    ERPAPI.saveFabricLosses(updatedLosses).catch(() => { });
  };

  const handleSaveWadding = (updatedWadding: WaddingStock) => {
    setWadding(updatedWadding);
    ERPAPI.saveWadding(updatedWadding).catch(() => { });

    // Automatically sync Wadding Stock into Supplier Accounts Payable Dues
    const { syncedSuppliers, syncedBills, syncedPayments } = syncSupplierLedgers(
      lots,
      updatedWadding,
      rawMaterials,
      suppliers,
      supplierBills,
      supplierPayments
    );
    setSuppliers(syncedSuppliers);
    setSupplierBills(syncedBills);
    setSupplierPayments(syncedPayments);
    ERPAPI.saveSuppliers(syncedSuppliers, syncedBills, syncedPayments).catch(() => { });
  };

  const handleSaveRawMaterials = (updatedRawMaterials: RawMaterialStockItem[]) => {
    setRawMaterials(updatedRawMaterials);
    ERPAPI.saveRawMaterials(updatedRawMaterials).catch(() => { });

    // Automatically sync Packaging / Raw Materials into Supplier Accounts Payable Dues
    const { syncedSuppliers, syncedBills, syncedPayments } = syncSupplierLedgers(
      lots,
      wadding,
      updatedRawMaterials,
      suppliers,
      supplierBills,
      supplierPayments
    );
    setSuppliers(syncedSuppliers);
    setSupplierBills(syncedBills);
    setSupplierPayments(syncedPayments);
    ERPAPI.saveSuppliers(syncedSuppliers, syncedBills, syncedPayments).catch(() => { });
  };

  const handleSaveCuttingData = (
    updatedLots: FabricLot[],
    newRecords: CuttingRecord[],
    updatedCutPieces: CutPieceStockItem[],
    updatedWadding?: WaddingStock
  ) => {
    setLots(updatedLots);
    ERPAPI.saveLots(updatedLots).catch(() => { });

    setCuttingRecords(newRecords);

    setCutPiecesStock(updatedCutPieces);

    ERPAPI.saveCuttingData(newRecords, updatedCutPieces).catch(() => { });

    if (updatedWadding) {
      setWadding(updatedWadding);
      ERPAPI.saveWadding(updatedWadding).catch(() => { });
    }
  };

  const handleSaveProductionData = (
    updatedProducts: FinishedProduct[],
    updatedWadding: WaddingStock,
    updatedRawMaterials: RawMaterialStockItem[],
    updatedCutPieces: CutPieceStockItem[],
    newRecords: ProductionRecord[]
  ) => {
    setProducts(updatedProducts);
    ERPAPI.saveProducts(updatedProducts).catch(() => { });

    setWadding(updatedWadding);
    ERPAPI.saveWadding(updatedWadding).catch(() => { });

    setRawMaterials(updatedRawMaterials);
    ERPAPI.saveRawMaterials(updatedRawMaterials).catch(() => { });

    setCutPiecesStock(updatedCutPieces);

    setProductionRecords(newRecords);
    ERPAPI.saveProductionRecords(newRecords).catch(() => { });
  };

  const handleSaveProducts = (updatedProducts: FinishedProduct[]) => {
    setProducts(updatedProducts);
    ERPAPI.saveProducts(updatedProducts).catch(() => { });
  };

  const handleSavePartiesData = (
    updatedParties: Party[],
    updatedPayments: PaymentTransaction[],
    updatedInvoices?: Invoice[]
  ) => {
    setParties(updatedParties);
    ERPAPI.saveParties(updatedParties).catch(() => { });

    setPayments(updatedPayments);
    ERPAPI.savePayments(updatedPayments).catch(() => { });

    if (updatedInvoices) {
      setInvoices(updatedInvoices);
      ERPAPI.saveInvoices(updatedInvoices).catch(() => { });
    }
  };

  const handleSaveSupplierData = (
    updatedSuppliers: SupplierProfile[],
    updatedBills: SupplierBill[],
    updatedPayments: SupplierPayment[],
    updatedLots?: FabricLot[],
    updatedWadding?: WaddingStock,
    updatedRawMaterials?: RawMaterialStockItem[]
  ) => {
    setSuppliers(updatedSuppliers);

    setSupplierBills(updatedBills);

    setSupplierPayments(updatedPayments);

    ERPAPI.saveSuppliers(updatedSuppliers, updatedBills, updatedPayments).catch(() => { });

    if (updatedLots) {
      setLots(updatedLots);
      ERPAPI.saveLots(updatedLots).catch(() => { });
    }
    if (updatedWadding) {
      setWadding(updatedWadding);
      ERPAPI.saveWadding(updatedWadding).catch(() => { });
    }
    if (updatedRawMaterials) {
      setRawMaterials(updatedRawMaterials);
      ERPAPI.saveRawMaterials(updatedRawMaterials).catch(() => { });
    }
  };

  const handleSaveBillingData = (
    updatedInvoices: Invoice[],
    updatedProducts: FinishedProduct[],
    updatedParties: Party[],
    updatedPayments?: PaymentTransaction[]
  ) => {
    setInvoices(updatedInvoices);
    ERPAPI.saveInvoices(updatedInvoices).catch(() => { });

    setProducts(updatedProducts);
    ERPAPI.saveProducts(updatedProducts).catch(() => { });

    setParties(updatedParties);
    ERPAPI.saveParties(updatedParties).catch(() => { });

    if (updatedPayments) {
      setPayments(updatedPayments);
      ERPAPI.savePayments(updatedPayments).catch(() => { });
    }
  };

  const handleCreateProductReturn = async (data: { invoiceItemId: string; quantity: number; date: string; notes?: string }) => {
    const result = await ERPAPI.createReturn(data);
    setProductReturns((current) => [result.return, ...current]);
    setProducts((current) => current.map((product) =>
      product.id === result.return.productId
        ? { ...product, stockQuantity: result.productStockQuantity }
        : product
    ));
  };

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  const handleClearAllData = async () => {
    try {
      await ERPAPI.clearAllData();
      ERPStorage.clearAllData();
      setLots([]);
      setFabricLosses([]);
      setWadding({
        totalPurchasedKg: 0,
        usedKg: 0,
        availableKg: 0,
        singleQuiltSpecKg: 0,
        doubleQuiltSpecKg: 0,
        items: [],
      });
      setRawMaterials([]);
      setCuttingRecords([]);
      setCutPiecesStock([]);
      setProductionRecords([]);
      setProducts([]);
      setParties([]);
      setPayments([]);
      setInvoices([]);
      setSuppliers([]);
      setSupplierBills([]);
      setSupplierPayments([]);
      showToast('All system factory data cleared!', 'info');
    } catch {
      showToast('Could not clear system data from the server. Please try again.', 'info');
    }
  };

  // Low stock counter
  const lowRmCount = rawMaterials.filter((rm) => rm.quantityInStock <= rm.reorderLevel).length;
  const lowProdCount = products.filter((p) => p.stockQuantity <= p.reorderLevel).length;
  const lowStockCount = lowRmCount + lowProdCount;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased font-sans">
      <Header
        activeTab={activeTab}
        onResetData={handleResetData}
        lowStockCount={lowStockCount}
        currency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              lots={lots}
              wadding={wadding}
              rawMaterials={rawMaterials}
              products={products}
              parties={parties}
              invoices={invoices}
              cuttingRecords={cuttingRecords}
              productionRecords={productionRecords}
              currency={selectedCurrency}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'lots' && (
            <RawMaterialLotsView
              lots={lots}
              onSaveLots={handleSaveLots}
              fabricLosses={fabricLosses}
              onSaveFabricLosses={handleSaveFabricLosses}
            />
          )}

          {activeTab === 'fabric_loss' && (
            <FabricLossView
              lots={lots}
              onSaveLots={handleSaveLots}
              fabricLosses={fabricLosses}
              onSaveFabricLosses={handleSaveFabricLosses}
              parties={parties}
              invoices={invoices}
              currency={selectedCurrency}
              onSaveBillingData={handleSaveBillingData}
              products={products}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'wadding' && (
            <WaddingCalculatorView
              wadding={wadding}
              onSaveWadding={handleSaveWadding}
              lots={lots}
              onSaveLots={handleSaveLots}
              currency={selectedCurrency}
            />
          )}

          {activeTab === 'raw_materials' && (
            <PackagingStockView
              rawMaterials={rawMaterials}
              currency={selectedCurrency}
              onSaveRawMaterials={handleSaveRawMaterials}
              suppliers={suppliers}
              onSaveSupplierData={handleSaveSupplierData}
              supplierBills={supplierBills}
              supplierPayments={supplierPayments}
            />
          )}

          {activeTab === 'cutting' && (
            <CuttingManagementView
              lots={lots}
              cuttingRecords={cuttingRecords}
              cutPiecesStock={cutPiecesStock}
              wadding={wadding}
              onSaveCuttingData={handleSaveCuttingData}
            />
          )}

          {activeTab === 'production' && (
            <ProductionManagementView
              products={products}
              wadding={wadding}
              rawMaterials={rawMaterials}
              cutPiecesStock={cutPiecesStock}
              productionRecords={productionRecords}
              onSaveProductionData={handleSaveProductionData}
            />
          )}

          {activeTab === 'products' && (
            <ProductsStockView
              products={products}
              currency={selectedCurrency}
              onSaveProducts={handleSaveProducts}
            />
          )}

          {activeTab === 'parties' && (
            <PartiesLedgerView
              parties={parties}
              payments={payments}
              invoices={invoices}
              currency={selectedCurrency}
              onSavePartiesData={handleSavePartiesData}
              fabricLosses={fabricLosses}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'supplier_dues' && (
            <SupplierPayablesView
              suppliers={suppliers}
              supplierBills={supplierBills}
              supplierPayments={supplierPayments}
              lots={lots}
              wadding={wadding}
              rawMaterials={rawMaterials}
              currency={selectedCurrency}
              onSaveSupplierData={handleSaveSupplierData}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSystemView
              invoices={invoices}
              products={products}
              parties={parties}
              payments={payments}
              currency={selectedCurrency}
              onSaveBillingData={handleSaveBillingData}
              fabricLosses={fabricLosses}
              onSaveFabricLosses={handleSaveFabricLosses}
              lots={lots}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'returns' && (
            <ProductReturnsView
              invoices={invoices}
              returns={productReturns}
              currency={selectedCurrency}
              onCreateReturn={handleCreateProductReturn}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              lots={lots}
              cuttingRecords={cuttingRecords}
              productionRecords={productionRecords}
              products={products}
              invoices={invoices}
              parties={parties}
              wadding={wadding}
              suppliers={suppliers}
              supplierBills={supplierBills}
              supplierPayments={supplierPayments}
              currency={selectedCurrency}
            />
          )}
        </main>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`w-2 h-2 rounded-full ${notification.type === 'info' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Reset System Modal */}
      <ResetSystemModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onClearAll={handleClearAllData}
      />
    </div>
  );
}

