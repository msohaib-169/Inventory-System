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

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(CURRENCIES[0]);

  // ERP Persistent Data State
  const [lots, setLots] = useState<FabricLot[]>(() => ERPStorage.getLots());
  const [fabricLosses, setFabricLosses] = useState<FabricLossRecord[]>(() => ERPStorage.getFabricLosses());
  const [wadding, setWadding] = useState<WaddingStock>(() => ERPStorage.getWadding());
  const [rawMaterials, setRawMaterials] = useState<RawMaterialStockItem[]>(() => ERPStorage.getRawMaterials());
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>(() => ERPStorage.getCuttingRecords());
  const [cutPiecesStock, setCutPiecesStock] = useState<CutPieceStockItem[]>(() => ERPStorage.getCutPiecesStock());
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>(() => ERPStorage.getProductionRecords());
  const [products, setProducts] = useState<FinishedProduct[]>(() => ERPStorage.getProducts());
  const [parties, setParties] = useState<Party[]>(() => ERPStorage.getParties());
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => ERPStorage.getPayments());
  const [invoices, setInvoices] = useState<Invoice[]>(() => ERPStorage.getInvoices());
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>(() => ERPStorage.getSuppliers());
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>(() => ERPStorage.getSupplierBills());
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => ERPStorage.getSupplierPayments());

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Initial mount: load data from backend database API if available, fallback to ERPStorage
  useEffect(() => {
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
      ERPAPI.fetchSuppliers().catch(() => null),
    ]).then(([apiLots, apiLosses, apiWadding, apiRaw, apiCutting, apiCutPieces, apiProd, apiProducts, apiParties, apiPayments, apiInvoices, apiSuppliers]) => {
      let currentLots = lots;
      let currentWadding = wadding;
      let currentRaw = rawMaterials;
      let currentSuppliers = suppliers;
      let currentBills = supplierBills;
      let currentPayments = supplierPayments;

      if (apiLots && apiLots.length) { currentLots = apiLots; setLots(apiLots); ERPStorage.saveLots(apiLots); }
      if (apiLosses && apiLosses.length) { setFabricLosses(apiLosses); ERPStorage.saveFabricLosses(apiLosses); }
      if (apiWadding && apiWadding.items) { currentWadding = apiWadding; setWadding(apiWadding); ERPStorage.saveWadding(apiWadding); }
      if (apiRaw && apiRaw.length) { currentRaw = apiRaw; setRawMaterials(apiRaw); ERPStorage.saveRawMaterials(apiRaw); }
      if (apiCutting && apiCutting.length) { setCuttingRecords(apiCutting); ERPStorage.saveCuttingRecords(apiCutting); }
      if (apiCutPieces && apiCutPieces.length) { setCutPiecesStock(apiCutPieces); ERPStorage.saveCutPiecesStock(apiCutPieces); }
      if (apiProd && apiProd.length) { setProductionRecords(apiProd); ERPStorage.saveProductionRecords(apiProd); }
      if (apiProducts && apiProducts.length) { setProducts(apiProducts); ERPStorage.saveProducts(apiProducts); }
      if (apiParties && apiParties.length) { setParties(apiParties); ERPStorage.saveParties(apiParties); }
      if (apiPayments && apiPayments.length) { setPayments(apiPayments); ERPStorage.savePayments(apiPayments); }
      if (apiInvoices && apiInvoices.length) { setInvoices(apiInvoices); ERPStorage.saveInvoices(apiInvoices); }
      if (apiSuppliers) {
        if (apiSuppliers.suppliers && apiSuppliers.suppliers.length) { currentSuppliers = apiSuppliers.suppliers; setSuppliers(apiSuppliers.suppliers); ERPStorage.saveSuppliers(apiSuppliers.suppliers); }
        if (apiSuppliers.bills && apiSuppliers.bills.length) { currentBills = apiSuppliers.bills; setSupplierBills(apiSuppliers.bills); ERPStorage.saveSupplierBills(apiSuppliers.bills); }
        if (apiSuppliers.payments && apiSuppliers.payments.length) { currentPayments = apiSuppliers.payments; setSupplierPayments(apiSuppliers.payments); ERPStorage.saveSupplierPayments(apiSuppliers.payments); }
      }

      const { syncedSuppliers, syncedBills, syncedPayments } = syncSupplierLedgers(
        currentLots,
        currentWadding,
        currentRaw,
        currentSuppliers,
        currentBills,
        currentPayments
      );
      setSuppliers(syncedSuppliers);
      ERPStorage.saveSuppliers(syncedSuppliers);
      setSupplierBills(syncedBills);
      ERPStorage.saveSupplierBills(syncedBills);
      setSupplierPayments(syncedPayments);
      ERPStorage.saveSupplierPayments(syncedPayments);
    });

    const { syncedSuppliers, syncedBills, syncedPayments } = syncSupplierLedgers(
      lots,
      wadding,
      rawMaterials,
      suppliers,
      supplierBills,
      supplierPayments
    );
    setSuppliers(syncedSuppliers);
    ERPStorage.saveSuppliers(syncedSuppliers);
    setSupplierBills(syncedBills);
    ERPStorage.saveSupplierBills(syncedBills);
    setSupplierPayments(syncedPayments);
    ERPStorage.saveSupplierPayments(syncedPayments);
  }, []); // Run once on mount

  // Save State Wrappers with Auto-Sync to Backend & Supplier Accounts Payable Dues
  const handleSaveLots = (updatedLots: FabricLot[]) => {
    setLots(updatedLots);
    ERPStorage.saveLots(updatedLots);
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
    ERPStorage.saveSuppliers(syncedSuppliers);
    setSupplierBills(syncedBills);
    ERPStorage.saveSupplierBills(syncedBills);
    setSupplierPayments(syncedPayments);
    ERPStorage.saveSupplierPayments(syncedPayments);
    ERPAPI.saveSuppliers(syncedSuppliers, syncedBills, syncedPayments).catch(() => { });
  };

  const handleSaveFabricLosses = (updatedLosses: FabricLossRecord[]) => {
    setFabricLosses(updatedLosses);
    ERPStorage.saveFabricLosses(updatedLosses);
    ERPAPI.saveFabricLosses(updatedLosses).catch(() => { });
  };

  const handleSaveWadding = (updatedWadding: WaddingStock) => {
    setWadding(updatedWadding);
    ERPStorage.saveWadding(updatedWadding);
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
    ERPStorage.saveSuppliers(syncedSuppliers);
    setSupplierBills(syncedBills);
    ERPStorage.saveSupplierBills(syncedBills);
    setSupplierPayments(syncedPayments);
    ERPStorage.saveSupplierPayments(syncedPayments);
    ERPAPI.saveSuppliers(syncedSuppliers, syncedBills, syncedPayments).catch(() => { });
  };

  const handleSaveRawMaterials = (updatedRawMaterials: RawMaterialStockItem[]) => {
    setRawMaterials(updatedRawMaterials);
    ERPStorage.saveRawMaterials(updatedRawMaterials);
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
    ERPStorage.saveSuppliers(syncedSuppliers);
    setSupplierBills(syncedBills);
    ERPStorage.saveSupplierBills(syncedBills);
    setSupplierPayments(syncedPayments);
    ERPStorage.saveSupplierPayments(syncedPayments);
    ERPAPI.saveSuppliers(syncedSuppliers, syncedBills, syncedPayments).catch(() => { });
  };

  const handleSaveCuttingData = (
    updatedLots: FabricLot[],
    newRecords: CuttingRecord[],
    updatedCutPieces: CutPieceStockItem[],
    updatedWadding?: WaddingStock
  ) => {
    setLots(updatedLots);
    ERPStorage.saveLots(updatedLots);
    ERPAPI.saveLots(updatedLots).catch(() => { });

    setCuttingRecords(newRecords);
    ERPStorage.saveCuttingRecords(newRecords);

    setCutPiecesStock(updatedCutPieces);
    ERPStorage.saveCutPiecesStock(updatedCutPieces);

    ERPAPI.saveCuttingData(newRecords, updatedCutPieces).catch(() => { });

    if (updatedWadding) {
      setWadding(updatedWadding);
      ERPStorage.saveWadding(updatedWadding);
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
    ERPStorage.saveProducts(updatedProducts);
    ERPAPI.saveProducts(updatedProducts).catch(() => { });

    setWadding(updatedWadding);
    ERPStorage.saveWadding(updatedWadding);
    ERPAPI.saveWadding(updatedWadding).catch(() => { });

    setRawMaterials(updatedRawMaterials);
    ERPStorage.saveRawMaterials(updatedRawMaterials);
    ERPAPI.saveRawMaterials(updatedRawMaterials).catch(() => { });

    setCutPiecesStock(updatedCutPieces);
    ERPStorage.saveCutPiecesStock(updatedCutPieces);

    setProductionRecords(newRecords);
    ERPStorage.saveProductionRecords(newRecords);
    ERPAPI.saveProductionRecords(newRecords).catch(() => { });
  };

  const handleSaveProducts = (updatedProducts: FinishedProduct[]) => {
    setProducts(updatedProducts);
    ERPStorage.saveProducts(updatedProducts);
    ERPAPI.saveProducts(updatedProducts).catch(() => { });
  };

  const handleSavePartiesData = (
    updatedParties: Party[],
    updatedPayments: PaymentTransaction[],
    updatedInvoices?: Invoice[]
  ) => {
    setParties(updatedParties);
    ERPStorage.saveParties(updatedParties);
    ERPAPI.saveParties(updatedParties).catch(() => { });

    setPayments(updatedPayments);
    ERPStorage.savePayments(updatedPayments);
    ERPAPI.savePayments(updatedPayments).catch(() => { });

    if (updatedInvoices) {
      setInvoices(updatedInvoices);
      ERPStorage.saveInvoices(updatedInvoices);
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
    ERPStorage.saveSuppliers(updatedSuppliers);

    setSupplierBills(updatedBills);
    ERPStorage.saveSupplierBills(updatedBills);

    setSupplierPayments(updatedPayments);
    ERPStorage.saveSupplierPayments(updatedPayments);

    ERPAPI.saveSuppliers(updatedSuppliers, updatedBills, updatedPayments).catch(() => { });

    if (updatedLots) {
      setLots(updatedLots);
      ERPStorage.saveLots(updatedLots);
      ERPAPI.saveLots(updatedLots).catch(() => { });
    }
    if (updatedWadding) {
      setWadding(updatedWadding);
      ERPStorage.saveWadding(updatedWadding);
      ERPAPI.saveWadding(updatedWadding).catch(() => { });
    }
    if (updatedRawMaterials) {
      setRawMaterials(updatedRawMaterials);
      ERPStorage.saveRawMaterials(updatedRawMaterials);
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
    ERPStorage.saveInvoices(updatedInvoices);
    ERPAPI.saveInvoices(updatedInvoices).catch(() => { });

    setProducts(updatedProducts);
    ERPStorage.saveProducts(updatedProducts);
    ERPAPI.saveProducts(updatedProducts).catch(() => { });

    setParties(updatedParties);
    ERPStorage.saveParties(updatedParties);
    ERPAPI.saveParties(updatedParties).catch(() => { });

    if (updatedPayments) {
      setPayments(updatedPayments);
      ERPStorage.savePayments(updatedPayments);
      ERPAPI.savePayments(updatedPayments).catch(() => { });
    }
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

  const handleClearAllData = () => {
    ERPStorage.clearAllData();
    setLots([]);
    setWadding(ERPStorage.getWadding());
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
    showToast('All system factory data cleared! (0 stock, fresh clean slate)', 'info');
  };

  const handleRestoreDefaults = () => {
    ERPStorage.resetToDefault();
    setLots(ERPStorage.getLots());
    setWadding(ERPStorage.getWadding());
    setRawMaterials(ERPStorage.getRawMaterials());
    setCuttingRecords(ERPStorage.getCuttingRecords());
    setCutPiecesStock(ERPStorage.getCutPiecesStock());
    setProductionRecords(ERPStorage.getProductionRecords());
    setProducts(ERPStorage.getProducts());
    setParties(ERPStorage.getParties());
    setPayments(ERPStorage.getPayments());
    setInvoices(ERPStorage.getInvoices());
    setSuppliers(ERPStorage.getSuppliers());
    setSupplierBills(ERPStorage.getSupplierBills());
    setSupplierPayments(ERPStorage.getSupplierPayments());
    showToast('Sample demonstration factory dataset restored successfully!');
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

          {activeTab === 'reports' && (
            <ReportsView
              lots={lots}
              cuttingRecords={cuttingRecords}
              products={products}
              invoices={invoices}
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

      {/* Reset System Modal with Clear All & Restore Sample Data Options */}
      <ResetSystemModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onClearAll={handleClearAllData}
        onRestoreDefaults={handleRestoreDefaults}
      />
    </div>
  );
}
