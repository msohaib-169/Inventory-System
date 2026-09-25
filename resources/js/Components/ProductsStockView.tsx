// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { FinishedProduct, CurrencyOption } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { DropdownWithDelete } from './DropdownWithDelete';
import { Package, Plus, Edit2, Trash2, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Search, Filter, X, Sparkles, ArrowDownToLine, ClipboardList } from 'lucide-react';
import { matchesDesignSearch } from '../lib/designSearch';

interface ProductsStockViewProps {
  products: FinishedProduct[];
  currency: CurrencyOption;
  onSaveProducts: (products: FinishedProduct[]) => void;
}

import { ERPStorage, defaultProductHierarchy } from '../lib/storage';

export const ProductsStockView: React.FC<ProductsStockViewProps> = ({ products, currency, onSaveProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<FinishedProduct | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low_stock' | 'in_stock'>('all');

  const currSym = currency.symbol;

  // Form state (ALL numeric inputs cleanly default to 0)
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Bedsheet');
  const [subCategory, setSubCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [customSubCategoryInput, setCustomSubCategoryInput] = useState('');
  const [designNumber, setDesignNumber] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(0);
  const [unit, setUnit] = useState('pcs');

  const [usageProductId, setUsageProductId] = useState<string | null>(null);
  const [usageQty, setUsageQty] = useState<number>(0);
  const [usageReason, setUsageReason] = useState('');
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0]);
  const [statementProductId, setStatementProductId] = useState<string | null>(null);

  // Dynamic product category hierarchy state loaded from storage
  const [hierarchy, setHierarchy] = useState<Record<string, string[]>>(() => {
    return ERPStorage.getProductHierarchy();
  });

  // Check whether a category requires/supports Design Number (Strictly Bedsheet and Comforter ONLY)
  const isDesignRequiredCategory = (catName: string) => {
    const lower = (catName || '').toLowerCase();
    return (
      lower.includes('bedsheet') ||
      lower.includes('comforter') ||
      lower.includes('bed sheet')
    );
  };

  const allKnownCategories = useMemo(() => {
    const keys = Object.keys(hierarchy);
    if (keys.length === 0) return Object.keys(defaultProductHierarchy);
    return keys;
  }, [hierarchy]);

  const activeCategory = isCustomCategory ? customCategoryInput.trim() : category;

  const availableSubCategories = useMemo(() => {
    const currentCat = isCustomCategory ? customCategoryInput.trim() : category;
    return hierarchy[currentCat] || [];
  }, [category, isCustomCategory, customCategoryInput, hierarchy]);

  // Overall Financial Calculations
  const totalStockPieces = products.reduce((s, p) => s + p.stockQuantity, 0);
  const totalCostValuation = products.reduce((s, p) => s + p.stockQuantity * p.costPrice, 0);
  const totalSalesValuation = products.reduce((s, p) => s + p.stockQuantity * p.sellingPrice, 0);
  const totalPotentialProfit = totalSalesValuation - totalCostValuation;

  // Filtering Products
  const filteredProducts = products.filter((p) => {
    // 1. Category Filter
    if (selectedCategory !== 'all' && (p.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    // 2. Sub-Category Filter
    if (selectedSubCategory !== 'all' && (p.subCategory || '').toLowerCase() !== selectedSubCategory.toLowerCase()) {
      return false;
    }

    // 3. Stock Status Filter
    const isLow = p.stockQuantity <= p.reorderLevel;
    if (stockStatusFilter === 'low_stock' && !isLow) return false;
    if (stockStatusFilter === 'in_stock' && isLow) return false;

    // 4. Search Query (supports design numbers like ZF 1089, product name, category, subcategory, sku)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      const matchSubCat = (p.subCategory || '').toLowerCase().includes(q);
      const matchSku = (p.sku || '').toLowerCase().includes(q);
      const matchDesign = matchesDesignSearch(p.designNumber, searchQuery);

      if (!matchName && !matchCat && !matchSubCat && !matchSku && !matchDesign) {
        return false;
      }
    }
    return true;
  });

  const handleOpenAddModal = (defaultCategory: string = 'Bedsheet') => {
    setEditingProductId(null);
    setName('');
    const targetCat = allKnownCategories.includes(defaultCategory) ? defaultCategory : (allKnownCategories[0] || 'Bedsheet');
    setCategory(targetCat);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    const subs = hierarchy[targetCat] || [];
    setSubCategory(subs[0] || '');
    setIsCustomSubCategory(false);
    setCustomSubCategoryInput('');

    setDesignNumber('');
    // Reset all numeric values to 0
    setCostPrice(0);
    setSellingPrice(0);
    setStockQuantity(0);
    setReorderLevel(0);
    setUnit('pcs');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: FinishedProduct) => {
    setEditingProductId(product.id);
    setName(product.name);

    if (allKnownCategories.includes(product.category)) {
      setCategory(product.category);
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    } else {
      setCategory('Custom');
      setIsCustomCategory(true);
      setCustomCategoryInput(product.category);
    }

    const sub = product.subCategory || '';
    setSubCategory(sub);
    setIsCustomSubCategory(false);
    setCustomSubCategoryInput(sub);

    setDesignNumber(product.designNumber || '');
    setCostPrice(product.costPrice || 0);
    setSellingPrice(product.sellingPrice || 0);
    setStockQuantity(product.stockQuantity || 0);
    setReorderLevel(product.reorderLevel || 0);
    setUnit(product.unit || 'pcs');
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

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? (customCategoryInput.trim() || 'Custom Product') : category;
    const finalSubCategory = isCustomSubCategory ? customSubCategoryInput.trim() : subCategory.trim();

    let finalName = name.trim();
    if (!finalName) {
      if (designNumber.trim()) {
        finalName = `${finalCategory} (${designNumber.trim()})${finalSubCategory ? ` - ${finalSubCategory}` : ''}`;
      } else if (finalSubCategory) {
        finalName = `${finalCategory} - ${finalSubCategory}`;
      } else {
        finalName = `${finalCategory} Product`;
      }
    }

    const cost = Number(costPrice) || 0;
    const sell = Number(sellingPrice) || 0;
    const stock = Number(stockQuantity) || 0;
    const reorder = Number(reorderLevel) || 0;
    const dNum = isDesignRequiredCategory(finalCategory) ? designNumber.trim() : '';

    // Ensure category and sub-category are dynamically persisted in hierarchy
    const updatedHierarchy = { ...hierarchy };
    if (!updatedHierarchy[finalCategory]) {
      updatedHierarchy[finalCategory] = finalSubCategory ? [finalSubCategory] : [];
    } else if (finalSubCategory && !updatedHierarchy[finalCategory].some((s) => s.toLowerCase() === finalSubCategory.toLowerCase())) {
      updatedHierarchy[finalCategory] = [...updatedHierarchy[finalCategory], finalSubCategory];
    }
    setHierarchy(updatedHierarchy);
    ERPStorage.saveProductHierarchy(updatedHierarchy);

    if (editingProductId) {
      const updated = products.map((p) =>
        p.id === editingProductId
          ? {
            ...p,
            name: finalName,
            category: finalCategory,
            subCategory: finalSubCategory || undefined,
            designNumber: dNum,
            costPrice: cost,
            sellingPrice: sell,
            stockQuantity: stock,
            reorderLevel: reorder,
            unit,
          }
          : p
      );
      onSaveProducts(updated);
    } else {
      const newProduct: FinishedProduct = {
        id: `p-${Date.now()}`,
        name: finalName,
        category: finalCategory,
        subCategory: finalSubCategory || undefined,
        designNumber: dNum,
        costPrice: cost,
        sellingPrice: sell,
        stockQuantity: stock,
        reorderLevel: reorder,
        unit,
        stockStatements: stock > 0 ? [{
          id: `prod-opening-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'production',
          quantity: stock,
          note: 'Opening stock added to finished goods inventory',
          reference: 'Opening Balance',
        }] : [],
      };
      onSaveProducts([newProduct, ...products]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (target) {
      setProductToDelete(target);
    }
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onSaveProducts(products.filter((p) => p.id !== productToDelete.id));
      setProductToDelete(null);
    }
  };

  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      // 1. Permanently remove category from dynamic hierarchy state and storage
      const updatedHierarchy: Record<string, string[]> = {};
      Object.keys(hierarchy).forEach((k) => {
        if (k.toLowerCase() !== categoryToDelete.toLowerCase()) {
          updatedHierarchy[k] = hierarchy[k];
        }
      });
      setHierarchy(updatedHierarchy);
      ERPStorage.saveProductHierarchy(updatedHierarchy);

      // 2. Remove products under this category
      const updated = products.filter((p) => (p.category || '').toLowerCase() !== categoryToDelete.toLowerCase());
      onSaveProducts(updated);

      if (selectedCategory.toLowerCase() === categoryToDelete.toLowerCase()) {
        setSelectedCategory('all');
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
      // 1. Permanently remove sub-category from all categories in dynamic hierarchy state and storage
      const updatedHierarchy: Record<string, string[]> = {};
      Object.keys(hierarchy).forEach((catKey) => {
        updatedHierarchy[catKey] = (hierarchy[catKey] || []).filter(
          (sub) => sub.toLowerCase() !== subCategoryToDelete.toLowerCase()
        );
      });
      setHierarchy(updatedHierarchy);
      ERPStorage.saveProductHierarchy(updatedHierarchy);

      // 2. Clear sub-category from associated products
      const updated = products.map((p) =>
        (p.subCategory || '').toLowerCase() === subCategoryToDelete.toLowerCase()
          ? { ...p, subCategory: undefined }
          : p
      );
      onSaveProducts(updated);

      if (selectedSubCategory.toLowerCase() === subCategoryToDelete.toLowerCase()) {
        setSelectedSubCategory('all');
      }
      if (subCategory.toLowerCase() === subCategoryToDelete.toLowerCase()) {
        setSubCategory('');
      }
      setSubCategoryToDelete(null);
    }
  };

  const openUsageModal = (product: FinishedProduct) => {
    setUsageProductId(product.id);
    setUsageQty(0);
    setUsageReason('');
    setUsageDate(new Date().toISOString().split('T')[0]);
  };

  const handleSaveUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageProductId) return;

    const currentProduct = products.find((p) => p.id === usageProductId);
    if (!currentProduct) return;

    const qty = Number(usageQty) || 0;
    if (qty <= 0) return;
    if (qty > (currentProduct.stockQuantity || 0)) {
      setUsageQty(currentProduct.stockQuantity || 0);
      return;
    }

    const updated = products.map((product) => {
      if (product.id !== usageProductId) return product;

      const nextStatement = {
        id: `prod-usage-${Date.now()}`,
        date: usageDate,
        type: 'usage' as const,
        quantity: qty,
        note: usageReason.trim() || 'Stock issued / deducted from warehouse',
        reference: 'Product Usage',
      };

      return {
        ...product,
        stockQuantity: Math.max(0, (product.stockQuantity || 0) - qty),
        stockStatements: [nextStatement, ...(product.stockStatements || [])],
      };
    });

    onSaveProducts(updated);
    setUsageProductId(null);
    setUsageQty(0);
    setUsageReason('');
  };

  const selectedUsageProduct = products.find((p) => p.id === usageProductId) || null;
  const selectedStatementProduct = products.find((p) => p.id === statementProductId) || null;

  return (
    <div className="space-y-6">
      {/* Top Summary Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Total Finished Stock</span>
            <Package className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black">{totalStockPieces.toLocaleString()} <span className="text-sm font-medium text-slate-300">Pieces</span></h2>
          <p className="text-xs text-slate-400 mt-1">Across {products.length} product variants</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Inventory Value</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{currSym} {totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <p className="text-xs text-slate-500 mt-1">Total manufacturing cost capital</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Potential Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{currSym} {totalSalesValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <p className="text-xs text-slate-500 mt-1">At wholesale / selling price</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Estimated Profit Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-emerald-600">+{currSym} {totalPotentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <p className="text-xs text-slate-500 mt-1">Expected profit on inventory</p>
        </div>
      </div>

      {/* Action Header & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Finished Products Catalogue & Stock Directory</h2>
            <p className="text-xs text-slate-500">
              Manage product categories (e.g. <strong>Bedsheets</strong> with 3pcs/4pcs/5pcs, <strong>Comforters</strong>, <strong>Quilts</strong>) & design numbers.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenAddModal('Bedsheet')}
              className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Finished Product</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Design # (e.g. ZF 1089), Name, Category..."
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

          {/* Category Filter Dropdown with Delete Icon in front of options */}
          <DropdownWithDelete
            options={allKnownCategories}
            value={selectedCategory === 'all' ? '' : selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val || 'all');
              setSelectedSubCategory('all');
            }}
            onDeleteOption={(val) => setCategoryToDelete(val)}
            allowNone
            noneLabel="All Categories"
            placeholder="Select Category"
          />

          {/* Sub-Category Filter Dropdown with Delete Icon in front of options */}
          <DropdownWithDelete
            options={Array.from(
              new Set(
                products
                  .filter((p) => selectedCategory === 'all' || (p.category || '').toLowerCase() === selectedCategory.toLowerCase())
                  .map((p) => p.subCategory)
                  .filter(Boolean)
              )
            ) as string[]}
            value={selectedSubCategory === 'all' ? '' : selectedSubCategory}
            onChange={(val) => setSelectedSubCategory(val || 'all')}
            onDeleteOption={(val) => setSubCategoryToDelete(val)}
            allowNone
            noneLabel="All Sub-Categories"
            placeholder="Select Sub-Category"
          />

          {/* Stock Level Filter */}
          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as 'all' | 'low_stock' | 'in_stock')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Stock Statuses</option>
              <option value="low_stock">⚠️ Low Stock Alerts</option>
              <option value="in_stock">✅ In Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Sub-Category</th>
                <th className="py-3 px-4">Design Number</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Stock Qty</th>
                <th className="py-3 px-4 text-right">Stock Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No finished products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.reorderLevel;
                  const stockValue = p.stockQuantity * p.sellingPrice;
                  const isDesignCat = isDesignRequiredCategory(p.category);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {p.subCategory ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {p.subCategory}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {p.designNumber ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            {p.designNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">{isDesignCat ? 'Not Assigned' : 'N/A'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {currSym} {p.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                        {currSym} {p.sellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {p.stockQuantity.toLocaleString()} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        {currSym} {stockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openUsageModal(p)}
                            className="p-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition cursor-pointer"
                            title="Use Product / Deduct Stock"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStatementProductId(p.id)}
                            className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded transition cursor-pointer"
                            title="View Product Statement"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Delete Product"
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

      {/* Product Usage / Deduction Modal */}
      {usageProductId && selectedUsageProduct && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setUsageProductId(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Use Product / Deduct Stock</h3>
                <p className="text-xs text-slate-500">{selectedUsageProduct.name}</p>
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
                Current stock: {selectedUsageProduct.stockQuantity} {selectedUsageProduct.unit}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                Remaining after deduction: <span className="font-extrabold text-slate-900">{Math.max(0, selectedUsageProduct.stockQuantity - usageQty)} {selectedUsageProduct.unit}</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUsageProductId(null)}
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

      {/* Add / Edit Product Modal */}
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
                  {editingProductId ? 'Edit Finished Product' : 'Add New Finished Product'}
                </h3>
                <p className="text-xs text-slate-500">Configure Category, Sub-Category, Design # and Pricing</p>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name / Title <span className="text-[10px] text-slate-400">(Auto-generates if empty)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Classic Bedsheet Double Set (ZF 1089)"
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
                          setCategory('Bedsheet');
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
                    Sub-Category <span className="text-[10px] text-slate-400">(Optional)</span>
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
                        placeholder="e.g. Bedsheet 3pcs, 4pcs, 5pcs"
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
                        ← Choose from list
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Design Number: ONLY required and shown for Bedsheet and Comforter */}
              {isDesignRequiredCategory(activeCategory) && (
                <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-950">
                      Design Number * (for {activeCategory})
                    </label>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Required for Bedsheet / Comforter
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZF 1089, ZF 1090"
                    value={designNumber}
                    onChange={(e) => setDesignNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-amber-700">
                    Design numbers are strictly for bedsheet and comforter patterns (e.g. ZF 1089).
                  </p>
                </div>
              )}

              {/* Pricing & Margins */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ({currSym})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ({currSym})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg text-xs flex justify-between font-bold text-emerald-800 border border-emerald-200">
                <span>Calculated Profit Margin per Piece:</span>
                <span>+{currSym} {(sellingPrice - costPrice).toFixed(2)}</span>
              </div>

              {/* Stock Quantity & Reorder Level */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs / sets / pairs"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
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
                  Save Product Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Statement Summary */}
      {selectedStatementProduct && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Stock Statement</h3>
            </div>
            <button
              type="button"
              onClick={() => setStatementProductId(null)}
              className="text-[10px] text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="mb-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-800">
            {selectedStatementProduct.name}
          </div>

          {selectedStatementProduct.stockStatements && selectedStatementProduct.stockStatements.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedStatementProduct.stockStatements.map((statement) => (
                <div key={statement.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px]">
                  <div>
                    <div className="font-bold text-slate-800">
                      {statement.type === 'production' ? 'Production added' : statement.type === 'usage' ? 'Stock used' : 'Adjustment'}: {statement.quantity} {selectedStatementProduct.unit || 'pcs'}
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
              No stock statements available for this product yet.
            </div>
          )}
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        title="Delete Finished Product"
        itemName={productToDelete ? `${productToDelete.name} ${productToDelete.designNumber ? `(${productToDelete.designNumber})` : ''}` : undefined}
        message="Are you sure you want to delete this product from your inventory stock catalogue?"
        onConfirm={handleConfirmDelete}
        onClose={() => setProductToDelete(null)}
      />

      {/* Category Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!categoryToDelete}
        title="Delete Finished Product Category"
        itemName={categoryToDelete || undefined}
        message={`Are you sure you want to delete all products in category "${categoryToDelete}"? This action cannot be undone.`}
        onConfirm={handleConfirmDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
      />

      {/* Sub-Category Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!subCategoryToDelete}
        title="Delete Sub-Category"
        itemName={subCategoryToDelete || undefined}
        message={`Are you sure you want to remove sub-category "${subCategoryToDelete}" from associated products?`}
        onConfirm={handleConfirmDeleteSubCategory}
        onClose={() => setSubCategoryToDelete(null)}
      />
    </div>
  );
};

