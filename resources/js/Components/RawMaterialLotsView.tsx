// @ts-nocheck
import React, { useState } from 'react';
import { FabricLot, FabricDesign, FabricLossRecord, FabricTypeCategory, CurrencyOption } from '../types';
import { getDesignTotalMeters } from '../lib/storage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { matchesDesignSearch } from '../lib/designSearch';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
  Ruler,
  Search,
  AlertTriangle,
  UserCheck,
  Scissors,
  Tag,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
} from 'lucide-react';

interface RawMaterialLotsViewProps {
  lots: FabricLot[];
  onSaveLots: (lots: FabricLot[]) => void;
  fabricLosses?: FabricLossRecord[];
  onSaveFabricLosses?: (losses: FabricLossRecord[]) => void;
  currency?: CurrencyOption;
}

export const RawMaterialLotsView: React.FC<RawMaterialLotsViewProps> = ({
  lots,
  onSaveLots,
  fabricLosses = [],
  onSaveFabricLosses,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'lots' | 'losses'>('lots');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [lotToDelete, setLotToDelete] = useState<FabricLot | null>(null);
  const [selectedLotDetails, setSelectedLotDetails] = useState<FabricLot | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Fabric Lot
  const [lotNumber, setLotNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [designs, setDesigns] = useState<FabricDesign[]>([
    { id: 'design-1', designNumber: '', designName: '', frontMeters: 0, reverseMeters: 0, fabricType: 'bedsheet_set' },
  ]);

  // Supplier Payment Form State for Lot
  const [ratePerMeter, setRatePerMeter] = useState<number | undefined>(undefined);
  const [totalCost, setTotalCost] = useState<number | undefined>(undefined);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Unpaid'>('Unpaid');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Quick Payment Update Modal
  const [quickPayLot, setQuickPayLot] = useState<FabricLot | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(0);
  const [quickPayNotes, setQuickPayNotes] = useState<string>('');

  // Fabric Loss / Customer Sample Modal State
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [lossToDelete, setLossToDelete] = useState<FabricLossRecord | null>(null);
  const [lossDate, setLossDate] = useState(new Date().toISOString().split('T')[0]);
  const [lossLotNumber, setLossLotNumber] = useState('');
  const [lossDesignName, setLossDesignName] = useState('');
  const [lossCategory, setLossCategory] = useState<
    'Given to Customer (Sample / Loss)' | 'Cutting Scrap & Waste' | 'Defect / Quality Damage' | 'Other Loss'
  >('Given to Customer (Sample / Loss)');
  const [lossPartyName, setLossPartyName] = useState('');
  const [lossMeters, setLossMeters] = useState<number>(10);
  const [lossNotes, setLossNotes] = useState('');
  const [lossFilterCategory, setLossFilterCategory] = useState<string>('all');
  const [lotPaymentFilter, setLotPaymentFilter] = useState<'all' | 'has_dues' | 'paid'>('all');
  const [lotFabricTypeFilter, setLotFabricTypeFilter] = useState<'all' | 'bedsheet_set' | 'other'>('all');

  // Calculations across ALL lots
  let overallFrontMeters = 0;
  let overallReverseMeters = 0;
  let overallSingleOtherMeters = 0;
  let overallTotalPurchaseCost = 0;
  let overallTotalAmountPaid = 0;

  lots.forEach((lot) => {
    let lotMeters = 0;
    lot.designs.forEach((d) => {
      const m = getDesignTotalMeters(d);
      lotMeters += m;
      if (d.fabricType === 'other' || d.fabricType === 'single_roll' || d.fabricType === 'quilting_fabric') {
        overallSingleOtherMeters += m;
      } else {
        overallFrontMeters += Number(d.frontMeters || 0);
        overallReverseMeters += Number(d.reverseMeters || 0);
      }
    });

    const lotCost = lot.totalCost !== undefined ? lot.totalCost : (lot.ratePerMeter ? lotMeters * lot.ratePerMeter : 0);
    const lotPaid = Number(lot.amountPaid || 0);
    overallTotalPurchaseCost += lotCost;
    overallTotalAmountPaid += lotPaid;
  });

  const overallGrandTotalMeters = overallFrontMeters + overallReverseMeters + overallSingleOtherMeters;
  const overallBalancePayable = Math.max(0, overallTotalPurchaseCost - overallTotalAmountPaid);

  // Fabric Loss Stats
  const totalCustomerLossMeters = fabricLosses
    .filter((l) => l.category.includes('Customer'))
    .reduce((sum, l) => sum + Number(l.metersLost || 0), 0);

  const totalScrapLossMeters = fabricLosses
    .filter((l) => !l.category.includes('Customer'))
    .reduce((sum, l) => sum + Number(l.metersLost || 0), 0);

  const totalAllLossMeters = totalCustomerLossMeters + totalScrapLossMeters;
  const netAvailableFabricMeters = Math.max(0, overallGrandTotalMeters - totalAllLossMeters);

  const handleOpenAddModal = () => {
    setEditingLotId(null);
    setLotNumber(`LOT-${new Date().getFullYear()}-${String(lots.length + 1).padStart(3, '0')}`);
    setSupplierName('');
    setSupplierAddress('');
    setDateReceived(new Date().toISOString().split('T')[0]);
    setNotes('');
    setDesigns([
      { id: `design-${Date.now()}`, designNumber: '', designName: '', frontMeters: 0, reverseMeters: 0, fabricType: 'bedsheet_set' },
    ]);
    setRatePerMeter(undefined);
    setTotalCost(undefined);
    setAmountPaid(0);
    setPaymentStatus('Unpaid');
    setPaymentNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lot: FabricLot) => {
    setEditingLotId(lot.id);
    setLotNumber(lot.lotNumber);
    setSupplierName(lot.supplierName);
    setSupplierAddress(lot.supplierAddress || '');
    setDateReceived(lot.dateReceived);
    setNotes(lot.notes || '');
    setDesigns(
      lot.designs.length > 0
        ? lot.designs.map((d) => ({
            ...d,
            fabricType: (d.fabricType === 'other' || d.fabricType === 'single_roll' || d.fabricType === 'quilting_fabric') ? 'other' : 'bedsheet_set',
          }))
        : [{ id: 'd-1', designNumber: '', designName: '', frontMeters: 0, reverseMeters: 0, fabricType: 'bedsheet_set' }]
    );
    setRatePerMeter(lot.ratePerMeter);
    setTotalCost(lot.totalCost);
    setAmountPaid(lot.amountPaid || 0);
    setPaymentStatus(lot.paymentStatus || (lot.amountPaid && lot.totalCost && lot.amountPaid >= lot.totalCost ? 'Paid' : lot.amountPaid ? 'Partial' : 'Unpaid'));
    setPaymentNotes(lot.paymentNotes || '');
    setIsModalOpen(true);
  };

  const handleAddDesignRow = () => {
    setDesigns((prev) => [
      ...prev,
      {
        id: `design-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        designNumber: `DS-${Math.floor(100 + Math.random() * 900)}`,
        designName: '',
        frontMeters: 0,
        reverseMeters: 0,
        fabricType: 'bedsheet_set',
        totalMeters: 0,
      },
    ]);
  };

  const handleRemoveDesignRow = (index: number) => {
    setDesigns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDesignChange = (index: number, field: keyof FabricDesign, value: any) => {
    setDesigns((prev) => {
      const updatedList = prev.map((item, i) => {
        if (i !== index) return item;

        const updated = { ...item, [field]: value };
        if (field === 'fabricType') {
          if (value === 'other') {
            updated.frontMeters = 0;
            updated.reverseMeters = 0;
            if (!updated.totalMeters) updated.totalMeters = 200;
          } else {
            if (!updated.frontMeters && !updated.reverseMeters && updated.totalMeters) {
              updated.frontMeters = Math.round(updated.totalMeters / 2);
              updated.reverseMeters = Math.round(updated.totalMeters / 2);
            }
          }
        }
        return updated;
      });

      // Recalculate estimated total cost if ratePerMeter is defined
      if (ratePerMeter && ratePerMeter > 0) {
        const sumMeters = updatedList.reduce((acc, d) => acc + getDesignTotalMeters(d), 0);
        setTotalCost(sumMeters * ratePerMeter);
      }

      return updatedList;
    });
  };

  const handleRateChange = (rateVal: number | undefined) => {
    setRatePerMeter(rateVal);
    if (rateVal && rateVal > 0) {
      const sumMeters = designs.reduce((acc, d) => acc + getDesignTotalMeters(d), 0);
      const computedTotal = sumMeters * rateVal;
      setTotalCost(computedTotal);
      if (amountPaid >= computedTotal && computedTotal > 0) {
        setPaymentStatus('Paid');
      } else if (amountPaid > 0) {
        setPaymentStatus('Partial');
      } else {
        setPaymentStatus('Unpaid');
      }
    }
  };

  const handleTotalCostChange = (costVal: number | undefined) => {
    setTotalCost(costVal);
    const effectiveCost = costVal !== undefined ? costVal : (ratePerMeter ? designs.reduce((acc, d) => acc + getDesignTotalMeters(d), 0) * ratePerMeter : 0);
    if (effectiveCost > 0 && amountPaid >= effectiveCost) {
      setPaymentStatus('Paid');
    } else if (amountPaid > 0) {
      setPaymentStatus('Partial');
    } else {
      setPaymentStatus('Unpaid');
    }
  };

  const handleAmountPaidChange = (paidVal: number) => {
    setAmountPaid(paidVal);
    const effectiveTotal = totalCost !== undefined ? totalCost : (ratePerMeter ? designs.reduce((acc, d) => acc + getDesignTotalMeters(d), 0) * ratePerMeter : 0);
    if (effectiveTotal > 0 && paidVal >= effectiveTotal) {
      setPaymentStatus('Paid');
    } else if (paidVal > 0) {
      setPaymentStatus('Partial');
    } else {
      setPaymentStatus('Unpaid');
    }
  };

  const handleSaveLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotNumber.trim()) return;

    const sanitizedDesigns = designs.map((d) => {
      if (d.fabricType === 'other' || d.fabricType === 'single_roll' || d.fabricType === 'quilting_fabric') {
        return {
          ...d,
          fabricType: 'other' as FabricTypeCategory,
          frontMeters: 0,
          reverseMeters: 0,
          totalMeters: Number(d.totalMeters) || 0,
        };
      }
      return {
        ...d,
        fabricType: 'bedsheet_set' as FabricTypeCategory,
        frontMeters: Number(d.frontMeters) || 0,
        reverseMeters: Number(d.reverseMeters) || 0,
        totalMeters: (Number(d.frontMeters) || 0) + (Number(d.reverseMeters) || 0),
      };
    });

    const sumMeters = sanitizedDesigns.reduce((acc, d) => acc + getDesignTotalMeters(d), 0);
    const finalTotalCost = totalCost !== undefined ? Number(totalCost) : (ratePerMeter ? sumMeters * ratePerMeter : 0);
    const finalAmountPaid = Number(amountPaid) || 0;
    let finalStatus = paymentStatus;
    if (finalTotalCost > 0 && finalAmountPaid >= finalTotalCost) {
      finalStatus = 'Paid';
    } else if (finalAmountPaid > 0) {
      finalStatus = 'Partial';
    } else {
      finalStatus = 'Unpaid';
    }

    if (editingLotId) {
      const updated = lots.map((lot) =>
        lot.id === editingLotId
          ? {
              ...lot,
              lotNumber,
              supplierName,
              supplierAddress: supplierAddress.trim() || undefined,
              dateReceived,
              notes,
              designs: sanitizedDesigns,
              ratePerMeter: ratePerMeter ? Number(ratePerMeter) : undefined,
              totalCost: finalTotalCost,
              amountPaid: finalAmountPaid,
              paymentStatus: finalStatus,
              paymentNotes,
            }
          : lot
      );
      onSaveLots(updated);
    } else {
      const newLot: FabricLot = {
        id: `lot-${Date.now()}`,
        lotNumber,
        supplierName,
        supplierAddress: supplierAddress.trim() || undefined,
        dateReceived,
        notes,
        designs: sanitizedDesigns,
        ratePerMeter: ratePerMeter ? Number(ratePerMeter) : undefined,
        totalCost: finalTotalCost,
        amountPaid: finalAmountPaid,
        paymentStatus: finalStatus,
        paymentNotes,
      };
      onSaveLots([newLot, ...lots]);
    }

    setIsModalOpen(false);
  };

  // Quick Payment Update Handler
  const handleOpenQuickPay = (lot: FabricLot) => {
    setQuickPayLot(lot);
    setQuickPayAmount(lot.amountPaid || 0);
    setQuickPayNotes(lot.paymentNotes || '');
  };

  const handleSaveQuickPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayLot) return;

    const lotMeters = quickPayLot.designs.reduce((acc, d) => acc + getDesignTotalMeters(d), 0);
    const lotCost = quickPayLot.totalCost !== undefined ? quickPayLot.totalCost : (quickPayLot.ratePerMeter ? lotMeters * quickPayLot.ratePerMeter : 0);
    const paidVal = Number(quickPayAmount) || 0;

    let status: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (lotCost > 0 && paidVal >= lotCost) {
      status = 'Paid';
    } else if (paidVal > 0) {
      status = 'Partial';
    }

    const updatedLots = lots.map((lot) => {
      if (lot.id !== quickPayLot.id) return lot;
      return {
        ...lot,
        amountPaid: paidVal,
        paymentStatus: status,
        paymentNotes: quickPayNotes,
      };
    });

    onSaveLots(updatedLots);
    setQuickPayLot(null);
  };

  const handleDeleteLot = (lotId: string) => {
    const target = lots.find((l) => l.id === lotId);
    if (target) {
      setLotToDelete(target);
    }
  };

  const handleConfirmDeleteLot = () => {
    if (lotToDelete) {
      onSaveLots(lots.filter((l) => l.id !== lotToDelete.id));
      setLotToDelete(null);
    }
  };

  // Loss Handlers
  const handleOpenAddLossModal = () => {
    setLossDate(new Date().toISOString().split('T')[0]);
    setLossLotNumber(lots[0]?.lotNumber || 'LOT-2026-101');
    setLossDesignName(lots[0]?.designs[0]?.designName || 'General Sample');
    setLossCategory('Given to Customer (Sample / Loss)');
    setLossPartyName('');
    setLossMeters(10);
    setLossNotes('');
    setIsLossModalOpen(true);
  };

  const handleSaveLossRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lossMeters || lossMeters <= 0) return;

    const selectedLotObj = lots.find((l) => l.lotNumber === lossLotNumber);

    const newRecord: FabricLossRecord = {
      id: `floss-${Date.now()}`,
      date: lossDate,
      lotId: selectedLotObj?.id,
      lotNumber: lossLotNumber,
      designName: lossDesignName,
      category: lossCategory,
      partyName: lossPartyName,
      metersLost: Number(lossMeters),
      notes: lossNotes,
    };

    // Auto-Deduct meters directly from the lot fabric stock
    if (selectedLotObj) {
      const updatedLots = lots.map((lot) => {
        if (lot.id !== selectedLotObj.id) return lot;

        const updatedDesigns = lot.designs.map((d) => {
          const isMatch =
            (d.designName && d.designName === lossDesignName) ||
            (d.designNumber && lossDesignName.includes(d.designNumber)) ||
            lot.designs.length === 1;

          if (!isMatch) return d;

          const metersToSubtract = Number(lossMeters);
          if (d.fabricType === 'other' || d.fabricType === 'single_roll' || d.fabricType === 'quilting_fabric') {
            const curTot = getDesignTotalMeters(d);
            const newTot = Math.max(0, curTot - metersToSubtract);
            return { ...d, totalMeters: newTot, frontMeters: 0, reverseMeters: 0 };
          } else {
            const half = metersToSubtract / 2;
            const newFront = Math.max(0, (d.frontMeters || 0) - half);
            const newRev = Math.max(0, (d.reverseMeters || 0) - half);
            const newTot = newFront + newRev;
            return { ...d, frontMeters: newFront, reverseMeters: newRev, totalMeters: newTot };
          }
        });

        return { ...lot, designs: updatedDesigns };
      });

      onSaveLots(updatedLots);
    }

    if (onSaveFabricLosses) {
      onSaveFabricLosses([newRecord, ...fabricLosses]);
    }
    setIsLossModalOpen(false);
  };

  const handleConfirmDeleteLoss = () => {
    if (lossToDelete && onSaveFabricLosses) {
      onSaveFabricLosses(fabricLosses.filter((l) => l.id !== lossToDelete.id));
      setLossToDelete(null);
    }
  };

  // Filtering Lots
  const filteredLots = lots.filter((lot) => {
    // 1. Payment Status Filter
    let lotTotalMeters = 0;
    lot.designs.forEach((d) => {
      lotTotalMeters += getDesignTotalMeters(d);
    });
    const lotPurchaseCost = lot.totalCost !== undefined ? lot.totalCost : (lot.ratePerMeter ? lotTotalMeters * lot.ratePerMeter : 0);
    const lotPaid = Number(lot.amountPaid || 0);
    const lotBalance = Math.max(0, lotPurchaseCost - lotPaid);

    if (lotPaymentFilter === 'has_dues' && lotBalance <= 0) return false;
    if (lotPaymentFilter === 'paid' && lotBalance > 0) return false;

    // 2. Fabric Type Filter
    if (lotFabricTypeFilter === 'bedsheet_set') {
      const hasBedsheet = lot.designs.some((d) => d.fabricType === 'bedsheet_set' || (!d.fabricType && (d.frontMeters > 0 || d.reverseMeters > 0)));
      if (!hasBedsheet) return false;
    } else if (lotFabricTypeFilter === 'other') {
      const hasOther = lot.designs.some((d) => d.fabricType === 'other');
      if (!hasOther) return false;
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchLotNo = lot.lotNumber.toLowerCase().includes(q);
      const matchSupplier = (lot.supplierName || '').toLowerCase().includes(q);
      const matchDesign = lot.designs.some(
        (d) =>
          matchesDesignSearch(d.designNumber, searchQuery) ||
          (d.designName || '').toLowerCase().includes(q) ||
          (d.customFabricName || '').toLowerCase().includes(q)
      );
      if (!matchLotNo && !matchSupplier && !matchDesign) {
        return false;
      }
    }

    return true;
  });

  const filteredLosses = fabricLosses.filter((record) => {
    if (lossFilterCategory === 'customer') {
      return record.category.includes('Customer');
    }
    if (lossFilterCategory === 'scrap') {
      return !record.category.includes('Customer');
    }
    return true;
  });

  // Calculate modal dynamic totals
  const modalTotalMeters = designs.reduce((acc, d) => acc + getDesignTotalMeters(d), 0);
  const modalComputedCost = totalCost !== undefined ? totalCost : (ratePerMeter ? modalTotalMeters * ratePerMeter : 0);
  const modalBalanceDue = Math.max(0, modalComputedCost - amountPaid);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Raw Material Fabric Lots, Supplier Payments & Loss Tracker
            </h2>
            <p className="text-xs text-slate-500">
              Manage incoming fabric lots, track purchase payments to suppliers, and record customer samples or cutting losses.
            </p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('lots')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'lots'
                ? 'bg-white text-indigo-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fabric Lots ({lots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('losses')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'losses'
                ? 'bg-white text-amber-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Customer Loss & Scrap ({fabricLosses.length})</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-2xs border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Gross Fabric Stock</span>
            <Ruler className="w-4 h-4 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black">{overallGrandTotalMeters.toLocaleString()} <span className="text-xs font-semibold text-slate-300">Mtrs</span></h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all inward lots & rolls</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Net Available Fabric</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-black text-emerald-950">{netAvailableFabricMeters.toLocaleString()} <span className="text-xs font-bold text-emerald-700">Mtrs</span></h2>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Ready for cutting & production</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Purchase Cost</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Rs. {overallTotalPurchaseCost.toLocaleString()}</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Total fabric invoice value</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Amount Paid</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-emerald-900">Rs. {overallTotalAmountPaid.toLocaleString()}</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Paid to fabric suppliers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Supplier Balance Due</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-amber-950">Rs. {overallBalancePayable.toLocaleString()}</h2>
          <p className="text-[11px] text-amber-700 font-medium mt-0.5">Remaining payable to mills</p>
        </div>
      </div>

      {activeTab === 'lots' && (
        <>
          {/* Action Header & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Fabric Lots & Roll Registry</h3>
                <p className="text-xs text-slate-500">Supports Bedsheets (Front + Rev), Other Custom Fabrics (White, Macro, etc.), and Supplier Payment Tracking</p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Fabric Lot</span>
              </button>
            </div>

            {/* Live Search & Filter Row */}
            <div className="border-t border-slate-100 pt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search fabric lots by Lot Number, Supplier Name, Design # or Custom Fabric..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={lotPaymentFilter}
                  onChange={(e) => setLotPaymentFilter(e.target.value as 'all' | 'has_dues' | 'paid')}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="has_dues">⚠️ Pending Supplier Dues</option>
                  <option value="paid">✅ Fully Paid</option>
                </select>

                <select
                  value={lotFabricTypeFilter}
                  onChange={(e) => setLotFabricTypeFilter(e.target.value as 'all' | 'bedsheet_set' | 'other')}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Fabric Types</option>
                  <option value="bedsheet_set">Bedsheet Sets (Front + Rev)</option>
                  <option value="other">Other Fabrics (White, Macro, etc.)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lot Cards List */}
          <div className="space-y-4">
            {filteredLots.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                No matching fabric lots found. Try adjusting your search query or click <strong>+ Add New Fabric Lot</strong>.
              </div>
            ) : (
              filteredLots.map((lot) => {
                let lotTotalMeters = 0;
                lot.designs.forEach((d) => {
                  lotTotalMeters += getDesignTotalMeters(d);
                });

                const lotPurchaseCost = lot.totalCost !== undefined ? lot.totalCost : (lot.ratePerMeter ? lotTotalMeters * lot.ratePerMeter : 0);
                const lotPaid = Number(lot.amountPaid || 0);
                const lotBalance = Math.max(0, lotPurchaseCost - lotPaid);
                const lotStatus = lot.paymentStatus || (lotPurchaseCost > 0 && lotPaid >= lotPurchaseCost ? 'Paid' : lotPaid > 0 ? 'Partial' : 'Unpaid');

                return (
                  <div key={lot.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {/* Lot Card Header */}
                    <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold text-slate-900">{lot.lotNumber}</h3>
                            <span className="px-2.5 py-0.5 text-xs bg-indigo-50 text-indigo-700 font-extrabold rounded-full border border-indigo-200">
                              {lot.designs.length} Fabric Item{lot.designs.length > 1 ? 's' : ''}
                            </span>
                            {/* Payment Status Badge */}
                            <span
                              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1 ${
                                lotStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : lotStatus === 'Partial'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              <span>Payment: {lotStatus}</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Supplier: <span className="font-semibold text-slate-700">{lot.supplierName || 'N/A'}</span>
                            {lot.supplierAddress ? <span className="text-slate-400"> ({lot.supplierAddress})</span> : null} | Received: {lot.dateReceived}
                            {lot.ratePerMeter ? <span className="ml-2 font-medium text-slate-600">(@ Rs. {lot.ratePerMeter}/m)</span> : null}
                          </p>
                        </div>
                      </div>

                      {/* Lot Meter & Payment Summary */}
                      <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto text-xs">
                        <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-black">
                          <span className="text-indigo-200 block text-[9px] uppercase font-bold">Total Meters</span>
                          <span>{lotTotalMeters.toLocaleString()} m</span>
                        </div>

                        {lotPurchaseCost > 0 && (
                          <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-800">
                            <span className="text-slate-500 block text-[9px] uppercase font-bold">Cost / Paid</span>
                            <span className="font-bold">Rs. {lotPurchaseCost.toLocaleString()}</span>
                            <span className="text-emerald-700 font-semibold ml-1">({lotPaid.toLocaleString()} paid)</span>
                          </div>
                        )}

                        {lotBalance > 0 && (
                          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-900">
                            <span className="text-amber-700 block text-[9px] uppercase font-bold">Balance Due</span>
                            <span className="font-extrabold">Rs. {lotBalance.toLocaleString()}</span>
                          </div>
                        )}

                        <button
                          onClick={() => handleOpenQuickPay(lot)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-extrabold text-[11px] transition cursor-pointer flex items-center space-x-1"
                          title="Record / Update Supplier Payment"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pay Supplier</span>
                        </button>

                        <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
                          <button
                            onClick={() => setSelectedLotDetails(lot)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Show Lot Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(lot)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Lot"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLot(lot.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Delete Lot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Designs Table under Lot */}
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/70 text-slate-600 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
                            <th className="py-2.5 px-3">Fabric Type</th>
                            <th className="py-2.5 px-3">Design / Code #</th>
                            <th className="py-2.5 px-3">Fabric Name / Pattern</th>
                            <th className="py-2.5 px-3 text-right text-blue-700">Front (Mtr)</th>
                            <th className="py-2.5 px-3 text-right text-purple-700">Reverse (Mtr)</th>
                            <th className="py-2.5 px-3 text-right text-slate-900 font-extrabold">Total Meters</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lot.designs.map((d) => {
                            const isOther = d.fabricType === 'other' || d.fabricType === 'single_roll' || d.fabricType === 'quilting_fabric';
                            const front = Number(d.frontMeters || 0);
                            const reverse = Number(d.reverseMeters || 0);
                            const total = getDesignTotalMeters(d);

                            return (
                              <tr key={d.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-2.5 px-3">
                                  {isOther ? (
                                    <span className="px-2 py-0.5 bg-purple-50 text-purple-800 font-extrabold text-[10px] rounded-md border border-purple-200">
                                      Other Fabric
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-extrabold text-[10px] rounded-md border border-blue-200">
                                      Front & Reverse (Bedsheet Set)
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{d.designNumber}</td>
                                <td className="py-2.5 px-3 text-slate-700 font-semibold">{d.designName || 'Pattern / Roll'}</td>

                                <td className="py-2.5 px-3 text-right font-semibold text-blue-600">
                                  {isOther ? '-' : `${front.toLocaleString()} m`}
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold text-purple-600">
                                  {isOther ? '-' : `${reverse.toLocaleString()} m`}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-slate-900 bg-slate-50/80">
                                  {total.toLocaleString()} m
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Payment notes & remarks if present */}
                      {(lot.notes || lot.paymentNotes) && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                          {lot.notes && (
                            <div>
                              <span className="font-bold text-slate-700">Remarks:</span> {lot.notes}
                            </div>
                          )}
                          {lot.paymentNotes && (
                            <div className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                              <span className="font-bold">Payment Note:</span> {lot.paymentNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Detail modal for selected fabric lot */}
      {selectedLotDetails && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLotDetails(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 cursor-default max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedLotDetails.lotNumber}</h3>
                <p className="text-xs text-slate-500">Full fabric lot details</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLotDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-slate-500 mb-1">Supplier</div>
                <div className="font-extrabold text-slate-900">{selectedLotDetails.supplierName || 'N/A'}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-slate-500 mb-1">Date received</div>
                <div className="font-extrabold text-slate-900">{selectedLotDetails.dateReceived}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-slate-500 mb-1">Rate / Meter</div>
                <div className="font-extrabold text-slate-900">{selectedLotDetails.ratePerMeter ? `Rs. ${selectedLotDetails.ratePerMeter}` : 'N/A'}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-slate-500 mb-1">Payment status</div>
                <div className="font-extrabold text-slate-900">{selectedLotDetails.paymentStatus || 'Unpaid'}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 md:col-span-2">
                <div className="text-slate-500 mb-1">Supplier address</div>
                <div className="font-extrabold text-slate-900">{selectedLotDetails.supplierAddress || 'Not provided'}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-slate-500 mb-1">Total cost</div>
                <div className="font-extrabold text-slate-900">Rs. {Number(selectedLotDetails.totalCost || 0).toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-slate-500 mb-1">Amount paid</div>
                <div className="font-extrabold text-slate-900">Rs. {Number(selectedLotDetails.amountPaid || 0).toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 md:col-span-2">
                <div className="text-slate-500 mb-1">Notes</div>
                <div className="font-extrabold text-slate-900">{selectedLotDetails.notes || 'No notes added'}</div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">Design items</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-200">
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Design #</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3 text-right">Front</th>
                      <th className="py-2 px-3 text-right">Reverse</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedLotDetails.designs.map((item) => {
                      const isOther = item.fabricType === 'other' || item.fabricType === 'single_roll' || item.fabricType === 'quilting_fabric';
                      const total = getDesignTotalMeters(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            {isOther ? (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-800 font-extrabold text-[10px] rounded-md border border-purple-200">
                                Other Fabric
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-extrabold text-[10px] rounded-md border border-blue-200">
                                Bedsheet Set
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.designNumber || 'N/A'}</td>
                          <td className="py-2 px-3 text-slate-700">{item.designName || 'Not named'}</td>
                          <td className="py-2 px-3 text-right text-blue-700">{isOther ? '-' : `${Number(item.frontMeters || 0).toLocaleString()} m`}</td>
                          <td className="py-2 px-3 text-right text-purple-700">{isOther ? '-' : `${Number(item.reverseMeters || 0).toLocaleString()} m`}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-900">{total.toLocaleString()} m</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fabric Loss View Tab */}
      {activeTab === 'losses' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Customer Samples & Scrap Fabric Loss Log</h3>
              <p className="text-xs text-slate-500">Deducts fabric meters from lot stock when given to customers or wasted during production</p>
            </div>
            <button
              onClick={handleOpenAddLossModal}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Customer Loss / Sample</span>
            </button>
          </div>

          {/* Loss Filter Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setLossFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                lossFilterCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All Losses ({fabricLosses.length})
            </button>
            <button
              onClick={() => setLossFilterCategory('customer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                lossFilterCategory === 'customer' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Customer Samples ({fabricLosses.filter((l) => l.category.includes('Customer')).length})
            </button>
            <button
              onClick={() => setLossFilterCategory('scrap')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                lossFilterCategory === 'scrap' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Scrap & Defect ({fabricLosses.filter((l) => !l.category.includes('Customer')).length})
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Lot #</th>
                    <th className="py-3 px-4">Design / Fabric</th>
                    <th className="py-3 px-4">Loss Category</th>
                    <th className="py-3 px-4">Customer / Party</th>
                    <th className="py-3 px-4 text-right">Meters Lost</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLosses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        No fabric loss records found.
                      </td>
                    </tr>
                  ) : (
                    filteredLosses.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800">{rec.date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.lotNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{rec.designName || '-'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              rec.category.includes('Customer')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{rec.partyName || '-'}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-600 bg-rose-50/50">
                          {rec.metersLost} m
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{rec.notes || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setLossToDelete(rec)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Fabric Lot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 relative animate-in fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingLotId ? 'Edit Fabric Lot & Supplier Payment' : 'Record New Inward Fabric Lot'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLot} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lot Number *</label>
                  <input
                    type="text"
                    required
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="e.g. LOT-2026-105"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Sunrise Textile Mill"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Address</label>
                  <input
                    type="text"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    placeholder="e.g. Mills Road, Faisalabad"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Received *</label>
                  <input
                    type="date"
                    required
                    value={dateReceived}
                    onChange={(e) => setDateReceived(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Design & Fabric Types Section */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Fabric Items & Meterage</h4>
                    <p className="text-[11px] text-slate-500">Choose between Front & Reverse (Bedsheet Set) or Other Fabric (Custom name & total meters)</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDesignRow}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Fabric Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {designs.map((d, index) => {
                    const isOther = d.fabricType === 'other' || d.fabricType === 'single_roll' || d.fabricType === 'quilting_fabric';

                    return (
                      <div key={d.id} className="grid grid-cols-12 gap-2.5 items-center bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
                        {/* Type Selector */}
                        <div className="col-span-12 sm:col-span-3">
                          <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">Fabric Type</label>
                          <select
                            value={isOther ? 'other' : 'bedsheet_set'}
                            onChange={(e) => handleDesignChange(index, 'fabricType', e.target.value as FabricTypeCategory)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-slate-50"
                          >
                            <option value="bedsheet_set">Front & Reverse (Bedsheet Set)</option>
                            <option value="other">Other Fabric (Custom / Single Roll)</option>
                          </select>
                        </div>

                        {/* Design Number */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">Design / Code #</label>
                          <input
                            type="text"
                            placeholder="DS-101"
                            value={d.designNumber}
                            onChange={(e) => handleDesignChange(index, 'designNumber', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 font-mono"
                          />
                        </div>

                        {/* Fabric / Design Name */}
                        <div className={isOther ? 'col-span-8 sm:col-span-4' : 'col-span-8 sm:col-span-3'}>
                          <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">
                            {isOther ? 'Fabric Name (e.g. White, Macro, Lining)' : 'Pattern / Design Name'}
                          </label>
                          <input
                            type="text"
                            placeholder={isOther ? 'e.g. White Fabric / Macro / Poly' : 'e.g. Royal Floral Red'}
                            value={d.designName}
                            onChange={(e) => handleDesignChange(index, 'designName', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold"
                          />
                        </div>

                        {/* Meters Inputs: EQUAL AND SPACIOUS COLUMNS FOR FRONT & REVERSE */}
                        {isOther ? (
                          <div className="col-span-10 sm:col-span-2">
                            <label className="block text-[10px] font-extrabold text-purple-700 mb-0.5">Total Meters</label>
                            <input
                              type="number"
                              placeholder="Total Mtr"
                              min="0"
                              value={d.totalMeters || ''}
                              onChange={(e) => handleDesignChange(index, 'totalMeters', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-purple-400 rounded-lg text-xs font-black text-purple-900 bg-purple-50/50"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="col-span-5 sm:col-span-2">
                              <label className="block text-[10px] font-extrabold text-blue-700 mb-0.5">Front (Mtr)</label>
                              <input
                                type="number"
                                placeholder="Front Mtr"
                                min="0"
                                value={d.frontMeters || ''}
                                onChange={(e) => handleDesignChange(index, 'frontMeters', Number(e.target.value))}
                                className="w-full px-2 py-1.5 border border-blue-300 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50/20"
                              />
                            </div>
                            <div className="col-span-5 sm:col-span-2">
                              <label className="block text-[10px] font-extrabold text-purple-700 mb-0.5">Reverse (Mtr)</label>
                              <input
                                type="number"
                                placeholder="Reverse Mtr"
                                min="0"
                                value={d.reverseMeters || ''}
                                onChange={(e) => handleDesignChange(index, 'reverseMeters', Number(e.target.value))}
                                className="w-full px-2 py-1.5 border border-purple-300 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50/20"
                              />
                            </div>
                          </>
                        )}

                        <div className="col-span-2 sm:col-span-1 flex items-center justify-end pt-3">
                          {designs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDesignRow(index)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-right text-xs font-extrabold text-slate-700 pt-1">
                  Lot Total Fabric:{' '}
                  <span className="text-indigo-600 font-black">{modalTotalMeters.toLocaleString()} Meters</span>
                </div>
              </div>

              {/* Supplier Purchase & Payment Details Card */}
              <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center space-x-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <span>Supplier Purchase Cost & Payment Details (Kitni Payment Ki Hai)</span>
                  </h4>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${
                      paymentStatus === 'Paid'
                        ? 'bg-emerald-200 text-emerald-900'
                        : paymentStatus === 'Partial'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    Status: {paymentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Purchase Rate / Meter (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 180"
                      value={ratePerMeter !== undefined ? ratePerMeter : ''}
                      onChange={(e) => handleRateChange(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Total Lot Purchase Cost (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Auto / Manual Cost"
                      value={totalCost !== undefined ? totalCost : (ratePerMeter ? modalTotalMeters * ratePerMeter : '')}
                      onChange={(e) => handleTotalCostChange(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">Amount Paid to Supplier (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 50000"
                      value={amountPaid || ''}
                      onChange={(e) => handleAmountPaidChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-xs font-black text-emerald-950 bg-emerald-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1">Supplier Balance Due (Rs.)</label>
                    <div className="px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black text-amber-950">
                      Rs. {modalBalanceDue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Remarks / Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid cash 50k on delivery, 25k balance payable next month..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">General Notes / Fabric Description</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes regarding fabric quality, weave, batch remarks..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Save Fabric Lot & Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Pay Modal for Suppliers */}
      {quickPayLot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Record Payment to Fabric Supplier</h3>
              </div>
              <button onClick={() => setQuickPayLot(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPay} className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lot Number:</span>
                  <span className="font-bold text-slate-900">{quickPayLot.lotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-semibold text-slate-800">{quickPayLot.supplierName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Purchase Cost:</span>
                  <span className="font-extrabold text-slate-900">
                    Rs.{' '}
                    {(
                      quickPayLot.totalCost !== undefined
                        ? quickPayLot.totalCost
                        : (quickPayLot.ratePerMeter || 0) * quickPayLot.designs.reduce((acc, d) => acc + getDesignTotalMeters(d), 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Amount Paid to Supplier (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={quickPayAmount}
                  onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-sm font-black text-emerald-950 bg-emerald-50/40 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Note / Bank Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Transfer / Cash Ref #492"
                  value={quickPayNotes}
                  onChange={(e) => setQuickPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickPayLot(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Fabric Loss / Customer Sample Modal */}
      {isLossModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-slate-900">Record Customer Sample / Fabric Loss</h3>
              </div>
              <button onClick={() => setIsLossModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLossRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loss Date *</label>
                  <input
                    type="date"
                    required
                    value={lossDate}
                    onChange={(e) => setLossDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Fabric Lot *</label>
                  <select
                    value={lossLotNumber}
                    onChange={(e) => {
                      setLossLotNumber(e.target.value);
                      const target = lots.find((l) => l.lotNumber === e.target.value);
                      if (target && target.designs.length > 0) {
                        setLossDesignName(target.designs[0].designName || target.designs[0].designNumber);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    {lots.map((l) => (
                      <option key={l.id} value={l.lotNumber}>
                        {l.lotNumber} ({l.supplierName || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Design / Pattern Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Floral Red"
                    value={lossDesignName}
                    onChange={(e) => setLossDesignName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loss Category *</label>
                  <select
                    value={lossCategory}
                    onChange={(e) => setLossCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="Given to Customer (Sample / Loss)">Given to Customer (Sample / Loss)</option>
                    <option value="Cutting Scrap & Waste">Cutting Scrap & Waste</option>
                    <option value="Defect / Quality Damage">Defect / Quality Damage</option>
                    <option value="Other Loss">Other Loss</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer / Party Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Rahman Traders"
                    value={lossPartyName}
                    onChange={(e) => setLossPartyName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-rose-700 mb-1">Fabric Meters Deducted *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    value={lossMeters || ''}
                    onChange={(e) => setLossMeters(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-rose-300 bg-rose-50/40 rounded-lg text-xs font-black text-rose-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reason for sample/loss</label>
                <textarea
                  rows={2}
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                  placeholder="e.g. Customer requested 10 meters sample cut before issuing bulk order..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLossModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Record & Deduct Fabric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Lot Modal */}
      <ConfirmDeleteModal
        isOpen={!!lotToDelete}
        title="Delete Fabric Lot"
        message={`Are you sure you want to delete lot "${lotToDelete?.lotNumber}"? All fabric designs inside this lot will be permanently removed.`}
        confirmText="Yes, Delete Lot"
        onConfirm={handleConfirmDeleteLot}
        onClose={() => setLotToDelete(null)}
      />

      {/* Confirm Delete Loss Record Modal */}
      <ConfirmDeleteModal
        isOpen={!!lossToDelete}
        title="Delete Loss Record"
        message={`Are you sure you want to delete this loss record of ${lossToDelete?.metersLost} meters for "${lossToDelete?.lotNumber}"?`}
        confirmText="Yes, Delete Record"
        onConfirm={handleConfirmDeleteLoss}
        onClose={() => setLossToDelete(null)}
      />
    </div>
  );
};

