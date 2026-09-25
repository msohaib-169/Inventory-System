// @ts-nocheck
import React from 'react';
import {
  FabricLot,
  WaddingStock,
  RawMaterialStockItem,
  FinishedProduct,
  Party,
  Invoice,
  CuttingRecord,
  ProductionRecord,
  CurrencyOption,
} from '../types';
import {
  Layers,
  Scale,
  Package,
  Users,
  Scissors,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface DashboardViewProps {
  lots: FabricLot[];
  wadding: WaddingStock;
  rawMaterials: RawMaterialStockItem[];
  products: FinishedProduct[];
  parties: Party[];
  invoices: Invoice[];
  cuttingRecords: CuttingRecord[];
  productionRecords: ProductionRecord[];
  currency: CurrencyOption;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lots,
  wadding,
  rawMaterials,
  products,
  parties,
  invoices,
  cuttingRecords,
  productionRecords,
  currency,
  onNavigate,
}) => {
  const currSym = currency.symbol;

  // Fabric calculations
  let totalFrontMeters = 0;
  let totalReverseMeters = 0;
  lots.forEach((lot) => {
    lot.designs.forEach((d) => {
      totalFrontMeters += Number(d.frontMeters || 0);
      totalReverseMeters += Number(d.reverseMeters || 0);
    });
  });
  const grandTotalFabricMeters = totalFrontMeters + totalReverseMeters;

  // Stock calculations
  const totalFinishedPieces = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const totalStockCostValue = products.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0);
  const totalStockSellingValue = products.reduce((sum, p) => sum + p.stockQuantity * p.sellingPrice, 0);
  const totalPotentialProfit = totalStockSellingValue - totalStockCostValue;

  // Customer Dues
  const totalDues = parties.reduce((sum, p) => sum + p.currentDues, 0);

  // Low stock alert items
  const lowRawMaterials = rawMaterials.filter((rm) => rm.quantityInStock <= rm.reorderLevel);
  const lowFinishedProducts = products.filter((p) => p.stockQuantity <= p.reorderLevel);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fabric Stock Card */}
        <div
          onClick={() => onNavigate('lots')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {lots.length} Lots
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Raw Fabric Stock</p>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{grandTotalFabricMeters.toLocaleString()} <span className="text-sm font-semibold text-slate-500">Meters</span></h3>

          <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Front:</span>
              <span className="font-semibold text-slate-700">{totalFrontMeters.toLocaleString()} m</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Reverse:</span>
              <span className="font-semibold text-slate-700">{totalReverseMeters.toLocaleString()} m</span>
            </div>
          </div>
        </div>

        {/* Wadding Stock Card */}
        <div
          onClick={() => onNavigate('wadding')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Wadding
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Available Wadding Fiber</p>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{wadding.availableKg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">Kg</span></h3>

          <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Purchased:</span>
              <span className="font-semibold text-slate-700">{wadding.totalPurchasedKg} kg</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Used:</span>
              <span className="font-semibold text-slate-700">{wadding.usedKg} kg</span>
            </div>
          </div>
        </div>

        {/* Finished Goods Stock */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Finished Goods
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Product Inventory</p>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{totalFinishedPieces.toLocaleString()} <span className="text-sm font-semibold text-slate-500">Pieces</span></h3>

          <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Cost Value:</span>
              <span className="font-semibold text-slate-700">{currSym} {totalStockCostValue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Est. Profit:</span>
              <span className="font-semibold text-emerald-600">+{currSym} {totalPotentialProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Customer Outstanding Dues */}
        <div
          onClick={() => onNavigate('parties')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {parties.length} Parties
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Customer Dues</p>
          <h3 className="text-xl font-bold text-amber-700 mt-1">{currSym} {totalDues.toLocaleString()}</h3>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs flex justify-between items-center text-slate-500">
            <span>Outstanding Receivable Balance</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Quick Factory Workflows</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('cutting')}
            className="flex items-center space-x-2.5 p-3 bg-slate-800 hover:bg-indigo-600 rounded-xl text-left transition text-xs font-semibold text-white border border-slate-700 cursor-pointer"
          >
            <Scissors className="w-4 h-4 text-indigo-400" />
            <span>Record Daily Cutting</span>
          </button>

          <button
            onClick={() => onNavigate('production')}
            className="flex items-center space-x-2.5 p-3 bg-slate-800 hover:bg-emerald-600 rounded-xl text-left transition text-xs font-semibold text-white border border-slate-700 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Record Stitch Production</span>
          </button>

          <button
            onClick={() => onNavigate('billing')}
            className="flex items-center space-x-2.5 p-3 bg-slate-800 hover:bg-blue-600 rounded-xl text-left transition text-xs font-semibold text-white border border-slate-700 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Generate PDF Invoice</span>
          </button>

          <button
            onClick={() => onNavigate('parties')}
            className="flex items-center space-x-2.5 p-3 bg-slate-800 hover:bg-amber-600 rounded-xl text-left transition text-xs font-semibold text-white border border-slate-700 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Add Party Payment</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alerts & Recent Production */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warnings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">Low Stock Inventory Alerts</h3>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
              {lowRawMaterials.length + lowFinishedProducts.length} Items
            </span>
          </div>

          {lowRawMaterials.length === 0 && lowFinishedProducts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-lg">
              All raw materials and finished products are well stocked above reorder thresholds!
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {lowRawMaterials.map((rm) => (
                <div key={rm.id} className="flex items-center justify-between p-2.5 bg-amber-50/60 rounded-lg border border-amber-100 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{rm.name}</p>
                    <span className="text-[11px] text-slate-500 capitalize">Category: {rm.category.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-700">{rm.quantityInStock} {rm.unit}</span>
                    <span className="block text-[10px] text-slate-400">Reorder at {rm.reorderLevel}</span>
                  </div>
                </div>
              ))}

              {lowFinishedProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-red-50/60 rounded-lg border border-red-100 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{p.name} ({p.designNumber})</p>
                    <span className="text-[11px] text-slate-500">Category: {p.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-700">{p.stockQuantity} {p.unit}</span>
                    <span className="block text-[10px] text-slate-400">Reorder at {p.reorderLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Factory Production Logs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Recent Daily Production Logs</h3>
            </div>
            <button onClick={() => onNavigate('production')} className="text-xs text-indigo-600 hover:underline font-semibold">
              View All
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {productionRecords.slice(0, 5).map((rec) => (
              <div key={rec.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{rec.productName}</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    +{rec.quantityProduced} pcs
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Date: {rec.date} | Design: {rec.designNumber}</span>
                  {rec.waddingUsedKg > 0 && <span>Wadding: {rec.waddingUsedKg} kg</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

