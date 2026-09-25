// @ts-nocheck
import React, { useState } from 'react';
import { FabricLot, CuttingRecord, CutPieceStockItem, WaddingStock } from '../types';
import { getDesignTotalMeters } from '../lib/storage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Scissors, Plus, Trash2, Calendar, AlertCircle, CheckCircle2, Search, Filter, X } from 'lucide-react';
import { matchesDesignSearch } from '../lib/designSearch';

interface CuttingManagementViewProps {
  lots: FabricLot[];
  cuttingRecords: CuttingRecord[];
  cutPiecesStock: CutPieceStockItem[];
  wadding?: WaddingStock;
  onSaveCuttingData: (
    updatedLots: FabricLot[],
    newRecords: CuttingRecord[],
    updatedCutPieces: CutPieceStockItem[],
    updatedWadding?: WaddingStock
  ) => void;
}

export const CuttingManagementView: React.FC<CuttingManagementViewProps> = ({
  lots,
  cuttingRecords,
  cutPiecesStock,
  wadding,
  onSaveCuttingData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<CuttingRecord | null>(null);

  // Search & Filter State for Cut Pieces Inventory
  const [cutPiecesSearch, setCutPiecesSearch] = useState('');
  const [cutPiecesTypeFilter, setCutPiecesTypeFilter] = useState('all');

  // Search & Filter State for Cutting Log Records
  const [cuttingSearch, setCuttingSearch] = useState('');
  const [cuttingTypeFilter, setCuttingTypeFilter] = useState('all');
  const [cuttingLotFilter, setCuttingLotFilter] = useState('all');

  // Form State (ALL numeric inputs cleanly set to 0)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLotId, setSelectedLotId] = useState(lots[0]?.id || '');
  const [selectedDesignNumber, setSelectedDesignNumber] = useState('');
  const [productType, setProductType] = useState<string>('');
  const [frontMetersPerPiece, setFrontMetersPerPiece] = useState<number>(0);
  const [reverseMetersPerPiece, setReverseMetersPerPiece] = useState<number>(0);
  const [singleMetersPerPiece, setSingleMetersPerPiece] = useState<number>(0);
  const [quantityCut, setQuantityCut] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Wadding Deduction & Lot State
  const waddingItems = wadding?.items || [];
  const [deductWadding, setDeductWadding] = useState<boolean>(false);
  const [selectedWaddingItemId, setSelectedWaddingItemId] = useState<string>(waddingItems[0]?.id || '');
  const [waddingKgPerPiece, setWaddingKgPerPiece] = useState<number>(0);

  // All known product types from records and cut pieces stock for filtering
  const allKnownProductTypes = Array.from(
    new Set([
      ...cuttingRecords.map((r) => r.productType).filter(Boolean),
      ...cutPiecesStock.map((cp) => cp.productType).filter(Boolean),
    ])
  );

  // When Lot selection changes, default to first design
  const currentLot = lots.find((l) => l.id === selectedLotId);
  const availableDesigns = currentLot ? currentLot.designs : [];

  // Selected Wadding Lot Object
  const selectedWaddingItem = waddingItems.find((w) => w.id === selectedWaddingItemId) || waddingItems[0];
  const availableWaddingLotKg = selectedWaddingItem ? selectedWaddingItem.availableKg : (wadding?.availableKg || 0);

  const handleProductTypeInputChange = (val: string) => {
    setProductType(val);
    const lower = val.toLowerCase().trim();

    // 1. Non-quilt items (bedsheets, sheets, pillows, cushions, covers, runners, curtains, etc.) NEVER use wadding
    if (
      lower.includes('bedsheet') ||
      lower.includes('bed sheet') ||
      lower.includes('sheet') ||
      lower.includes('pillow') ||
      lower.includes('cushion') ||
      lower.includes('cover') ||
      lower.includes('curtain') ||
      lower.includes('runner') ||
      lower.includes('cloth') ||
      lower.includes('towel') ||
      lower.includes('sofa')
    ) {
      setDeductWadding(false);
      setWaddingKgPerPiece(0);
      return;
    }

    // 2. Only actual quilted goods use wadding (Quilts, Comforters, Razai, Gadda, Mattress, Dohar)
    if (
      lower.includes('quilt') ||
      lower.includes('comforter') ||
      lower.includes('razai') ||
      lower.includes('gadda') ||
      lower.includes('mattress') ||
      lower.includes('dohar')
    ) {
      setDeductWadding(true);
      if (lower.includes('single')) {
        setWaddingKgPerPiece(selectedWaddingItem?.singleQuiltSpecKg || wadding?.singleQuiltSpecKg || 0.8);
      } else if (lower.includes('double') || lower.includes('king') || lower.includes('queen')) {
        setWaddingKgPerPiece(selectedWaddingItem?.doubleQuiltSpecKg || wadding?.doubleQuiltSpecKg || 1.4);
      } else if (lower.includes('gadda') || lower.includes('mattress')) {
        setWaddingKgPerPiece(selectedWaddingItem?.gaddaSpecKg || wadding?.gaddaSpecKg || 2.0);
      } else if (lower.includes('comforter')) {
        setWaddingKgPerPiece(2.5);
      } else {
        setWaddingKgPerPiece(selectedWaddingItem?.doubleQuiltSpecKg || wadding?.doubleQuiltSpecKg || 1.4);
      }
    } else {
      // Default: do not deduct wadding unless user manually enables it
      setDeductWadding(false);
      setWaddingKgPerPiece(0);
    }
  };

  const handleWaddingLotChange = (itemId: string) => {
    setSelectedWaddingItemId(itemId);
    const item = waddingItems.find((w) => w.id === itemId);
    if (item && deductWadding) {
      const lower = productType.toLowerCase();
      if (lower.includes('single')) {
        setWaddingKgPerPiece(item.singleQuiltSpecKg || 0.8);
      } else if (lower.includes('double') || lower.includes('king') || lower.includes('queen')) {
        setWaddingKgPerPiece(item.doubleQuiltSpecKg || 1.4);
      } else if (lower.includes('gadda') || lower.includes('mattress')) {
        setWaddingKgPerPiece(item.gaddaSpecKg || 2.0);
      }
    }
  };

  const handleOpenModal = () => {
    const defaultLot = lots[0];
    setSelectedLotId(defaultLot?.id || '');
    setSelectedDesignNumber(defaultLot?.designs[0]?.designNumber || '');
    setSelectedWaddingItemId(waddingItems[0]?.id || '');
    setProductType('');
    setFrontMetersPerPiece(0);
    setReverseMetersPerPiece(0);
    setSingleMetersPerPiece(0);
    setQuantityCut(0);
    setNotes('');
    setDeductWadding(false);
    setWaddingKgPerPiece(0);
    setIsModalOpen(true);
  };

  // Selected design object
  const selectedDesignObj = availableDesigns.find((d) => d.designNumber === selectedDesignNumber);

  const isSingleRollOrQuilting =
    selectedDesignObj?.fabricType === 'single_roll' ||
    selectedDesignObj?.fabricType === 'quilting_fabric' ||
    selectedDesignObj?.fabricType === 'other' ||
    (selectedDesignObj?.totalMeters !== undefined &&
      selectedDesignObj.totalMeters > 0 &&
      (selectedDesignObj.frontMeters || 0) === 0 &&
      (selectedDesignObj.reverseMeters || 0) === 0);

  // Calculated totals
  const totalFrontMetersUsed = isSingleRollOrQuilting ? 0 : Number(((Number(frontMetersPerPiece) || 0) * (Number(quantityCut) || 0)).toFixed(2));
  const totalReverseMetersUsed = isSingleRollOrQuilting ? 0 : Number(((Number(reverseMetersPerPiece) || 0) * (Number(quantityCut) || 0)).toFixed(2));
  const totalMetersUsed = isSingleRollOrQuilting
    ? Number(((Number(singleMetersPerPiece) || 0) * (Number(quantityCut) || 0)).toFixed(2))
    : Number((totalFrontMetersUsed + totalReverseMetersUsed).toFixed(2));

  // Wadding calculations
  const reqWaddingKg = deductWadding ? Number(((Number(waddingKgPerPiece) || 0) * (Number(quantityCut) || 0)).toFixed(2)) : 0;
  const waddingSufficient = !deductWadding || reqWaddingKg === 0 || availableWaddingLotKg >= reqWaddingKg;

  // Validation
  const currentTotalStock = selectedDesignObj ? getDesignTotalMeters(selectedDesignObj) : 0;
  const frontSufficient = selectedDesignObj ? (selectedDesignObj.frontMeters || 0) >= totalFrontMetersUsed : false;
  const reverseSufficient = selectedDesignObj ? (selectedDesignObj.reverseMeters || 0) >= totalReverseMetersUsed : false;
  const fabricSufficient = isSingleRollOrQuilting
    ? currentTotalStock >= totalMetersUsed
    : frontSufficient && reverseSufficient;

  const canSubmitCutting = fabricSufficient && waddingSufficient && quantityCut > 0;

  const handleSaveCuttingRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLot || !selectedDesignNumber || !quantityCut || quantityCut <= 0) return;

    if (!fabricSufficient) {
      alert(`Error: Insufficient fabric meters in selected Lot #${currentLot.lotNumber} Design #${selectedDesignNumber}!`);
      return;
    }

    if (deductWadding && reqWaddingKg > 0 && !waddingSufficient) {
      alert(`Error: Insufficient Wadding Stock in selected lot! Required: ${reqWaddingKg.toFixed(1)} Kg, Available: ${availableWaddingLotKg.toFixed(1)} Kg.`);
      return;
    }

    // 1. Deduct meters from Lot Design
    const updatedLots = lots.map((lot) => {
      if (lot.id !== currentLot.id) return lot;
      return {
        ...lot,
        designs: lot.designs.map((d) => {
          if (d.designNumber !== selectedDesignNumber) return d;

          const isItemSingleOrQuilting =
            d.fabricType === 'single_roll' ||
            d.fabricType === 'quilting_fabric' ||
            d.fabricType === 'other' ||
            (d.totalMeters !== undefined && d.totalMeters > 0 && (d.frontMeters || 0) === 0 && (d.reverseMeters || 0) === 0);

          if (isItemSingleOrQuilting) {
            const cur = getDesignTotalMeters(d);
            const newTot = Math.max(0, cur - totalMetersUsed);
            return {
              ...d,
              totalMeters: newTot,
              frontMeters: 0,
              reverseMeters: 0,
            };
          } else {
            return {
              ...d,
              frontMeters: Math.max(0, (d.frontMeters || 0) - totalFrontMetersUsed),
              reverseMeters: Math.max(0, (d.reverseMeters || 0) - totalReverseMetersUsed),
            };
          }
        }),
      };
    });

    // 2. Prepare updated Wadding stock if deducted (deduct from selected lot & global stock)
    let updatedWaddingObj: WaddingStock | undefined = undefined;
    if (wadding && deductWadding && reqWaddingKg > 0) {
      const currentItems = wadding.items || [];
      const updatedItems = currentItems.map((item) => {
        if (item.id === selectedWaddingItemId || (selectedWaddingItem && item.id === selectedWaddingItem.id)) {
          return {
            ...item,
            availableKg: Math.max(0, item.availableKg - reqWaddingKg),
            usedKg: (item.usedKg || 0) + reqWaddingKg,
          };
        }
        return item;
      });

      updatedWaddingObj = {
        ...wadding,
        availableKg: Math.max(0, wadding.availableKg - reqWaddingKg),
        usedKg: (wadding.usedKg || 0) + reqWaddingKg,
        items: updatedItems.length > 0 ? updatedItems : wadding.items,
      };
    }

    const finalProductType = productType.trim() || 'Cut Product';
    const waddingLotTag = deductWadding && reqWaddingKg > 0 && selectedWaddingItem
      ? `[Wadding: Lot #${selectedWaddingItem.lotNumber || selectedWaddingItem.type} - ${reqWaddingKg.toFixed(1)}kg]`
      : '';

    // 3. Create new Cutting Record
    const newRecord: CuttingRecord = {
      id: `cut-${Date.now()}`,
      date,
      lotId: currentLot.id,
      lotNumber: currentLot.lotNumber,
      designNumber: selectedDesignNumber,
      productType: finalProductType,
      frontMetersPerPiece: isSingleRollOrQuilting ? Number(singleMetersPerPiece) : Number(frontMetersPerPiece),
      reverseMetersPerPiece: isSingleRollOrQuilting ? 0 : Number(reverseMetersPerPiece),
      quantityCut: Number(quantityCut),
      totalFrontMetersUsed,
      totalReverseMetersUsed,
      totalMetersUsed,
      waddingItemId: deductWadding && selectedWaddingItem ? selectedWaddingItem.id : undefined,
      waddingLotNumber: deductWadding && selectedWaddingItem ? (selectedWaddingItem.lotNumber || selectedWaddingItem.type) : undefined,
      waddingTypeName: deductWadding && selectedWaddingItem ? selectedWaddingItem.type : undefined,
      waddingKgPerPiece: deductWadding ? Number(waddingKgPerPiece) : 0,
      waddingUsedKg: deductWadding ? reqWaddingKg : 0,
      notes: isSingleRollOrQuilting
        ? `[Quilting / Roll Fabric: ${singleMetersPerPiece}m/pc${waddingLotTag ? `, ${waddingLotTag}` : ''}] ${notes}`.trim()
        : `${waddingLotTag ? `${waddingLotTag} ` : ''}${notes}`.trim(),
    };

    // 4. Add cut pieces to Cut Pieces Stock
    const existingIndex = cutPiecesStock.findIndex(
      (cp) =>
        cp.designNumber.toLowerCase() === selectedDesignNumber.toLowerCase() &&
        cp.productType.toLowerCase() === finalProductType.toLowerCase()
    );

    let updatedCutPieces: CutPieceStockItem[] = [];
    if (existingIndex >= 0) {
      updatedCutPieces = cutPiecesStock.map((cp, idx) =>
        idx === existingIndex ? { ...cp, quantityAvailable: cp.quantityAvailable + Number(quantityCut) } : cp
      );
    } else {
      updatedCutPieces = [
        ...cutPiecesStock,
        {
          id: `cps-${Date.now()}`,
          designNumber: selectedDesignNumber,
          productType: finalProductType,
          quantityAvailable: Number(quantityCut),
        },
      ];
    }

    onSaveCuttingData(updatedLots, [newRecord, ...cuttingRecords], updatedCutPieces, updatedWaddingObj);
    setIsModalOpen(false);
  };

  const handleDeleteRecord = (rec: CuttingRecord) => {
    setRecordToDelete(rec);
  };

  const handleConfirmDeleteRecord = () => {
    if (recordToDelete) {
      const updatedRecords = cuttingRecords.filter((r) => r.id !== recordToDelete.id);

      // Restore Fabric meters to the lot design
      const updatedLots = lots.map((lot) => {
        if (lot.id !== recordToDelete.lotId && lot.lotNumber !== recordToDelete.lotNumber) return lot;
        return {
          ...lot,
          designs: lot.designs.map((d) => {
            if (d.designNumber !== recordToDelete.designNumber) return d;
            const isItemSingleOrQuilting =
              d.fabricType === 'single_roll' ||
              d.fabricType === 'quilting_fabric' ||
              d.fabricType === 'other' ||
              (d.totalMeters !== undefined && d.totalMeters > 0 && (d.frontMeters || 0) === 0 && (d.reverseMeters || 0) === 0);

            if (isItemSingleOrQuilting) {
              return {
                ...d,
                totalMeters: (d.totalMeters || 0) + recordToDelete.totalMetersUsed,
              };
            } else {
              return {
                ...d,
                frontMeters: (d.frontMeters || 0) + recordToDelete.totalFrontMetersUsed,
                reverseMeters: (d.reverseMeters || 0) + recordToDelete.totalReverseMetersUsed,
              };
            }
          }),
        };
      });

      // Restore Wadding to specific lot and overall wadding
      let updatedWaddingObj: WaddingStock | undefined = undefined;
      if (recordToDelete.waddingUsedKg && recordToDelete.waddingUsedKg > 0 && wadding) {
        const restoredKg = recordToDelete.waddingUsedKg;
        const currentItems = wadding.items || [];
        const updatedItems = currentItems.map((item) => {
          if (
            (recordToDelete.waddingItemId && item.id === recordToDelete.waddingItemId) ||
            (recordToDelete.waddingLotNumber && (item.lotNumber === recordToDelete.waddingLotNumber || item.type === recordToDelete.waddingLotNumber))
          ) {
            return {
              ...item,
              availableKg: item.availableKg + restoredKg,
              usedKg: Math.max(0, (item.usedKg || 0) - restoredKg),
            };
          }
          return item;
        });

        updatedWaddingObj = {
          ...wadding,
          availableKg: wadding.availableKg + restoredKg,
          usedKg: Math.max(0, (wadding.usedKg || 0) - restoredKg),
          items: updatedItems.length > 0 ? updatedItems : wadding.items,
        };
      }

      // Also deduct from cut pieces stock
      const updatedCutPieces = cutPiecesStock.map((cp) => {
        if (
          cp.designNumber.toLowerCase() === recordToDelete.designNumber.toLowerCase() &&
          cp.productType.toLowerCase() === recordToDelete.productType.toLowerCase()
        ) {
          return {
            ...cp,
            quantityAvailable: Math.max(0, cp.quantityAvailable - recordToDelete.quantityCut),
          };
        }
        return cp;
      });

      onSaveCuttingData(updatedLots, updatedRecords, updatedCutPieces, updatedWaddingObj);
      setRecordToDelete(null);
    }
  };

  // Filtered Cut Pieces
  const filteredCutPieces = cutPiecesStock.filter((cp) => {
    const matchesSearch =
      matchesDesignSearch(cp.designNumber, cutPiecesSearch) ||
      cp.productType.toLowerCase().includes(cutPiecesSearch.toLowerCase());
    const matchesType = cutPiecesTypeFilter === 'all' || cp.productType === cutPiecesTypeFilter;
    return matchesSearch && matchesType;
  });

  // Filtered Cutting Log Records
  const filteredCuttingRecords = cuttingRecords.filter((rec) => {
    const q = cuttingSearch.toLowerCase();
    const matchesSearch =
      matchesDesignSearch(rec.designNumber, cuttingSearch) ||
      rec.lotNumber.toLowerCase().includes(q) ||
      rec.productType.toLowerCase().includes(q) ||
      rec.date.includes(q) ||
      (rec.waddingLotNumber && rec.waddingLotNumber.toLowerCase().includes(q)) ||
      (rec.waddingTypeName && rec.waddingTypeName.toLowerCase().includes(q)) ||
      (rec.notes && rec.notes.toLowerCase().includes(q));
    const matchesType = cuttingTypeFilter === 'all' || rec.productType === cuttingTypeFilter;
    const matchesLot = cuttingLotFilter === 'all' || rec.lotNumber === cuttingLotFilter;
    return matchesSearch && matchesType && matchesLot;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cutting Entries</span>
            <Scissors className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{cuttingRecords.length} <span className="text-sm font-medium text-slate-500">Batches</span></h2>
          <p className="text-xs text-slate-500 mt-1">Logged daily cutting operations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Cut Pieces Stock</span>
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {cutPiecesStock.reduce((s, c) => s + c.quantityAvailable, 0)} <span className="text-sm font-medium text-slate-500">Pieces</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ready for stitching/production</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Total Fabric Consumed</span>
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {cuttingRecords.reduce((s, r) => s + r.totalMetersUsed, 0).toLocaleString()} <span className="text-sm font-medium text-slate-500">Meters</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Total Front & Reverse meters cut</p>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Daily Cutting Department</h2>
          <p className="text-xs text-slate-500">Log daily fabric cutting, deduct meters from Lot designs and add cut pieces to production stock</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Daily Cutting</span>
        </button>
      </div>

      {/* Available Cut Pieces Inventory Grid */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Ready Cut Pieces Inventory (For Stitching)</h3>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Cut Pieces Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cut pieces..."
                value={cutPiecesSearch}
                onChange={(e) => setCutPiecesSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {cutPiecesSearch && (
                <button
                  onClick={() => setCutPiecesSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Cut Pieces Product Type Filter */}
            <select
              value={cutPiecesTypeFilter}
              onChange={(e) => setCutPiecesTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Types</option>
              {allKnownProductTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredCutPieces.length === 0 ? (
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 text-center text-xs text-slate-400">
            No matching cut pieces in inventory stock.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {filteredCutPieces.map((cp) => (
              <div key={cp.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-[10px] text-indigo-300 font-bold uppercase block">{cp.productType}</span>
                <span className="text-xs font-extrabold text-white">Design #{cp.designNumber}</span>
                <div className="text-xl font-black text-emerald-400 mt-1">{cp.quantityAvailable} <span className="text-xs font-normal text-slate-400">pcs</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Cutting Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900 text-xs">Daily Cutting Log Records</span>
              <span className="text-[11px] text-slate-500 font-normal">({filteredCuttingRecords.length} found)</span>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search lot, design, type..."
                  value={cuttingSearch}
                  onChange={(e) => setCuttingSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {cuttingSearch && (
                  <button
                    onClick={() => setCuttingSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Product Type Filter */}
              <select
                value={cuttingTypeFilter}
                onChange={(e) => setCuttingTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Product Types</option>
                {allKnownProductTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Lot Number Filter */}
              <select
                value={cuttingLotFilter}
                onChange={(e) => setCuttingLotFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Fabric Lots</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.lotNumber}>
                    Lot #{l.lotNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredCuttingRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No daily cutting logs match your current search/filter parameters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Fabric Lot #</th>
                  <th className="py-3 px-4">Design #</th>
                  <th className="py-3 px-4">Product Type</th>
                  <th className="py-3 px-4 text-center">Qty Cut</th>
                  <th className="py-3 px-4 text-right text-blue-700">Front Meters (Per / Total)</th>
                  <th className="py-3 px-4 text-right text-purple-700">Reverse Meters (Per / Total)</th>
                  <th className="py-3 px-4 text-right font-extrabold">Total Meters Deducted</th>
                  <th className="py-3 px-4 text-center text-emerald-800">Wadding Deducted (Lot & Kg)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCuttingRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800">{rec.date}</td>
                    <td className="py-3 px-4 font-bold text-indigo-700">{rec.lotNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.designNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{rec.productType}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-emerald-700 bg-emerald-50/50">
                      {rec.quantityCut} pcs
                    </td>
                    <td className="py-3 px-4 text-right text-blue-700 font-medium">
                      {rec.frontMetersPerPiece}m / <strong className="font-bold">{rec.totalFrontMetersUsed}m</strong>
                    </td>
                    <td className="py-3 px-4 text-right text-purple-700 font-medium">
                      {rec.reverseMetersPerPiece}m / <strong className="font-bold">{rec.totalReverseMetersUsed}m</strong>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50">
                      {rec.totalMetersUsed} m
                    </td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30">
                      {rec.waddingUsedKg && rec.waddingUsedKg > 0 ? (
                        <div>
                          <span className="font-extrabold text-emerald-800">{rec.waddingUsedKg.toFixed(1)} Kg</span>
                          <span className="block text-[10px] text-slate-500 font-medium">
                            {rec.waddingLotNumber ? `Lot #${rec.waddingLotNumber}` : rec.waddingTypeName || 'Wadding'} ({rec.waddingKgPerPiece || 0} kg/pc)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteRecord(rec)}
                        title="Delete Cutting Log"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Cutting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Scissors className="w-5 h-5 text-indigo-600" />
                  <span>Record Daily Cutting Log</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify fabric lot, design meters, quantity cut, and wadding fiber lot consumption for auto stock deduction
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCuttingRecord} className="space-y-4">
              {/* Header Basic Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cutting Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Type Cut * <span className="text-[10px] text-slate-400 font-normal">(Manual Entry)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Double Quilt, Single Quilt, Bedsheet, Gadda..."
                    value={productType}
                    onChange={(e) => handleProductTypeInputChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Quick Product Type Suggestions */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Double Quilt', 'Single Quilt', 'Gadda', 'Bedsheet Set', 'Comforter', 'Pillow Cover'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleProductTypeInputChange(p)}
                        className="text-[10px] px-2 py-0.5 bg-slate-200/70 hover:bg-indigo-100 hover:text-indigo-700 rounded text-slate-700 font-medium transition cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 1: Fabric Inward Lot & Design */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center space-x-1.5">
                    <span>1. 🧵 Fabric Inward Lot & Design</span>
                  </h4>
                  {isSingleRollOrQuilting && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                      Single Roll / Quilting Fabric Mode
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Fabric Lot *</label>
                    <select
                      value={selectedLotId}
                      onChange={(e) => {
                        const lId = e.target.value;
                        setSelectedLotId(lId);
                        const l = lots.find((x) => x.id === lId);
                        if (l && l.designs.length > 0) {
                          setSelectedDesignNumber(l.designs[0].designNumber);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    >
                      {lots.map((l) => (
                        <option key={l.id} value={l.id}>
                          Lot #{l.lotNumber} ({l.supplierName || 'Lot'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Design Number *</label>
                    <select
                      value={selectedDesignNumber}
                      onChange={(e) => setSelectedDesignNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    >
                      {availableDesigns.map((d) => {
                        const isItemSingleOrQuilting =
                          d.fabricType === 'single_roll' ||
                          d.fabricType === 'quilting_fabric' ||
                          d.fabricType === 'other' ||
                          (d.totalMeters !== undefined && d.totalMeters > 0 && (d.frontMeters || 0) === 0 && (d.reverseMeters || 0) === 0);

                        const typeLabel =
                          d.fabricType === 'quilting_fabric'
                            ? 'Quilting'
                            : d.fabricType === 'single_roll'
                            ? 'Single Roll'
                            : d.fabricType === 'other'
                            ? 'Custom'
                            : 'Bedsheet';

                        const totalMtrs = getDesignTotalMeters(d);

                        return (
                          <option key={d.id} value={d.designNumber}>
                            {d.designNumber} ({d.designName || 'Fabric'}) - {isItemSingleOrQuilting ? `Stock: ${totalMtrs}m [${typeLabel}]` : `Front: ${d.frontMeters}m, Rev: ${d.reverseMeters}m`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Fabric Meters Consumption Inputs */}
                {isSingleRollOrQuilting ? (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                        Total Fabric Meters / Pc *
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={singleMetersPerPiece || ''}
                        onChange={(e) => setSingleMetersPerPiece(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-bold text-emerald-950"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                        Quantity Cut (Pieces) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={quantityCut || ''}
                        onChange={(e) => setQuantityCut(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                        Front Meters / Pc *
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={frontMetersPerPiece || ''}
                        onChange={(e) => setFrontMetersPerPiece(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-900"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                        Reverse Meters / Pc *
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={reverseMetersPerPiece || ''}
                        onChange={(e) => setReverseMetersPerPiece(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-900"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                        Quantity Cut (Pieces) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={quantityCut || ''}
                        onChange={(e) => setQuantityCut(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Fabric Calculation Live Summary */}
                <div className="p-3 bg-white rounded-lg border border-indigo-100 text-xs space-y-1 shadow-2xs">
                  {isSingleRollOrQuilting ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Available Fabric Inward Stock:</span>
                        <strong className="text-emerald-700">{currentTotalStock.toLocaleString()} m</strong>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                        <span>Total Quilting Fabric Deducted:</span>
                        <span className="text-emerald-700 font-extrabold">{totalMetersUsed} m</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Remaining Fabric Stock:</span>
                        <span className="font-bold text-slate-700">{Math.max(0, currentTotalStock - totalMetersUsed).toFixed(1)} m</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Front to deduct / Available:</span>
                        <strong className="text-blue-700">{totalFrontMetersUsed} m / {selectedDesignObj?.frontMeters || 0} m</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Reverse to deduct / Available:</span>
                        <strong className="text-purple-700">{totalReverseMetersUsed} m / {selectedDesignObj?.reverseMeters || 0} m</strong>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                        <span>Grand Total Fabric Deducted:</span>
                        <span className="text-indigo-600 font-extrabold">{totalMetersUsed} m</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Remaining Total Design Fabric:</span>
                        <span className="font-bold text-slate-700">{Math.max(0, currentTotalStock - totalMetersUsed).toFixed(1)} m</span>
                      </div>
                    </>
                  )}
                </div>

                {!fabricSufficient && (
                  <div className="flex items-center space-x-1.5 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>Insufficient fabric meters in Lot {currentLot?.lotNumber} design #{selectedDesignNumber}! (Available: {currentTotalStock}m, Required: {totalMetersUsed}m)</span>
                  </div>
                )}
              </div>

              {/* SECTION 2: Wadding Fiber Lot & Consumption */}
              <div className="p-4 bg-emerald-950 text-white rounded-xl space-y-3.5 border border-emerald-800/80 shadow-md">
                <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="deductWaddingCheck"
                      checked={deductWadding}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDeductWadding(checked);
                        if (checked && waddingKgPerPiece === 0) {
                          setWaddingKgPerPiece(selectedWaddingItem?.doubleQuiltSpecKg || wadding?.doubleQuiltSpecKg || 1.4);
                        }
                      }}
                      className="w-4 h-4 text-emerald-500 rounded border-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="deductWaddingCheck" className="text-xs font-bold text-emerald-200 cursor-pointer flex items-center space-x-1">
                      <span>2. ☁️ Deduct Wadding / Fiber Stock</span>
                    </label>
                  </div>

                  <span className="text-[11px] font-extrabold text-emerald-300 bg-emerald-900/90 px-2.5 py-0.5 rounded-full border border-emerald-700">
                    Total Global Stock: {(wadding?.availableKg || 0).toLocaleString()} Kg
                  </span>
                </div>

                {deductWadding ? (
                  <div className="space-y-3 text-xs">
                    {/* Wadding Lot Selector & Per Piece Spec */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                          Select Wadding Lot / Roll *
                        </label>
                        <select
                          value={selectedWaddingItemId}
                          onChange={(e) => handleWaddingLotChange(e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-900 border border-emerald-500/50 rounded-lg text-xs font-bold text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                          {waddingItems.length > 0 ? (
                            waddingItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                Lot #{item.lotNumber || item.id} - {item.type} ({item.gsm} GSM) [Stock: {item.availableKg} Kg]
                              </option>
                            ))
                          ) : (
                            <option value="">General Wadding Stock (Available: {wadding?.availableKg || 0} Kg)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                          Wadding per Piece (Kg / piece) *
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={waddingKgPerPiece || ''}
                          onChange={(e) => setWaddingKgPerPiece(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-2 bg-slate-900 border border-emerald-500/50 rounded-lg text-xs font-black text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Automatic Wadding Calculation Stats Card */}
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-700/60 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Quantity</span>
                        <strong className="text-sm font-extrabold text-white">{quantityCut} pcs</strong>
                      </div>

                      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Spec / pc</span>
                        <strong className="text-sm font-extrabold text-amber-300">{waddingKgPerPiece} Kg</strong>
                      </div>

                      <div className="bg-emerald-950 p-2 rounded-lg border border-emerald-600/60">
                        <span className="text-[10px] text-emerald-300 block font-semibold">Auto Total Wadding</span>
                        <strong className="text-sm font-black text-emerald-400">{reqWaddingKg.toFixed(1)} Kg</strong>
                      </div>

                      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Lot Stock After</span>
                        <strong className={`text-sm font-extrabold ${waddingSufficient ? 'text-emerald-300' : 'text-red-400'}`}>
                          {Math.max(0, availableWaddingLotKg - reqWaddingKg).toFixed(1)} Kg
                        </strong>
                      </div>
                    </div>

                    {!waddingSufficient && (
                      <div className="p-3 bg-red-500/20 border border-red-500/60 text-red-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center space-x-2 font-bold text-red-400 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>Insufficient Wadding Fiber Stock in Selected Lot!</span>
                        </div>
                        <p className="text-[11px] text-slate-200 pl-6">
                          Required: <strong className="text-red-300">{reqWaddingKg.toFixed(1)} Kg</strong> | Available in Lot #{selectedWaddingItem?.lotNumber || 'Lot'}: <strong className="text-amber-300">{availableWaddingLotKg.toFixed(1)} Kg</strong>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Wadding fiber deduction is disabled for this entry. Enable above to select a Wadding Lot and record wadding consumption.
                  </p>
                )}
              </div>

              {/* Combined Deduction Banner */}
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3 text-slate-700">
                  <span className="font-bold text-slate-900">Total Deduction Summary:</span>
                  <span className="font-semibold text-indigo-700">Fabric: -{totalMetersUsed} m</span>
                  {deductWadding && (
                    <span className="font-semibold text-emerald-700">Wadding: -{reqWaddingKg.toFixed(1)} Kg (Lot #{selectedWaddingItem?.lotNumber || '1'})</span>
                  )}
                </div>
                <span className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  +{quantityCut} pcs {productType || 'Cut Pieces'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cutting Note / Operator</label>
                <input
                  type="text"
                  placeholder="e.g. Master Khalid Cutting Table #1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmitCutting}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5 ${
                    canSubmitCutting ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                  <span>Confirm Cutting & Deduct Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!recordToDelete}
        title="Delete Cutting Log Record"
        itemName={recordToDelete ? `Cutting Log #${recordToDelete.id.slice(-6)} (${recordToDelete.designNumber})` : undefined}
        message="Are you sure you want to delete this cutting entry log?"
        onConfirm={handleConfirmDeleteRecord}
        onClose={() => setRecordToDelete(null)}
      />
    </div>
  );
};

