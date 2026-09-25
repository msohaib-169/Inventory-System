import React, { useState, useMemo } from 'react';
import { RawMaterialStockItem, CurrencyOption, SupplierProfile, SupplierBill, SupplierPayment, FabricLot, WaddingStock } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { DropdownWithDelete } from './DropdownWithDelete';
import { Boxes, Plus, Edit2, Trash2, AlertTriangle, CheckCircle2, Search, X, Sparkles, ArrowDownToLine, ClipboardList } from 'lucide-react';
import { matchesDesignSearch } from '../lib/designSearch';

import { ERPStorage, defaultPackagingHierarchy } from '../lib/storage';

interface PackagingStockViewProps {
  rawMaterials: RawMaterialStockItem[];
  currency?: CurrencyOption;
  onSaveRawMaterials: (items: RawMaterialStockItem[]) => void;
  suppliers?: SupplierProfile[];
  supplierBills?: SupplierBill[];
  supplierPayments?: SupplierPayment[];
  onSaveSupplierData?: (
    updatedSuppliers: SupplierProfile[],
    updatedBills: SupplierBill[],
    updatedPayments: SupplierPayment[],
    updatedLots?: FabricLot[],
    updatedWadding?: WaddingStock,
    updatedRawMaterials?: RawMaterialStockItem[]
  ) => void;
}

export const PackagingStockView: React.FC<PackagingStockViewProps> = ({
  rawMaterials,
  currency,
  onSaveRawMaterials,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RawMaterialStockItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<string | null>(null);

  // Filters & Search
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low_stock' | 'adequate'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Restock State
  const [restockItemId, setRestockItemId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [restockRate, setRestockRate] = useState<number>(0);

  // Usage / Statement State
  const [usageItemId, setUsageItemId] = useState<string | null>(null);
  const [usageQty, setUsageQty] = useState<number>(0);
  const [usageReason, setUsageReason] = useState('');
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0]);
  const [statementItemId, setStatementItemId] = useState<string | null>(null);

  // Form State (All clean 0 defaults)
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Label');
  const [subCategory, setSubCategory] = useState<string>('Label 1');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [customSubCategoryInput, setCustomSubCategoryInput] = useState('');
  const [cardDesignsInput, setCardDesignsInput] = useState('');
  const [quantityInStock, setQuantityInStock] = useState<number>(0);
  const [unit, setUnit] = useState('pcs');
  const [reorderLevel, setReorderLevel] = useState<number>(0);
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Dynamic category hierarchy state loaded from storage
  const [hierarchy, setHierarchy] = useState<Record<string, string[]>>(() => {
    return ERPStorage.getPackagingHierarchy();
  });

  const currSym = currency?.symbol || 'Rs.';

  // Derived list of all known categories strictly from dynamic hierarchy
  const allKnownCategories = useMemo(() => {
    const keys = Object.keys(hierarchy);
    if (keys.length === 0) return Object.keys(defaultPackagingHierarchy);
    return keys;
  }, [hierarchy]);

  // Derived list of subcategories for currently active category strictly from dynamic hierarchy
  const availableSubCategories = useMemo(() => {
    const currentCat = isCustomCategory ? customCategoryInput.trim() : category;
    return hierarchy[currentCat] || [];
  }, [category, isCustomCategory, customCategoryInput, hierarchy]);

  const activeCategory = isCustomCategory ? customCategoryInput.trim() : category;
  const isCardsCategory = (activeCategory || '').toLowerCase().includes('card');

  const handleOpenAddModal = (defaultCategory: string = 'Label') => {
    setEditingItemId(null);
    setName('');
    const targetCat = allKnownCategories.includes(defaultCategory) ? defaultCategory : (allKnownCategories[0] || 'Label');
    setCategory(targetCat);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    const subs = hierarchy[targetCat] || [];
    setSubCategory(subs[0] || '');
    setIsCustomSubCategory(false);
    setCustomSubCategoryInput('');
    setCardDesignsInput('');
    setQuantityInStock(0);
    setUnit('pcs');
    setReorderLevel(0);
    setCostPerUnit(0);
    setSupplierName('');
    setSupplierAddress('');
    setLotNumber('');
    setAmountPaid(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: RawMaterialStockItem) => {
    setEditingItemId(item.id);
    setName(item.name);
    setCategory(item.category || 'Label');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setSubCategory(item.subCategory || '');
    setIsCustomSubCategory(false);
    setCustomSubCategoryInput('');
    const existingDesigns = item.cardDesigns && item.cardDesigns.length > 0
      ? item.cardDesigns.join(', ')
      : (item.designCardFor || '');
    setCardDesignsInput(existingDesigns);
    setQuantityInStock(item.quantityInStock || 0);
    setUnit(item.unit || 'pcs');
    setReorderLevel(item.reorderLevel || 0);
    setCostPerUnit(item.costPerUnit || 0);
    setSupplierName(item.supplierName || '');
    setSupplierAddress(item.supplierAddress || '');
    setLotNumber(item.lotNumber || '');
    setAmountPaid(item.amountPaid || 0);
    setIsModalOpen(true);
  };

  const handleCategoryChange = (newCat: string) => {
    if (newCat === '__NEW__') {
      setIsCustomCategory(true);
      setCategory('Custom');
      setSubCategory('');
    } else {
      setIsCustomCategory(false);
      setCategory(newCat);
      const subs = hierarchy[newCat] || [];
      setSubCategory(subs[0] || '');
      setIsCustomSubCategory(false);
    }
  };

  const handleOpenRestock = (itemId: string) => {
    const target = rawMaterials.find((rm) => rm.id === itemId);
    if (!target) return;
    setRestockItemId(itemId);
    setRestockQty(0);
    setRestockRate(target.costPerUnit || 0);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = isCustomCategory ? (customCategoryInput.trim() || 'Custom') : category;
    const finalSubCategory = isCustomSubCategory ? customSubCategoryInput.trim() : subCategory.trim();

    // Parse design card identifiers if card category
    let parsedDesigns: string[] = [];
    if (finalCategory.toLowerCase().includes('card') && cardDesignsInput.trim()) {
      parsedDesigns = Array.from(
        new Set(
          cardDesignsInput
            .split(/[,;\n]+/)
            .map((d) => d.trim())
            .filter(Boolean)
        )
      );
    }

    let finalName = name.trim();
    if (!finalName) {
      if (parsedDesigns.length > 0) {
        finalName = `${finalCategory} (${parsedDesigns.join(', ')})`;
      } else if (finalSubCategory) {
        finalName = `${finalCategory} - ${finalSubCategory}`;
      } else {
        finalName = `${finalCategory} Item`;
      }
    }

    const qty = Number(quantityInStock) || 0;
    const cost = Number(costPerUnit) || 0;
    const reorder = Number(reorderLevel) || 0;
    const paid = Number(amountPaid) || 0;
    const totalCostCalc = qty * cost;

    // Ensure new category and sub-category are dynamically persisted in hierarchy
    const updatedHierarchy = { ...hierarchy };
    if (!updatedHierarchy[finalCategory]) {
      updatedHierarchy[finalCategory] = finalSubCategory ? [finalSubCategory] : [];
    } else if (finalSubCategory && !updatedHierarchy[finalCategory].some((s) => s.toLowerCase() === finalSubCategory.toLowerCase())) {
      updatedHierarchy[finalCategory] = [...updatedHierarchy[finalCategory], finalSubCategory];
    }
    setHierarchy(updatedHierarchy);
    ERPStorage.savePackagingHierarchy(updatedHierarchy);

    if (editingItemId) {
      const updated = rawMaterials.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              name: finalName,
              category: finalCategory,
              subCategory: finalSubCategory || undefined,
              cardDesigns: parsedDesigns.length > 0 ? parsedDesigns : undefined,
              designCardFor: parsedDesigns[0] || undefined,
              quantityInStock: qty,
              unit,
              reorderLevel: reorder,
              costPerUnit: cost,
              supplierName: supplierName.trim() || undefined,
              supplierAddress: supplierAddress.trim() || undefined,
              lotNumber: lotNumber.trim() || undefined,
              totalPurchasedQty: item.totalPurchasedQty || qty,
              totalCost: totalCostCalc,
              amountPaid: paid,
              paymentStatus: (paid >= totalCostCalc && totalCostCalc > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid') as 'Paid' | 'Partial' | 'Unpaid',
            }
          : item
      );
      onSaveRawMaterials(updated);
    } else {
      const newItem: RawMaterialStockItem = {
        id: `rm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: finalName,
        category: finalCategory,
        subCategory: finalSubCategory || undefined,
        cardDesigns: parsedDesigns.length > 0 ? parsedDesigns : undefined,
        designCardFor: parsedDesigns[0] || undefined,
        quantityInStock: qty,
        unit,
        reorderLevel: reorder,
        costPerUnit: cost,
        supplierName: supplierName.trim() || undefined,
        supplierAddress: supplierAddress.trim() || undefined,
        lotNumber: lotNumber.trim() || undefined,
        totalPurchasedQty: qty,
        totalCost: totalCostCalc,
        amountPaid: paid,
        paymentStatus: (paid >= totalCostCalc && totalCostCalc > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid') as 'Paid' | 'Partial' | 'Unpaid',
      };
      onSaveRawMaterials([newItem, ...rawMaterials]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const target = rawMaterials.find((rm) => rm.id === itemId);
    if (target) {
      setItemToDelete(target);
    }
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onSaveRawMaterials(rawMaterials.filter((rm) => rm.id !== itemToDelete.id));
      setItemToDelete(null);
    }
  };

  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      // 1. Permanently remove category from dynamic hierarchy state & storage
      const updatedHierarchy: Record<string, string[]> = {};
      Object.keys(hierarchy).forEach((k) => {
        if (k.toLowerCase() !== categoryToDelete.toLowerCase()) {
          updatedHierarchy[k] = hierarchy[k];
        }
      });
      setHierarchy(updatedHierarchy);
      ERPStorage.savePackagingHierarchy(updatedHierarchy);

      // 2. Remove all raw material items in this category
      const updated = rawMaterials.filter((rm) => (rm.category || '').toLowerCase() !== categoryToDelete.toLowerCase());
      onSaveRawMaterials(updated);

      if (selectedCategoryFilter.toLowerCase() === categoryToDelete.toLowerCase()) {
        setSelectedCategoryFilter('all');
      }
      if (category.toLowerCase() === categoryToDelete.toLowerCase()) {
        const remaining = Object.keys(updatedHierarchy);
        setCategory(remaining[0] || 'Custom');
      }
      setCategoryToDelete(null);
    }
  };

  const handleConfirmDeleteSubCategory = () => {
    if (subCategoryToDelete) {
      // 1. Permanently remove sub-category from all categories in dynamic hierarchy state & storage
      const updatedHierarchy: Record<string, string[]> = {};
      Object.keys(hierarchy).forEach((catKey) => {
        updatedHierarchy[catKey] = (hierarchy[catKey] || []).filter(
          (sub) => sub.toLowerCase() !== subCategoryToDelete.toLowerCase()
        );
      });
      setHierarchy(updatedHierarchy);
      ERPStorage.savePackagingHierarchy(updatedHierarchy);

      // 2. Clear sub-category from any existing raw materials
      const updated = rawMaterials.map((rm) =>
        (rm.subCategory || '').toLowerCase() === subCategoryToDelete.toLowerCase()
          ? { ...rm, subCategory: undefined }
          : rm
      );
      onSaveRawMaterials(updated);

      if (selectedSubCategoryFilter.toLowerCase() === subCategoryToDelete.toLowerCase()) {
        setSelectedSubCategoryFilter('all');
      }
      if (subCategory.toLowerCase() === subCategoryToDelete.toLowerCase()) {
        setSubCategory('');
      }
      setSubCategoryToDelete(null);
    }
  };

  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(restockQty) || 0;
    if (!restockItemId || qty <= 0) return;

    const rate = Number(restockRate) > 0 ? Number(restockRate) : 0;

    const updated = rawMaterials.map((item) => {
      if (item.id === restockItemId) {
        const newTotalQty = (item.totalPurchasedQty || item.quantityInStock) + qty;
        const effectiveRate = rate > 0 ? rate : (item.costPerUnit || 0);
        const newTotalCost = newTotalQty * effectiveRate;
        const currentPaid = item.amountPaid || 0;

        const nextStatement = {
          id: `pkg-restock-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'production' as const,
          quantity: qty,
          note: 'Stock received / replenished',
          reference: 'Restock',
        };

        return {
          ...item,
          quantityInStock: item.quantityInStock + qty,
          totalPurchasedQty: newTotalQty,
          costPerUnit: effectiveRate,
          totalCost: newTotalCost,
          paymentStatus: (currentPaid >= newTotalCost && newTotalCost > 0 ? 'Paid' : currentPaid > 0 ? 'Partial' : 'Unpaid') as 'Paid' | 'Partial' | 'Unpaid',
          stockStatements: [nextStatement, ...(item.stockStatements || [])],
        };
      }
      return item;
    });

    onSaveRawMaterials(updated);
    setRestockItemId(null);
    setRestockQty(0);
  };

  const openUsageModal = (item: RawMaterialStockItem) => {
    setUsageItemId(item.id);
    setUsageQty(0);
    setUsageReason('');
    setUsageDate(new Date().toISOString().split('T')[0]);
  };

  const handleSaveUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageItemId) return;

    const target = rawMaterials.find((item) => item.id === usageItemId);
    if (!target) return;

    const qty = Number(usageQty) || 0;
    if (qty <= 0) return;
    if (qty > (target.quantityInStock || 0)) {
      setUsageQty(target.quantityInStock || 0);
      return;
    }

    const updated = rawMaterials.map((item) => {
      if (item.id !== usageItemId) return item;

      const nextStatement = {
        id: `pkg-usage-${Date.now()}`,
        date: usageDate,
        type: 'usage' as const,
        quantity: qty,
        note: usageReason.trim() || 'Packaging stock used / issued from store',
        reference: 'Packaging Usage',
      };

      return {
        ...item,
        quantityInStock: Math.max(0, item.quantityInStock - qty),
        stockStatements: [nextStatement, ...(item.stockStatements || [])],
      };
    });

    onSaveRawMaterials(updated);
    setUsageItemId(null);
    setUsageQty(0);
    setUsageReason('');
  };

  const selectedUsageItem = rawMaterials.find((item) => item.id === usageItemId) || null;
  const selectedStatementItem = rawMaterials.find((item) => item.id === statementItemId) || null;

  // Filtering
  const filteredMaterials = rawMaterials.filter((item) => {
    // 1. Category Filter
    if (selectedCategoryFilter !== 'all') {
      if ((item.category || '').toLowerCase() !== selectedCategoryFilter.toLowerCase()) {
        return false;
      }
    }

    // 2. Sub-Category Filter
    if (selectedSubCategoryFilter !== 'all') {
      if ((item.subCategory || '').toLowerCase() !== selectedSubCategoryFilter.toLowerCase()) {
        return false;
      }
    }

    // 3. Stock Status Filter
    const isLow = item.quantityInStock <= item.reorderLevel;
    if (stockStatusFilter === 'low_stock' && !isLow) return false;
    if (stockStatusFilter === 'adequate' && isLow) return false;

    // 4. Search Query (supports exact & normalized design numbers like ZF 1089, category, subcategory, name)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCategory = (item.category || '').toLowerCase().includes(q);
      const matchSubCategory = (item.subCategory || '').toLowerCase().includes(q);
      const matchSupplier = (item.supplierName || '').toLowerCase().includes(q);
      const matchLot = (item.lotNumber || '').toLowerCase().includes(q);
      const matchDesignSingle = matchesDesignSearch(item.designCardFor, searchQuery);
      const matchDesignMulti = matchesDesignSearch(item.cardDesigns, searchQuery);

      if (!matchName && !matchCategory && !matchSubCategory && !matchSupplier && !matchLot && !matchDesignSingle && !matchDesignMulti) {
        return false;
      }
    }

    return true;
  });

  // Totals
  const totalItemsCount = rawMaterials.length;
  const totalInventoryValuation = rawMaterials.reduce((acc, curr) => acc + curr.quantityInStock * curr.costPerUnit, 0);
  const lowStockCount = rawMaterials.filter((m) => m.quantityInStock <= m.reorderLevel).length;

  return (
    <div className="space-y-6">
      {/* Top Inventory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Packaging & Accessories</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">{totalItemsCount} Types</h2>
          <p className="text-xs text-slate-500 mt-0.5">Labels, Bags, Stiffeners, Cards, Buttons, Zippers</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Stock Valuation</span>
          <h2 className="text-2xl font-bold text-indigo-900 mt-1">
            {currSym} {totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Total raw material capital value</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Low Stock Reorder Items</span>
          <h2 className="text-2xl font-bold text-amber-800 mt-1">{lowStockCount} Items</h2>
          <p className="text-xs text-slate-500 mt-0.5">Items at or below reorder threshold</p>
        </div>
      </div>

      {/* Action Header & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Packaging Stock & Accessory Inventory</h2>
            <p className="text-xs text-slate-500">
              Categorize by <strong>Label</strong>, <strong>Bags</strong>, <strong>Stiffner</strong>, <strong>Cards (with design #)</strong>, and track dues.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenAddModal('Label')}
              className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock Item</span>
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search box with smart design number support */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Design # (e.g. ZF 1089), Item, Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Dropdown with Delete Icon in front of items */}
          <DropdownWithDelete
            options={allKnownCategories}
            value={selectedCategoryFilter === 'all' ? '' : selectedCategoryFilter}
            onChange={(val) => {
              setSelectedCategoryFilter(val || 'all');
              setSelectedSubCategoryFilter('all');
            }}
            onDeleteOption={(val) => setCategoryToDelete(val)}
            allowNone
            noneLabel="All Categories"
            placeholder="Select Category"
          />

          {/* Sub-Category Filter Dropdown with Delete Icon in front of items */}
          <DropdownWithDelete
            options={Array.from(
              new Set(
                rawMaterials
                  .filter((rm) => selectedCategoryFilter === 'all' || (rm.category || '').toLowerCase() === selectedCategoryFilter.toLowerCase())
                  .map((rm) => rm.subCategory)
                  .filter(Boolean)
              )
            ) as string[]}
            value={selectedSubCategoryFilter === 'all' ? '' : selectedSubCategoryFilter}
            onChange={(val) => setSelectedSubCategoryFilter(val || 'all')}
            onDeleteOption={(val) => setSubCategoryToDelete(val)}
            allowNone
            noneLabel="All Sub-Categories"
            placeholder="Select Sub-Category"
          />

          {/* Stock Status Filter */}
          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as 'all' | 'low_stock' | 'adequate')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Stock Statuses</option>
              <option value="low_stock">⚠️ Low Stock Alerts ({lowStockCount})</option>
              <option value="adequate">✅ Adequate Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Item Name / Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Sub-Category</th>
                <th className="py-3 px-4">Design Number(s)</th>
                <th className="py-3 px-4 text-right">Available Stock</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
                <th className="py-3 px-4 text-right">Total Valuation</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No packaging stock items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((item) => {
                  const isLow = item.quantityInStock <= item.reorderLevel;
                  const itemTotalValue = item.quantityInStock * item.costPerUnit;
                  const designs = item.cardDesigns && item.cardDesigns.length > 0
                    ? item.cardDesigns
                    : (item.designCardFor ? [item.designCardFor] : []);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.supplierName && (
                          <div className="text-[10px] text-slate-500">
                            Supplier: {item.supplierName} {item.lotNumber ? `(${item.lotNumber})` : ''}
                            {item.supplierAddress && <span className="text-slate-400"> • {item.supplierAddress}</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center space-x-1 group">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {item.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(item.category)}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title={`Delete Category "${item.category}"`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {item.subCategory ? (
                          <div className="inline-flex items-center space-x-1 group">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                              {item.subCategory}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSubCategoryToDelete(item.subCategory!)}
                              className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title={`Delete Sub-Category "${item.subCategory}"`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {designs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {designs.map((d, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {item.quantityInStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {currSym} {item.costPerUnit.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        {currSym} {itemTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Adequate</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openUsageModal(item)}
                            className="p-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition cursor-pointer"
                            title="Use Packaging / Deduct Stock"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStatementItemId(item.id)}
                            className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded transition cursor-pointer"
                            title="View Packaging Statement"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenRestock(item.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[11px] border border-emerald-200 transition cursor-pointer"
                            title="Restock Item"
                          >
                            + Restock
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packaging Usage / Deduction Modal */}
      {usageItemId && selectedUsageItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setUsageItemId(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Use Packaging / Deduct Stock</h3>
                <p className="text-xs text-slate-500">{selectedUsageItem.name}</p>
              </div>
              <div className="rounded-full bg-violet-100 p-2 text-violet-700">
                <ArrowDownToLine className="w-4 h-4" />
              </div>
            </div>

            <form onSubmit={handleSaveUsage} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Use *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={usageQty}
                    onChange={(e) => setUsageQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={usageDate}
                    onChange={(e) => setUsageDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Usage / Reason Statement</label>
                <input
                  type="text"
                  value={usageReason}
                  onChange={(e) => setUsageReason(e.target.value)}
                  placeholder="e.g. Issued to stitching / warehouse transfer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="p-2.5 bg-violet-50 rounded-lg border border-violet-200 text-xs font-bold text-violet-900">
                Current stock: {selectedUsageItem.quantityInStock} {selectedUsageItem.unit}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                Remaining after deduction: <span className="font-extrabold text-slate-900">{Math.max(0, selectedUsageItem.quantityInStock - usageQty)} {selectedUsageItem.unit}</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUsageItemId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Deduct & Save Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packaging Statement Summary */}
      {selectedStatementItem && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Stock Statement</h3>
            </div>
            <button
              type="button"
              onClick={() => setStatementItemId(null)}
              className="text-[10px] text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="mb-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-800">
            {selectedStatementItem.name}
          </div>

          {selectedStatementItem.stockStatements && selectedStatementItem.stockStatements.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedStatementItem.stockStatements.map((statement) => (
                <div key={statement.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px]">
                  <div>
                    <div className="font-bold text-slate-800">
                      {statement.type === 'production' ? 'Stock added' : statement.type === 'usage' ? 'Stock used' : 'Adjustment'}: {statement.quantity} {selectedStatementItem.unit || 'pcs'}
                    </div>
                    <div className="text-slate-500">{statement.note || 'No note'}</div>
                  </div>
                  <div className="text-right text-slate-500">
                    <div>{statement.date}</div>
                    <div className="font-semibold text-indigo-700">{statement.reference || 'Statement'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-2.5 py-3 text-[11px] text-slate-500">
              No stock statements available for this item yet.
            </div>
          )}
        </div>
      )}

      {/* Restock Modal */}
      {restockItemId && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setRestockItemId(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 cursor-default"
          >
            <h3 className="text-sm font-bold text-slate-900">Restock Packaging Item</h3>
            <p className="text-xs text-slate-500">
              Quantity restocked will increase available stock and update supplier dues.
            </p>

            <form onSubmit={handleSaveRestock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Add Quantity to Receive *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Rate ({currSym})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={restockRate}
                  onChange={(e) => setRestockRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-xs flex justify-between font-bold text-slate-700">
                <span>Calculated Cost:</span>
                <span>{currSym} {(restockQty * restockRate).toFixed(2)}</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItemId(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Item Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 cursor-default max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItemId ? 'Edit Stock Item' : 'Add New Packaging / Accessory Item'}
                </h3>
                <p className="text-xs text-slate-500">
                  Select or create Category & Sub-Category (Label, Bags, Stiffner, Cards)
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Description / Title <span className="text-[10px] text-slate-400">(Auto-generates if empty)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Woven Satin Label #1 or Card ZF 1089"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Category & Sub-Category Selection with DropdownWithDelete */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  {!isCustomCategory ? (
                    <DropdownWithDelete
                      options={allKnownCategories}
                      value={category}
                      onChange={(val) => handleCategoryChange(val)}
                      onDeleteOption={(val) => setCategoryToDelete(val)}
                      allowAddNew
                      addNewLabel="➕ + Add New Category"
                      onAddNew={() => {
                        setIsCustomCategory(true);
                        setCustomCategoryInput('');
                      }}
                      placeholder="Select Category"
                    />
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        placeholder="Enter Category Name"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        className="w-full px-3 py-2 border border-indigo-400 bg-indigo-50/50 rounded-lg text-xs font-bold text-indigo-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setCategory('Label');
                        }}
                        className="text-[10px] text-indigo-600 hover:underline"
                      >
                        ← Choose Standard
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sub-Category
                  </label>
                  {!isCustomSubCategory ? (
                    <DropdownWithDelete
                      options={availableSubCategories}
                      value={subCategory}
                      onChange={(val) => setSubCategory(val)}
                      onDeleteOption={(val) => setSubCategoryToDelete(val)}
                      allowNone
                      noneLabel="None / Standard"
                      allowAddNew
                      addNewLabel="➕ + Add New Sub-Category"
                      onAddNew={() => {
                        setIsCustomSubCategory(true);
                        setCustomSubCategoryInput('');
                      }}
                      placeholder="Select Sub-Category"
                    />
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="e.g. Label 1, Bag 2, Stiffner 3"
                        value={customSubCategoryInput}
                        onChange={(e) => setCustomSubCategoryInput(e.target.value)}
                        className="w-full px-3 py-2 border border-indigo-400 bg-indigo-50/50 rounded-lg text-xs font-bold text-indigo-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSubCategory(false);
                          setSubCategory(availableSubCategories[0] || '');
                        }}
                        className="text-[10px] text-indigo-600 hover:underline"
                      >
                        ← Choose Standard
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Design Numbers for Cards Category */}
              {isCardsCategory && (
                <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-950">
                      Card Design Number(s) *
                    </label>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Multi-design support
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZF 1089, ZF 1090, DS-102"
                    value={cardDesignsInput}
                    onChange={(e) => setCardDesignsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-amber-800">
                    Separate multiple design codes by commas. Each code is individually searchable.
                  </p>
                </div>
              )}

              {/* Quantity, Cost, Reorder Level */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={quantityInStock}
                    onChange={(e) => setQuantityInStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost/Unit ({currSym})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="pcs / meters / rolls"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                />
              </div>

              {/* Supplier Details & Payment Dues */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Supplier Details & Payment Dues
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Supplier Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Al-Madina Packaging"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Supplier Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Factory Area / Market, Faisalabad"
                      value={supplierAddress}
                      onChange={(e) => setSupplierAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Lot / Invoice #</label>
                    <input
                      type="text"
                      placeholder="e.g. PKG-2026-01"
                      value={lotNumber}
                      onChange={(e) => setLotNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Amount Paid ({currSym})</label>
                    <input
                      type="number"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 flex justify-between font-semibold pt-1 border-t border-slate-200">
                  <span>Total Purchase Cost: {currSym} {(quantityInStock * costPerUnit).toFixed(2)}</span>
                  <span className={quantityInStock * costPerUnit - amountPaid > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                    Balance Due: {currSym} {Math.max(0, quantityInStock * costPerUnit - amountPaid).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        title="Delete Packaging / Accessory Item"
        itemName={itemToDelete?.name}
        message="Are you sure you want to delete this stock item? This will permanently remove it from your raw materials inventory list."
        onConfirm={handleConfirmDelete}
        onClose={() => setItemToDelete(null)}
      />

      {/* Delete Category Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!categoryToDelete}
        title="Delete Packaging Category"
        itemName={categoryToDelete || undefined}
        message={`Are you sure you want to delete all stock items in category "${categoryToDelete}"? This action cannot be undone.`}
        onConfirm={handleConfirmDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
      />

      {/* Delete Sub-Category Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!subCategoryToDelete}
        title="Delete Sub-Category"
        itemName={subCategoryToDelete || undefined}
        message={`Are you sure you want to remove sub-category "${subCategoryToDelete}" from associated stock items?`}
        onConfirm={handleConfirmDeleteSubCategory}
        onClose={() => setSubCategoryToDelete(null)}
      />
    </div>
  );
};
