// @ts-nocheck
import React, { useState } from 'react';
import { FabricLot, FabricLossRecord, Party, Invoice, CurrencyOption, InvoiceItem } from '../types';
import { getDesignTotalMeters } from '../lib/storage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PrintableBillModal } from './PrintableBillModal';
import {
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Search,
  UserCheck,
  Scissors,
  Tag,
  FileText,
  CheckCircle2,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface FabricLossViewProps {
  lots: FabricLot[];
  onSaveLots: (lots: FabricLot[]) => void;
  fabricLosses: FabricLossRecord[];
  onSaveFabricLosses: (losses: FabricLossRecord[]) => void;
  parties: Party[];
  invoices: Invoice[];
  currency: CurrencyOption;
  onSaveBillingData: (
    updatedInvoices: Invoice[],
    updatedProducts: any[],
    updatedParties: Party[]
  ) => void;
  products: any[];
  onNavigateTab?: (tab: string) => void;
}

export const FabricLossView: React.FC<FabricLossViewProps> = ({
  lots,
  onSaveLots,
  fabricLosses,
  onSaveFabricLosses,
  parties,
  invoices,
  currency,
  onSaveBillingData,
  products,
  onNavigateTab,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lossToDelete, setLossToDelete] = useState<FabricLossRecord | null>(null);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<'all' | 'billed' | 'unbilled'>('all');

  // Form State
  const [lossDate, setLossDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLotId, setSelectedLotId] = useState<string>(lots[0]?.id || '');
  const [selectedDesignId, setSelectedDesignId] = useState<string>(lots[0]?.designs[0]?.id || '');
  const [lossCategory, setLossCategory] = useState<
    'Loss Fabric' | 'Given to Customer (Sample / Loss)' | 'Cutting Scrap & Waste' | 'Defect / Quality Damage' | 'Other Loss'
  >('Loss Fabric');
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [customPartyName, setCustomPartyName] = useState<string>('');
  const [lossFrontMeters, setLossFrontMeters] = useState<number>(10);
  const [lossReverseMeters, setLossReverseMeters] = useState<number>(10);
  const [ratePerMeter, setRatePerMeter] = useState<number>(150);
  const [lossNotes, setLossNotes] = useState('');
  const [autoDeductLot, setAutoDeductLot] = useState<boolean>(true);
  const [generateInvoiceNow, setGenerateInvoiceNow] = useState<boolean>(false);

  const calculatedTotalMeters = (Number(lossFrontMeters) || 0) + (Number(lossReverseMeters) || 0);

  const currSym = currency.symbol;

  // Selected Lot and Design objects for Form
  const currentLot = lots.find((l) => l.id === selectedLotId) || lots[0];
  const currentDesign = currentLot?.designs.find((d) => d.id === selectedDesignId) || currentLot?.designs[0];

  // Quick stats
  const totalCustomerLossMeters = fabricLosses
    .filter((l) => l.category.includes('Customer'))
    .reduce((sum, l) => sum + Number(l.metersLost || 0), 0);

  const totalScrapLossMeters = fabricLosses
    .filter((l) => !l.category.includes('Customer'))
    .reduce((sum, l) => sum + Number(l.metersLost || 0), 0);

  const totalAllLossMeters = totalCustomerLossMeters + totalScrapLossMeters;

  const billedCount = fabricLosses.filter((l) => l.billed).length;
  const unbilledCustomerSamplesCount = fabricLosses.filter(
    (l) => l.category.includes('Customer') && (l.partyName || l.partyId) && !l.billed
  ).length;

  // Filtered List
  const filteredLosses = fabricLosses.filter((record) => {
    // 1. Category Filter
    if (categoryFilter !== 'all' && record.category !== categoryFilter) {
      return false;
    }

    // 2. Billing Filter
    if (billingFilter === 'billed' && !record.billed) return false;
    if (billingFilter === 'unbilled' && record.billed) return false;

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLot = record.lotNumber.toLowerCase().includes(q);
      const matchDesign = (record.designName || '').toLowerCase().includes(q);
      const matchParty = (record.partyName || '').toLowerCase().includes(q);
      const matchCat = record.category.toLowerCase().includes(q);
      const matchNotes = (record.notes || '').toLowerCase().includes(q);
      if (!matchLot && !matchDesign && !matchParty && !matchCat && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setLossDate(new Date().toISOString().split('T')[0]);
    const firstLot = lots[0];
    if (firstLot) {
      setSelectedLotId(firstLot.id);
      setSelectedDesignId(firstLot.designs[0]?.id || '');
    }
    setLossCategory('Loss Fabric');
    setSelectedPartyId(parties[0]?.id || '');
    setCustomPartyName('');
    setLossFrontMeters(10);
    setLossReverseMeters(10);
    setRatePerMeter(150);
    setLossNotes('Loss fabric fed for party / customer');
    setAutoDeductLot(true);
    setGenerateInvoiceNow(false);
    setIsModalOpen(true);
  };

  const handleLotSelectChange = (lotId: string) => {
    setSelectedLotId(lotId);
    const targetLot = lots.find((l) => l.id === lotId);
    if (targetLot && targetLot.designs.length > 0) {
      setSelectedDesignId(targetLot.designs[0].id);
    }
  };

  const handleSaveLossRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const front = Number(lossFrontMeters) || 0;
    const reverse = Number(lossReverseMeters) || 0;
    const totalMtrs = front + reverse;
    if (totalMtrs <= 0 || !currentLot) return;

    let targetPartyName = customPartyName;
    let targetPartyObj: Party | undefined;
    if (selectedPartyId) {
      targetPartyObj = parties.find((p) => p.id === selectedPartyId);
      if (targetPartyObj) {
        targetPartyName = targetPartyObj.name;
      }
    }

    const newRecordId = `floss-${Date.now()}`;
    const newRecord: FabricLossRecord = {
      id: newRecordId,
      date: lossDate,
      lotId: currentLot.id,
      lotNumber: currentLot.lotNumber,
      designNumber: currentDesign?.designNumber || 'DS-00',
      designName: currentDesign?.designName || 'Fabric Roll',
      category: lossCategory,
      partyId: selectedPartyId || undefined,
      partyName: targetPartyName || undefined,
      frontMeters: front,
      reverseMeters: reverse,
      metersLost: totalMtrs,
      ratePerMeter: Number(ratePerMeter) || 0,
      notes: lossNotes,
      billed: false,
    };

    // 1. Auto-Deduct from Lot Fabric Stock (Front & Reverse)
    let updatedLots = lots;
    if (autoDeductLot && currentLot && currentDesign) {
      updatedLots = lots.map((lot) => {
        if (lot.id !== currentLot.id) return lot;

        const updatedDesigns = lot.designs.map((d) => {
          if (d.id !== currentDesign.id && d.designNumber !== currentDesign.designNumber) return d;

          if (d.fabricType === 'single_roll' || d.fabricType === 'other') {
            const curTot = getDesignTotalMeters(d);
            const newTot = Math.max(0, curTot - totalMtrs);
            return { ...d, totalMeters: newTot, frontMeters: 0, reverseMeters: 0 };
          } else {
            const newFront = Math.max(0, (d.frontMeters || 0) - front);
            const newRev = Math.max(0, (d.reverseMeters || 0) - reverse);
            const newTot = newFront + newRev;
            return { ...d, frontMeters: newFront, reverseMeters: newRev, totalMeters: newTot };
          }
        });

        return { ...lot, designs: updatedDesigns };
      });

      onSaveLots(updatedLots);
    }

    // 2. Generate Invoice immediately if requested
    let createdInvoice: Invoice | null = null;
    if (generateInvoiceNow && targetPartyObj && totalMtrs > 0) {
      const invNum = `INV-LOSS-${Math.floor(100 + Math.random() * 900)}`;
      const totalCost = totalMtrs * (Number(ratePerMeter) || 0);

      const sampleItem: InvoiceItem = {
        id: `ii-sample-${Date.now()}`,
        productName: `Loss Fabric Issue (${currentLot.lotNumber})`,
        designNumber: currentDesign?.designNumber || 'Fabric',
        quantity: totalMtrs,
        unitPrice: Number(ratePerMeter) || 0,
        totalPrice: totalCost,
        itemType: 'fabric_sample_loss',
        fabricLossId: newRecordId,
        lotNumber: currentLot.lotNumber,
        meters: totalMtrs,
        frontMeters: front,
        reverseMeters: reverse,
      };

      createdInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: invNum,
        partyId: targetPartyObj.id,
        partyName: targetPartyObj.name,
        partyAddress: `${targetPartyObj.address}, ${targetPartyObj.city}`,
        partyPhone: targetPartyObj.phone,
        date: lossDate,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [sampleItem],
        subtotal: totalCost,
        taxRatePercent: 0,
        taxAmount: 0,
        discountAmount: 0,
        grandTotal: totalCost,
        amountPaid: 0,
        balanceDue: totalCost,
        status: 'Unpaid',
        notes: `Loss Fabric Issue: Lot ${currentLot.lotNumber} (${currentDesign?.designName || ''}) - Front: ${front}m, Reverse: ${reverse}m`,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
      };

      newRecord.billed = true;
      newRecord.invoiceId = createdInvoice.id;
      newRecord.invoiceNumber = createdInvoice.invoiceNumber;

      // Update Party Dues
      const updatedParties = parties.map((p) => {
        if (p.id !== targetPartyObj!.id) return p;
        return {
          ...p,
          totalInvoiced: p.totalInvoiced + totalCost,
          currentDues: p.currentDues + totalCost,
        };
      });

      onSaveBillingData([createdInvoice, ...invoices], products, updatedParties);
      setSelectedInvoiceForPrint(createdInvoice);
    }

    onSaveFabricLosses([newRecord, ...fabricLosses]);
    setIsModalOpen(false);
  };

  const handleGenerateInvoiceForRecord = (record: FabricLossRecord) => {
    let targetPartyObj = parties.find((p) => p.id === record.partyId || p.name === record.partyName);
    if (!targetPartyObj) {
      targetPartyObj = parties[0];
    }
    if (!targetPartyObj) return;

    const invNum = `INV-LOSS-${Math.floor(100 + Math.random() * 900)}`;
    const unitRate = record.ratePerMeter || 150;
    const totalCost = record.metersLost * unitRate;

    const sampleItem: InvoiceItem = {
      id: `ii-sample-${Date.now()}`,
      productName: `Loss Fabric Issue (${record.lotNumber})`,
      designNumber: record.designNumber || record.designName || 'Fabric',
      quantity: record.metersLost,
      unitPrice: unitRate,
      totalPrice: totalCost,
      itemType: 'fabric_sample_loss',
      fabricLossId: record.id,
      lotNumber: record.lotNumber,
      meters: record.metersLost,
      frontMeters: record.frontMeters,
      reverseMeters: record.reverseMeters,
    };

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
      partyId: targetPartyObj.id,
      partyName: targetPartyObj.name,
      partyAddress: `${targetPartyObj.address}, ${targetPartyObj.city}`,
      partyPhone: targetPartyObj.phone,
      date: record.date || new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [sampleItem],
      subtotal: totalCost,
      taxRatePercent: 0,
      taxAmount: 0,
      discountAmount: 0,
      grandTotal: totalCost,
      amountPaid: 0,
      balanceDue: totalCost,
      status: 'Unpaid',
      notes: `Fabric Sample / Issue Bill: Lot ${record.lotNumber} (${record.designName || ''})`,
      currencyCode: currency.code,
      currencySymbol: currency.symbol,
    };

    // Mark loss record as billed
    const updatedLosses = fabricLosses.map((l) =>
      l.id === record.id ? { ...l, billed: true, invoiceId: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber } : l
    );

    // Update Party Dues
    const updatedParties = parties.map((p) => {
      if (p.id !== targetPartyObj!.id) return p;
      return {
        ...p,
        totalInvoiced: p.totalInvoiced + totalCost,
        currentDues: p.currentDues + totalCost,
      };
    });

    onSaveFabricLosses(updatedLosses);
    onSaveBillingData([newInvoice, ...invoices], products, updatedParties);
    setSelectedInvoiceForPrint(newInvoice);
  };

  const handleConfirmDeleteLoss = () => {
    if (lossToDelete) {
      // Restore meters back to the raw material lot fabric stock if available
      const targetLot = lots.find((l) => l.id === lossToDelete.lotId || l.lotNumber === lossToDelete.lotNumber);
      if (targetLot) {
        const front = Number(lossToDelete.frontMeters || 0);
        const reverse = Number(lossToDelete.reverseMeters || 0);
        const total = Number(lossToDelete.metersLost || (front + reverse) || 0);

        const updatedDesigns = targetLot.designs.map((d) => {
          if (d.designNumber !== lossToDelete.designNumber && (lossToDelete.designName && d.designName !== lossToDelete.designName)) {
            return d;
          }
          if (d.fabricType === 'single_roll' || d.fabricType === 'other') {
            const curTot = getDesignTotalMeters(d);
            return { ...d, totalMeters: curTot + total };
          } else {
            const newFront = (d.frontMeters || 0) + front;
            const newRev = (d.reverseMeters || 0) + reverse;
            return { ...d, frontMeters: newFront, reverseMeters: newRev, totalMeters: newFront + newRev };
          }
        });
        const updatedLots = lots.map((l) => (l.id === targetLot.id ? { ...l, designs: updatedDesigns } : l));
        onSaveLots(updatedLots);
      }

      onSaveFabricLosses(fabricLosses.filter((l) => l.id !== lossToDelete.id));
      setLossToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Loss Meters</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black tracking-tight text-amber-300">
            {totalAllLossMeters.toLocaleString()} <span className="text-xs font-normal text-slate-300">Meters</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Deducted from raw material fabric lots</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Issues & Samples</span>
            <UserCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">
            {totalCustomerLossMeters.toLocaleString()} <span className="text-xs font-normal text-slate-500">Meters</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sample cuts given to dealers & customers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cutting Scrap & Waste</span>
            <Scissors className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-800">
            {totalScrapLossMeters.toLocaleString()} <span className="text-xs font-normal text-slate-500">Meters</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Roll edge damages & defect trimmings</p>
        </div>

        <div className="bg-emerald-950 text-emerald-100 p-5 rounded-2xl shadow-sm border border-emerald-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Billed Party Samples</span>
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {billedCount} <span className="text-xs font-normal text-emerald-300">Invoiced</span>
          </div>
          <p className="text-[11px] text-emerald-300 mt-1">
            {unbilledCustomerSamplesCount > 0 ? (
              <span className="text-amber-300 font-bold">⚠️ {unbilledCustomerSamplesCount} unbilled sample(s) available</span>
            ) : (
              'All customer samples generated on bills'
            )}
          </p>
        </div>
      </div>

      {/* Main Header & Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Fabric Loss & Customer Issue Manager</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Record samples given to customers or cutting scrap. Losses directly deduct fabric stock from lots and can be billed.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record Loss / Customer Sample</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search lot, design, party, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="Loss Fabric">Loss Fabric</option>
              <option value="Given to Customer (Sample / Loss)">Customer Samples & Issues</option>
              <option value="Cutting Scrap & Waste">Cutting Scrap & Waste</option>
              <option value="Defect / Quality Damage">Defect & Quality Damage</option>
            </select>
          </div>

          <div>
            <select
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Billing Statuses</option>
              <option value="unbilled">Unbilled Samples (Needs Invoice)</option>
              <option value="billed">Invoiced / Billed to Party</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fabric Loss Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Fabric Loss & Sample Issue Registry ({filteredLosses.length})
          </span>
          <span className="text-xs text-slate-500">
            Auto-deducted directly from Lot Fabric Stock
          </span>
        </div>

        {filteredLosses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <AlertTriangle className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No fabric loss or sample records found.</p>
            <p className="text-xs">Click "Record Loss / Customer Sample" above to log new sample or scrap meters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Fabric Lot & Design</th>
                  <th className="p-3">Party / Customer</th>
                  <th className="p-3 text-right">Meters Lost</th>
                  <th className="p-3 text-right">Rate / Meter</th>
                  <th className="p-3 text-center">Billing & Invoice</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLosses.map((record) => {
                  const isCustomerSample = record.category.includes('Customer');
                  const totalEstimatedVal = (record.metersLost || 0) * (record.ratePerMeter || 0);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-600 whitespace-nowrap">
                        {record.date}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {isCustomerSample ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                            <UserCheck className="w-3 h-3 text-indigo-600" />
                            <span>Customer Sample</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px]">
                            <Scissors className="w-3 h-3 text-rose-600" />
                            <span>{record.category}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{record.lotNumber}</div>
                        <div className="text-[11px] text-slate-500">{record.designName || record.designNumber || 'Fabric Roll'}</div>
                      </td>

                      <td className="p-3">
                        {record.partyName ? (
                          <div>
                            <span className="font-bold text-slate-800">{record.partyName}</span>
                            {record.notes && <p className="text-[10px] text-slate-400 truncate max-w-xs">{record.notes}</p>}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Factory Internal Scrap</span>
                        )}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <span className="font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-xs inline-block">
                          -{record.metersLost} m
                        </span>
                        {(record.frontMeters !== undefined || record.reverseMeters !== undefined) && (
                          <div className="text-[10px] text-slate-600 font-bold mt-1">
                            Front: {record.frontMeters || 0}m | Rev: {record.reverseMeters || 0}m
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-700">
                        {record.ratePerMeter ? `${currSym} ${record.ratePerMeter}/m` : '-'}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        {record.billed ? (
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-[11px] rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Billed ({record.invoiceNumber || 'Invoice'})</span>
                          </div>
                        ) : (record.partyName || record.partyId) ? (
                          <button
                            onClick={() => handleGenerateInvoiceForRecord(record)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer transition active:scale-95"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Generate Bill</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Internal Waste</span>
                        )}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setLossToDelete(record)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Loss Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Record Fabric Loss / Customer Sample */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Record Fabric Loss / Customer Sample</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLossRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={lossDate}
                    onChange={(e) => setLossDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={lossCategory}
                    onChange={(e) => setLossCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
                  >
                    <option value="Loss Fabric">Loss Fabric</option>
                    <option value="Given to Customer (Sample / Loss)">Given to Customer (Sample / Loss)</option>
                    <option value="Cutting Scrap & Waste">Cutting Scrap & Waste</option>
                    <option value="Defect / Quality Damage">Defect / Quality Damage</option>
                    <option value="Other Loss">Other Fabric Loss</option>
                  </select>
                </div>
              </div>

              {/* Lot & Design Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fabric Lot #</label>
                  <select
                    value={selectedLotId}
                    onChange={(e) => handleLotSelectChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-indigo-900 bg-white"
                  >
                    {lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lotNumber} ({lot.supplierName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fabric Design / Roll</label>
                  <select
                    value={selectedDesignId}
                    onChange={(e) => setSelectedDesignId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                  >
                    {(currentLot?.designs || []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.designNumber} - {d.designName || 'Design'} ({getDesignTotalMeters(d)}m available)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Party Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Party Name</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedPartyId}
                    onChange={(e) => {
                      setSelectedPartyId(e.target.value);
                      if (e.target.value) setCustomPartyName('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="">-- Select Registered Party --</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.companyName})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or type Custom Customer Name"
                    value={customPartyName}
                    onChange={(e) => {
                      setCustomPartyName(e.target.value);
                      if (e.target.value) setSelectedPartyId('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Front & Reverse Meters Input */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                  <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">Feed Loss Fabric Breakdown</span>
                  <span className="text-xs font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300">
                    Total Loss: {calculatedTotalMeters} m
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Front Meters</label>
                    <input
                      type="number"
                      min="0"
                      value={lossFrontMeters || ''}
                      onChange={(e) => setLossFrontMeters(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-extrabold text-slate-900 bg-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Reverse Meters</label>
                    <input
                      type="number"
                      min="0"
                      value={lossReverseMeters || ''}
                      onChange={(e) => setLossReverseMeters(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-extrabold text-slate-900 bg-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rate / Meter ({currSym})</label>
                    <input
                      type="number"
                      min="0"
                      value={ratePerMeter || ''}
                      onChange={(e) => setRatePerMeter(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-bold text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                  placeholder="e.g. Loss fabric Front & Reverse issue for party"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              {/* Automatic Actions Checkboxes */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={autoDeductLot}
                    onChange={(e) => setAutoDeductLot(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Automatically deduct {calculatedTotalMeters}m from Lot Fabric Stock</span>
                </label>

                {(selectedPartyId || customPartyName) && (
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-indigo-900">
                    <input
                      type="checkbox"
                      checked={generateInvoiceNow}
                      onChange={(e) => setGenerateInvoiceNow(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span>Generate Bill / Invoice immediately for Loss Fabric ({currSym} {(calculatedTotalMeters * (ratePerMeter || 0)).toLocaleString()})</span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save & Apply Lot Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!lossToDelete}
        title="Delete Fabric Loss Record"
        itemName={lossToDelete ? `${lossToDelete.lotNumber} - ${lossToDelete.designName || lossToDelete.designNumber} (${lossToDelete.metersLost}m)` : undefined}
        message={lossToDelete ? `Are you sure you want to delete this loss record for Lot ${lossToDelete.lotNumber} (${lossToDelete.metersLost} meters)? The fabric meters will be restored back to the Lot stock.` : ''}
        confirmText="Yes, Delete Record"
        onConfirm={handleConfirmDeleteLoss}
        onClose={() => setLossToDelete(null)}
      />

      {/* Printable Bill Modal for newly generated invoice */}
      {selectedInvoiceForPrint && (
        <PrintableBillModal
          invoice={selectedInvoiceForPrint}
          currency={currency}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};

