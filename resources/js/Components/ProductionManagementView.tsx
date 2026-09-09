import React, { useState } from 'react';
import {
  FinishedProduct,
  WaddingStock,
  RawMaterialStockItem,
  CutPieceStockItem,
  ProductionRecord,
} from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { CheckCircle2, Plus, AlertCircle, Package, Layers, Trash2, Search, Filter, X, Sparkles } from 'lucide-react';
import { matchesDesignSearch } from '../lib/designSearch';

interface ProductionManagementViewProps {
  products: FinishedProduct[];
  wadding: WaddingStock;
  rawMaterials: RawMaterialStockItem[];
  cutPiecesStock: CutPieceStockItem[];
  productionRecords: ProductionRecord[];
  onSaveProductionData: (
    updatedProducts: FinishedProduct[],
    updatedWadding: WaddingStock,
    updatedRawMaterials: RawMaterialStockItem[],
    updatedCutPieces: CutPieceStockItem[],
    newRecords: ProductionRecord[]
  ) => void;
}

export const ProductionManagementView: React.FC<ProductionManagementViewProps> = ({
  products,
  wadding,
  rawMaterials,
  cutPiecesStock,
  productionRecords,
  onSaveProductionData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ProductionRecord | null>(null);

  // Search & Filter State
  const [productionSearch, setProductionSearch] = useState('');
  const [productionProductFilter, setProductionProductFilter] = useState('all');

  // Form State (ALL numeric fields initialized to 0)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [isManualProduct, setIsManualProduct] = useState(false);
  const [manualProductName, setManualProductName] = useState('');
  const [manualProductCategory, setManualProductCategory] = useState('Bedsheet');
  const [manualProductSubCategory, setManualProductSubCategory] = useState('');
  const [manualDesignNumber, setManualDesignNumber] = useState('');
  const [quantityProduced, setQuantityProduced] = useState<number>(0);
  const [operatorName, setOperatorName] = useState('Stitching Hall #1');
  const [notes, setNotes] = useState('');

  // Packaging selection state
  const [deductPackagingEnabled, setDeductPackagingEnabled] = useState<boolean>(true);
  const [selectedPackagingIds, setSelectedPackagingIds] = useState<string[]>([]);

  const isDesignRequired = (cat: string) => {
    const lower = (cat || '').toLowerCase();
    return lower.includes('bedsheet') || lower.includes('comforter') || lower.includes('bed sheet');
  };

  const selectedProductObj = products.find((p) => p.id === selectedProductId);

  // Active product details whether from list or manual entry
  const currentProduct = isManualProduct
    ? {
        id: `manual-p-${manualDesignNumber || 'temp'}`,
        name: manualProductName || 'Manufactured Item',
        category: manualProductCategory || 'Bedsheet',
        subCategory: manualProductSubCategory || undefined,
        designNumber: manualDesignNumber || '',
        costPrice: 0,
        sellingPrice: 0,
        stockQuantity: 0,
        reorderLevel: 0,
        unit: 'pcs',
      }
    : selectedProductObj;

  // Auto-initialize selected packaging items when modal opens or product changes
  const initDefaultPackagingSelection = (prodCat: string, prodDesign: string) => {
    const matchedIds: string[] = [];
    const catLower = (prodCat || '').toLowerCase();

    rawMaterials.forEach((rm) => {
      const rmCatLower = (rm.category || '').toLowerCase();
      if (rmCatLower.includes('bag') || rmCatLower === 'polybag') {
        matchedIds.push(rm.id);
      } else if (catLower.includes('bedsheet') && (rmCatLower.includes('stiff') || rmCatLower.includes('card') || rmCatLower.includes('label'))) {
        if (rmCatLower.includes('card')) {
          if (!rm.designCardFor || matchesDesignSearch(rm.cardDesigns || rm.designCardFor, prodDesign)) {
            matchedIds.push(rm.id);
          }
        } else {
          matchedIds.push(rm.id);
        }
      } else if (catLower.includes('quilt') && rmCatLower.includes('quilt_bag')) {
        matchedIds.push(rm.id);
      } else if (catLower.includes('comforter') && rmCatLower.includes('comforter_bag')) {
        matchedIds.push(rm.id);
      }
    });

    setSelectedPackagingIds(matchedIds);
  };

  const handleOpenModal = () => {
    const defaultProd = products[0];
    setSelectedProductId(defaultProd?.id || '');
    setIsManualProduct(false);
    setManualProductName('');
    setManualProductCategory('Bedsheet');
    setManualProductSubCategory('');
    setManualDesignNumber('');
    // Initialize quantity to 0
    setQuantityProduced(0);
    setOperatorName('Stitching Department');
    setNotes('');
    setDeductPackagingEnabled(true);
    if (defaultProd) {
      initDefaultPackagingSelection(defaultProd.category, defaultProd.designNumber);
    }
    setIsModalOpen(true);
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const p = products.find((x) => x.id === prodId);
    if (p) {
      initDefaultPackagingSelection(p.category, p.designNumber);
    }
  };

  const togglePackagingItem = (itemId: string) => {
    if (selectedPackagingIds.includes(itemId)) {
      setSelectedPackagingIds(selectedPackagingIds.filter((id) => id !== itemId));
    } else {
      setSelectedPackagingIds([...selectedPackagingIds, itemId]);
    }
  };

  // Estimate required raw materials for this batch
  const qty = Number(quantityProduced) || 0;
  let estimatedWaddingKg = 0;

  if (currentProduct) {
    const pCatLower = (currentProduct.category || '').toLowerCase();
    if (pCatLower.includes('single quilt')) {
      estimatedWaddingKg = qty * (wadding.singleQuiltSpecKg || 0.8);
    } else if (pCatLower.includes('double quilt')) {
      estimatedWaddingKg = qty * (wadding.doubleQuiltSpecKg || 1.4);
    } else if (pCatLower.includes('comforter')) {
      estimatedWaddingKg = qty * 2.5;
    }
  }

  const handleSaveProduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || qty <= 0) return;

    let targetProduct = currentProduct;
    let updatedProducts = [...products];

    if (isManualProduct) {
      const finalName = manualProductName.trim() || 'Custom Finished Product';
      const finalCategory = manualProductCategory.trim() || 'Bedsheet';
      const finalSubCategory = manualProductSubCategory.trim() || undefined;
      const finalDesign = isDesignRequired(finalCategory) ? manualDesignNumber.trim() : '';

      const existingIdx = updatedProducts.findIndex(
        (p) => p.name.toLowerCase() === finalName.toLowerCase() && p.designNumber.toLowerCase() === finalDesign.toLowerCase()
      );

      if (existingIdx >= 0) {
        updatedProducts[existingIdx] = {
          ...updatedProducts[existingIdx],
          stockQuantity: updatedProducts[existingIdx].stockQuantity + qty,
        };
        targetProduct = updatedProducts[existingIdx];
      } else {
        const newProduct: FinishedProduct = {
          id: `prod-item-${Date.now()}`,
          name: finalName,
          category: finalCategory,
          subCategory: finalSubCategory,
          designNumber: finalDesign,
          costPrice: 0,
          sellingPrice: 0,
          stockQuantity: qty,
          reorderLevel: 0,
          unit: 'pcs',
        };
        updatedProducts = [newProduct, ...updatedProducts];
        targetProduct = newProduct;
      }
    } else {
      if (!selectedProductObj) return;
      updatedProducts = products.map((p) =>
        p.id === selectedProductObj.id ? { ...p, stockQuantity: p.stockQuantity + qty } : p
      );
      targetProduct = selectedProductObj;
    }

    if (!targetProduct) return;

    // 1. Deduct Cut Pieces
    let updatedCutPieces = [...cutPiecesStock];
    if (targetProduct.designNumber) {
      updatedCutPieces = updatedCutPieces.map((cp) => {
        if (
          cp.designNumber.toLowerCase() === targetProduct!.designNumber.toLowerCase() &&
          (cp.productType.toLowerCase().includes(targetProduct!.category.toLowerCase()) ||
            targetProduct!.category.toLowerCase().includes(cp.productType.toLowerCase()))
        ) {
          return {
            ...cp,
            quantityAvailable: Math.max(0, cp.quantityAvailable - qty),
          };
        }
        return cp;
      });
    }

    // 2. Deduct Wadding
    let updatedWadding = { ...wadding };
    if (estimatedWaddingKg > 0) {
      const newAvail = Math.max(0, updatedWadding.availableKg - estimatedWaddingKg);
      const newUsed = updatedWadding.usedKg + estimatedWaddingKg;
      updatedWadding = {
        ...updatedWadding,
        availableKg: newAvail,
        usedKg: newUsed,
      };
    }

    // 3. Deduct Selected Packaging & Accessories
    let stiffenersUsedCount = 0;
    let polybagsUsedCount = 0;
    let cardsUsedCount = 0;
    let quiltBagsUsedCount = 0;
    let comforterBagsUsedCount = 0;

    let updatedRawMaterials = [...rawMaterials];
    if (deductPackagingEnabled && selectedPackagingIds.length > 0) {
      updatedRawMaterials = updatedRawMaterials.map((rm) => {
        if (selectedPackagingIds.includes(rm.id)) {
          const rmCatLower = (rm.category || '').toLowerCase();
          if (rmCatLower.includes('stiff')) stiffenersUsedCount += qty;
          else if (rmCatLower.includes('polybag')) polybagsUsedCount += qty;
          else if (rmCatLower.includes('card')) cardsUsedCount += qty;
          else if (rmCatLower.includes('quilt_bag')) quiltBagsUsedCount += qty;
          else if (rmCatLower.includes('comforter_bag')) comforterBagsUsedCount += qty;

          return {
            ...rm,
            quantityInStock: Math.max(0, rm.quantityInStock - qty),
          };
        }
        return rm;
      });
    }

    // 4. Create Production Record
    const newRecord: ProductionRecord = {
      id: `prec-${Date.now()}`,
      date,
      productId: targetProduct.id,
      productName: targetProduct.name,
      productCategory: targetProduct.category,
      productSubCategory: targetProduct.subCategory,
      quantityProduced: qty,
      designNumber: targetProduct.designNumber || '',
      waddingUsedKg: estimatedWaddingKg,
      stiffenersUsed: stiffenersUsedCount,
      polybagsUsed: polybagsUsedCount,
      cardsUsed: cardsUsedCount,
      quiltBagsUsed: quiltBagsUsedCount,
      comforterBagsUsed: comforterBagsUsedCount,
      operatorName,
      notes,
    };

    onSaveProductionData(
      updatedProducts,
      updatedWadding,
      updatedRawMaterials,
      updatedCutPieces,
      [newRecord, ...productionRecords]
    );

    setIsModalOpen(false);
  };

  const handleDeleteRecord = (rec: ProductionRecord) => {
    setRecordToDelete(rec);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      onSaveProductionData(
        products,
        wadding,
        rawMaterials,
        cutPiecesStock,
        productionRecords.filter((r) => r.id !== recordToDelete.id)
      );
      setRecordToDelete(null);
    }
  };

  // Filtered Production Records (supports design numbers like ZF 1089)
  const filteredRecords = productionRecords.filter((rec) => {
    if (productionProductFilter !== 'all' && (rec.productCategory || '').toLowerCase() !== productionProductFilter.toLowerCase()) {
      return false;
    }

    if (productionSearch.trim()) {
      const q = productionSearch.trim().toLowerCase();
      const matchName = (rec.productName || '').toLowerCase().includes(q);
      const matchCat = (rec.productCategory || '').toLowerCase().includes(q);
      const matchSubCat = (rec.productSubCategory || '').toLowerCase().includes(q);
      const matchOp = (rec.operatorName || '').toLowerCase().includes(q);
      const matchDesign = matchesDesignSearch(rec.designNumber, productionSearch);

      if (!matchName && !matchCat && !matchSubCat && !matchOp && !matchDesign) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold">Daily Production & Assembly Logging</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Log manufactured finished goods (Bedsheets with 3pcs/4pcs, Comforters, Quilts) and track auto-deduction of wadding & packaging.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Production Run</span>
        </button>
      </div>

      {/* Production Log Filter & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">Logged Production Runs ({filteredRecords.length})</h3>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Design # (ZF 1089), Product..."
                value={productionSearch}
                onChange={(e) => setProductionSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {productionSearch && (
                <button
                  onClick={() => setProductionSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={productionProductFilter}
              onChange={(e) => setProductionProductFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(productionRecords.map((r) => r.productCategory).filter(Boolean))).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Product Name & Category</th>
                <th className="py-2.5 px-3">Sub-Category</th>
                <th className="py-2.5 px-3">Design Number</th>
                <th className="py-2.5 px-3 text-right">Qty Produced</th>
                <th className="py-2.5 px-3 text-right">Wadding (Kg)</th>
                <th className="py-2.5 px-3">Operator / Dept</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No production runs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{rec.date}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {rec.productName}
                      <span className="ml-1.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {rec.productCategory}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {rec.productSubCategory ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {rec.productSubCategory}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {rec.designNumber ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          {rec.designNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-indigo-700">
                      +{rec.quantityProduced.toLocaleString()} pcs
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {rec.waddingUsedKg > 0 ? `${rec.waddingUsedKg.toFixed(1)} kg` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{rec.operatorName || 'Stitching Hall'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRecord(rec)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Delete Production Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Entry Modal */}
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
                <h3 className="text-base font-bold text-slate-900">Log Production Run</h3>
                <p className="text-xs text-slate-500">Record finished goods and deduct materials</p>
              </div>
            </div>

            <form onSubmit={handleSaveProduction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Production Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operator / Team</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="e.g. Stitching Dept #1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Product Selection Mode */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-semibold text-slate-700">Finished Product *</label>
                <button
                  type="button"
                  onClick={() => setIsManualProduct(!isManualProduct)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  {isManualProduct ? '← Choose Existing Product' : '+ Custom Product'}
                </button>
              </div>

              {!isManualProduct ? (
                <div>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.designNumber ? `[Design: ${p.designNumber}]` : ''} {p.subCategory ? `(${p.subCategory})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Classic Bedsheet 3pcs (ZF 1089)"
                      value={manualProductName}
                      onChange={(e) => setManualProductName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Category *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bedsheet, Comforter"
                        value={manualProductCategory}
                        onChange={(e) => setManualProductCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Sub-Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Bedsheet 3pcs"
                        value={manualProductSubCategory}
                        onChange={(e) => setManualProductSubCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
                      />
                    </div>
                  </div>

                  {isDesignRequired(manualProductCategory) && (
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                        Design Number * (e.g. ZF 1089)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ZF 1089"
                        value={manualDesignNumber}
                        onChange={(e) => setManualDesignNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-bold text-amber-950 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Produced (Starts at 0) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Produced (Pieces) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantityProduced}
                  onChange={(e) => setQuantityProduced(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Packaging Deduction Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Deduct Packaging & Accessories (-{qty} pcs each)
                  </span>
                  <input
                    type="checkbox"
                    checked={deductPackagingEnabled}
                    onChange={(e) => setDeductPackagingEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </div>

                {deductPackagingEnabled && (
                  <div className="max-h-32 overflow-y-auto space-y-1 pt-1">
                    {rawMaterials.map((rm) => (
                      <label
                        key={rm.id}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer border ${
                          selectedPackagingIds.includes(rm.id)
                            ? 'bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedPackagingIds.includes(rm.id)}
                            onChange={() => togglePackagingItem(rm.id)}
                            className="rounded text-indigo-600"
                          />
                          <span>{rm.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{rm.quantityInStock} in stock</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional production batch notes"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
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
                  Save & Complete Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!recordToDelete}
        title="Delete Production Record"
        itemName={recordToDelete ? `${recordToDelete.productName} (${recordToDelete.quantityProduced} pcs)` : undefined}
        message="Are you sure you want to delete this production log entry?"
        onConfirm={handleConfirmDelete}
        onClose={() => setRecordToDelete(null)}
      />
    </div>
  );
};
