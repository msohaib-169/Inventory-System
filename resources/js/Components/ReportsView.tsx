import React, { useState } from 'react';
import {
  FabricLot,
  CuttingRecord,
  FinishedProduct,
  Invoice,
  ReportPeriod,
  CurrencyOption,
} from '../types';
import { PDFGenerator } from '../lib/pdfGenerator';
import { BarChart3, Download, Calendar, Layers, Scissors, Package, FileText, Filter, Search, X } from 'lucide-react';

interface ReportsViewProps {
  lots: FabricLot[];
  cuttingRecords: CuttingRecord[];
  products: FinishedProduct[];
  invoices: Invoice[];
  currency: CurrencyOption;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  lots,
  cuttingRecords,
  products,
  invoices,
  currency,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<
    'lots' | 'cutting' | 'product_sales' | 'product_stock' | 'daily_cutting' | 'daily_sales' | 'billing'
  >('lots');

  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const currSym = currency.symbol;

  // Filter helper based on period date check
  const isDateInPeriod = (dateStr: string) => {
    if (!dateStr) return true;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (period === 'daily') {
      return itemDate.toDateString() === now.toDateString();
    } else if (period === 'weekly') {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } else if (period === 'monthly') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    } else if (period === 'yearly') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const q = searchQuery.toLowerCase().trim();

  // Filtered Lots
  const filteredLots = lots.filter((l) => {
    if (!q) return true;
    return (
      l.lotNumber.toLowerCase().includes(q) ||
      (l.supplierName && l.supplierName.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      l.designs.some((d) => d.designNumber.toLowerCase().includes(q))
    );
  });

  // Filtered Cutting Records
  const filteredCutting = cuttingRecords.filter((r) => {
    const matchesPeriod = isDateInPeriod(r.date);
    if (!matchesPeriod) return false;
    if (!q) return true;
    return (
      r.lotNumber.toLowerCase().includes(q) ||
      r.designNumber.toLowerCase().includes(q) ||
      r.productType.toLowerCase().includes(q) ||
      r.date.includes(q)
    );
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.designNumber.toLowerCase().includes(q)
    );
  });

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesPeriod = isDateInPeriod(inv.date);
    if (!matchesPeriod) return false;
    if (!q) return true;
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.partyName.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q) ||
      inv.date.includes(q)
    );
  });

  // Export handlers
  const handleExportPDF = () => {
    let title = '';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let stats: { label: string; value: string }[] = [];

    const periodText = period.toUpperCase();

    switch (selectedReportType) {
      case 'lots':
        title = 'Raw Material Lot Management Report';
        headers = ['Lot Number', 'Supplier', 'Date Received', 'Designs Count', 'Front Meters', 'Reverse Meters', 'Grand Total (m)'];
        rows = filteredLots.map((l) => {
          let front = 0,
            reverse = 0;
          l.designs.forEach((d) => {
            front += d.frontMeters || 0;
            reverse += d.reverseMeters || 0;
          });
          return [l.lotNumber, l.supplierName || 'N/A', l.dateReceived, l.designs.length, front, reverse, front + reverse];
        });
        break;

      case 'cutting':
      case 'daily_cutting':
        title = 'Fabric Cutting Log Report';
        headers = ['Date', 'Lot #', 'Design #', 'Product Type', 'Qty Cut', 'Front Used', 'Reverse Used', 'Total Meters'];
        rows = filteredCutting.map((r) => [
          r.date,
          r.lotNumber,
          r.designNumber,
          r.productType,
          r.quantityCut,
          `${r.totalFrontMetersUsed}m`,
          `${r.totalReverseMetersUsed}m`,
          `${r.totalMetersUsed}m`,
        ]);
        break;

      case 'product_stock':
        title = 'Finished Products Stock Inventory Report';
        headers = ['SKU', 'Product Name', 'Category', 'Design #', 'Stock Qty', 'Cost Price', 'Selling Price', 'Total Stock Cost'];
        rows = filteredProducts.map((p) => [
          p.sku || 'N/A',
          p.name,
          p.category,
          p.designNumber,
          `${p.stockQuantity} ${p.unit}`,
          `${currSym} ${p.costPrice.toFixed(2)}`,
          `${currSym} ${p.sellingPrice.toFixed(2)}`,
          `${currSym} ${(p.stockQuantity * p.costPrice).toFixed(2)}`,
        ]);
        break;

      case 'daily_sales':
      case 'product_sales':
      case 'billing':
        title = 'Sales & Billing Management Report';
        headers = ['Invoice #', 'Party Name', 'Date', 'Items Count', 'Subtotal', 'Discount', 'Grand Total', 'Status'];
        rows = filteredInvoices.map((inv) => [
          inv.invoiceNumber,
          inv.partyName,
          inv.date,
          inv.items.length,
          `${inv.currencySymbol || currSym} ${inv.subtotal.toFixed(2)}`,
          `${inv.currencySymbol || currSym} ${inv.discountAmount.toFixed(2)}`,
          `${inv.currencySymbol || currSym} ${inv.grandTotal.toFixed(2)}`,
          inv.status,
        ]);
        break;
    }

    PDFGenerator.generateGeneralReportPDF(title, periodText, headers, rows, stats);
  };

  const handleExportCSV = () => {
    let title = selectedReportType;
    let csvRows: string[] = [];

    if (selectedReportType === 'lots') {
      csvRows.push('Lot Number,Supplier,Date Received,Front Meters,Reverse Meters,Grand Total Meters');
      filteredLots.forEach((l) => {
        let front = 0,
          reverse = 0;
        l.designs.forEach((d) => {
          front += d.frontMeters || 0;
          reverse += d.reverseMeters || 0;
        });
        csvRows.push(`"${l.lotNumber}","${l.supplierName}","${l.dateReceived}",${front},${reverse},${front + reverse}`);
      });
    } else if (selectedReportType === 'cutting' || selectedReportType === 'daily_cutting') {
      csvRows.push('Date,Lot Number,Design Number,Product Type,Quantity Cut,Front Meters,Reverse Meters,Total Meters');
      filteredCutting.forEach((r) => {
        csvRows.push(
          `"${r.date}","${r.lotNumber}","${r.designNumber}","${r.productType}",${r.quantityCut},${r.totalFrontMetersUsed},${r.totalReverseMetersUsed},${r.totalMetersUsed}`
        );
      });
    } else if (selectedReportType === 'product_stock') {
      csvRows.push('SKU,Product Name,Category,Design Number,Stock Quantity,Cost Price,Selling Price,Stock Cost Value');
      filteredProducts.forEach((p) => {
        csvRows.push(
          `"${p.sku}","${p.name}","${p.category}","${p.designNumber}",${p.stockQuantity},${p.costPrice},${p.sellingPrice},${p.stockQuantity * p.costPrice}`
        );
      });
    } else {
      csvRows.push('Invoice Number,Party Name,Date,Subtotal,Discount,Grand Total,Amount Paid,Balance Due,Status');
      filteredInvoices.forEach((i) => {
        csvRows.push(
          `"${i.invoiceNumber}","${i.partyName}","${i.date}",${i.subtotal},${i.discountAmount},${i.grandTotal},${i.amountPaid},${i.balanceDue},"${i.status}"`
        );
      });
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${title}_Report_${period}.csv`);
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Report Selection Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold tracking-wide">Factory Analytics & Management Reports</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Select Report Category
            </label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="lots">1. Lot Management Report (Fabric Lots & Meters)</option>
              <option value="cutting">2. Cutting Report (Front/Reverse Consumption)</option>
              <option value="product_sales">3. Product Sales & Revenue Report</option>
              <option value="product_stock">4. Stock of Product Report (Inventory)</option>
              <option value="daily_cutting">5. Daily Cutting Log Report</option>
              <option value="daily_sales">6. Daily Sales & Collections Report</option>
              <option value="billing">7. Billing & Ledger Receivables Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Time Period Filter
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    period === p
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Report Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="capitalize text-slate-900 font-bold text-sm">{selectedReportType.replace('_', ' ')} Report Data</span>
            <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded font-semibold border border-indigo-200 uppercase">
              Filtered: {period}
            </span>
          </div>

          {/* Search bar inside Report Table */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search report records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-normal text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {selectedReportType === 'lots' && (
            filteredLots.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No fabric lots match your search query.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Lot #</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Date Received</th>
                    <th className="py-3 px-4 text-center">Designs</th>
                    <th className="py-3 px-4 text-right text-blue-700">Total Front Meters</th>
                    <th className="py-3 px-4 text-right text-purple-700">Total Reverse Meters</th>
                    <th className="py-3 px-4 text-right font-extrabold">Grand Total Meters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLots.map((l) => {
                    let front = 0,
                      reverse = 0;
                    l.designs.forEach((d) => {
                      front += d.frontMeters || 0;
                      reverse += d.reverseMeters || 0;
                    });
                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-indigo-700">{l.lotNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{l.supplierName}</td>
                        <td className="py-3 px-4 text-slate-500">{l.dateReceived}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{l.designs.length}</td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-700">{front.toLocaleString()} m</td>
                        <td className="py-3 px-4 text-right font-semibold text-purple-700">{reverse.toLocaleString()} m</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50">
                          {(front + reverse).toLocaleString()} m
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {(selectedReportType === 'cutting' || selectedReportType === 'daily_cutting') && (
            filteredCutting.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No cutting log records match your parameters.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Lot #</th>
                    <th className="py-3 px-4">Design #</th>
                    <th className="py-3 px-4">Product Type</th>
                    <th className="py-3 px-4 text-center">Qty Cut</th>
                    <th className="py-3 px-4 text-right text-blue-700">Front Consumed</th>
                    <th className="py-3 px-4 text-right text-purple-700">Reverse Consumed</th>
                    <th className="py-3 px-4 text-right font-extrabold">Total Meters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCutting.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">{r.date}</td>
                      <td className="py-3 px-4 font-bold text-indigo-700">{r.lotNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.designNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{r.productType}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-emerald-700 bg-emerald-50/50">
                        {r.quantityCut} pcs
                      </td>
                      <td className="py-3 px-4 text-right text-blue-700 font-bold">{r.totalFrontMetersUsed} m</td>
                      <td className="py-3 px-4 text-right text-purple-700 font-bold">{r.totalReverseMetersUsed} m</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50">
                        {r.totalMetersUsed} m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {selectedReportType === 'product_stock' && (
            filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No product inventory matches your search.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                    <th className="py-3 px-4">SKU Code</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Design #</th>
                    <th className="py-3 px-4 text-center">Stock Quantity</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right font-extrabold">Total Stock Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">{p.sku}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{p.category}</td>
                      <td className="py-3 px-4 font-bold text-indigo-700">{p.designNumber}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {p.stockQuantity} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">{currSym} {p.costPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{currSym} {p.sellingPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50">
                        {currSym} {(p.stockQuantity * p.costPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {(selectedReportType === 'daily_sales' ||
            selectedReportType === 'product_sales' ||
            selectedReportType === 'billing') && (
            filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No invoice records match your search or date filter.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Party Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right font-extrabold">Grand Total</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Amount Paid</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-indigo-700">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.partyName}</td>
                      <td className="py-3 px-4 text-slate-500">{inv.date}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{inv.currencySymbol || currSym} {inv.subtotal.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-amber-700">{inv.currencySymbol || currSym} {inv.discountAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50">
                        {inv.currencySymbol || currSym} {inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{inv.currencySymbol || currSym} {inv.amountPaid.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center font-bold text-[10px] uppercase">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
};
