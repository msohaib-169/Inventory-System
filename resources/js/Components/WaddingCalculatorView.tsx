// @ts-nocheck
import React, { useState } from 'react';
import { WaddingStock, WaddingItem, FabricLot, FabricDesign, CurrencyOption } from '../types';
import { getDesignTotalMeters } from '../lib/storage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Scale,
  Plus,
  Calculator,
  Check,
  AlertCircle,
  Trash2,
  MinusCircle,
  Search,
  Filter,
  Layers,
  Edit,
  Package,
  X,
  ChevronRight,
  Layers3,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PieChart,
  Tag,
  Truck,
  Building2,
  ShieldAlert,
  CreditCard,
  RotateCcw,
} from 'lucide-react';

interface WaddingCalculatorViewProps {
  wadding: WaddingStock;
  onSaveWadding: (wadding: WaddingStock) => void;
  lots?: FabricLot[];
  onSaveLots?: (lots: FabricLot[]) => void;
  currency?: CurrencyOption;
}

export const WaddingCalculatorView: React.FC<WaddingCalculatorViewProps> = ({
  wadding,
  onSaveWadding,
  lots = [],
  onSaveLots,
  currency,
}) => {
  const currencySymbol = currency?.symbol || 'Rs.';

  // Ensure default fallback list of wadding items
  const defaultItems: WaddingItem[] = [
    {
      id: 'wad-1',
      type: 'Siliconized Polyester Fiber',
      gsm: 200,
      supplierName: 'National Fiber Mills Ltd',
      lotNumber: 'WAD-LOT-2026-A1',
      ratePerKg: 350,
      availableKg: 400,
      totalPurchasedKg: 500,
      usedKg: 100,
      singleQuiltSpecKg: 0.8,
      doubleQuiltSpecKg: 1.4,
      gaddaSpecKg: 2.0,
      singleQuiltFabricMeters: 2.5,
      doubleQuiltFabricMeters: 4.2,
      gaddaFabricMeters: 3.5,
      fabricRatePerMeter: 120,
      notes: 'Standard 200 GSM siliconized fiber roll for winter quilts',
    },
    {
      id: 'wad-2',
      type: 'Microfiber Soft Wadding',
      gsm: 300,
      supplierName: 'Al-Madina Textile Supplies',
      lotNumber: 'WAD-LOT-2026-B2',
      ratePerKg: 480,
      availableKg: 250,
      totalPurchasedKg: 300,
      usedKg: 50,
      singleQuiltSpecKg: 1.1,
      doubleQuiltSpecKg: 1.8,
      gaddaSpecKg: 2.5,
      singleQuiltFabricMeters: 2.6,
      doubleQuiltFabricMeters: 4.5,
      gaddaFabricMeters: 3.8,
      fabricRatePerMeter: 160,
      notes: 'Ultra soft 300 GSM microfiber filling for comforter sets',
    },
    {
      id: 'wad-3',
      type: 'Thermal Bonded Roll Fiber',
      gsm: 150,
      supplierName: 'Sunrise Non-Woven Co.',
      lotNumber: 'WAD-LOT-2026-C3',
      ratePerKg: 280,
      availableKg: 166,
      totalPurchasedKg: 200,
      usedKg: 34,
      singleQuiltSpecKg: 0.6,
      doubleQuiltSpecKg: 1.1,
      gaddaSpecKg: 1.8,
      singleQuiltFabricMeters: 2.4,
      doubleQuiltFabricMeters: 4.0,
      gaddaFabricMeters: 3.2,
      fabricRatePerMeter: 110,
      notes: '150 GSM lightweight thermal bonded fiber for summer blankets',
    },
  ];

  const items: WaddingItem[] = wadding.items ?? defaultItems;

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'estimator' | 'inventory' | 'fabric_inward' | 'add'>('estimator');

  // Search & Filter state for Inventory
  const [searchQuery, setSearchQuery] = useState('');
  const [gsmFilter, setGsmFilter] = useState<string>('all');

  // Fabric Inward Management State
  const [isFabricModalOpen, setIsFabricModalOpen] = useState(false);
  const [editingFabricLotId, setEditingFabricLotId] = useState<string | null>(null);
  const [fabricLotToDelete, setFabricLotToDelete] = useState<FabricLot | null>(null);

  const [inwardLotNumber, setInwardLotNumber] = useState('');
  const [inwardSupplierName, setInwardSupplierName] = useState('');
  const [inwardDateReceived, setInwardDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [inwardNotes, setInwardNotes] = useState('');
  const [inwardDesigns, setInwardDesigns] = useState<FabricDesign[]>([
    { id: 'design-1', designNumber: 'DS-101', designName: 'Royal Printed Cotton', frontMeters: 450, reverseMeters: 450 },
  ]);
  const [fabricSearchQuery, setFabricSearchQuery] = useState('');

  // Dedicated Simple Quilt, Double & Gadda Estimator State
  const [simpleTotalWaddingKg, setSimpleTotalWaddingKg] = useState<number>(0);
  const [simpleSingleSpecKg, setSimpleSingleSpecKg] = useState<number>(0);
  const [simpleDoubleSpecKg, setSimpleDoubleSpecKg] = useState<number>(0);
  const [simpleGaddaSpecKg, setSimpleGaddaSpecKg] = useState<number>(0);

  const [simpleSingleFabricMtr, setSimpleSingleFabricMtr] = useState<number>(0);
  const [simpleDoubleFabricMtr, setSimpleDoubleFabricMtr] = useState<number>(0);
  const [simpleGaddaFabricMtr, setSimpleGaddaFabricMtr] = useState<number>(0);

  const [simpleSingleCost, setSimpleSingleCost] = useState<number>(0);
  const [simpleSinglePrice, setSimpleSinglePrice] = useState<number>(0);

  const [simpleDoubleCost, setSimpleDoubleCost] = useState<number>(0);
  const [simpleDoublePrice, setSimpleDoublePrice] = useState<number>(0);

  const [simpleGaddaCost, setSimpleGaddaCost] = useState<number>(0);
  const [simpleGaddaPrice, setSimpleGaddaPrice] = useState<number>(0);

  const [simpleTargetSingle, setSimpleTargetSingle] = useState<number>(0);
  const [simpleTargetDouble, setSimpleTargetDouble] = useState<number>(0);
  const [simpleTargetGadda, setSimpleTargetGadda] = useState<number>(0);

  // Modal State for Quick Stock Adjustments
  const [stockModalItem, setStockModalItem] = useState<WaddingItem | null>(null);
  const [stockModalAction, setStockModalAction] = useState<'add' | 'deduct' | 'edit_spec' | null>(null);
  const [modalKgValue, setModalKgValue] = useState('');
  const [modalSingleSpec, setModalSingleSpec] = useState('');
  const [modalDoubleSpec, setModalDoubleSpec] = useState('');
  const [modalGaddaSpec, setModalGaddaSpec] = useState('');
  const [modalSingleFabric, setModalSingleFabric] = useState('');
  const [modalDoubleFabric, setModalDoubleFabric] = useState('');
  const [modalGaddaFabric, setModalGaddaFabric] = useState('');
  const [modalWaddingRate, setModalWaddingRate] = useState('');
  const [modalFabricRate, setModalFabricRate] = useState('');
  const [modalReasonNotes, setModalReasonNotes] = useState('');

  // Delete Item Confirmation State
  const [itemToDelete, setItemToDelete] = useState<WaddingItem | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);

  // Add New Variety Form State
  const [newTypeName, setNewTypeName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newLotNumber, setNewLotNumber] = useState('');
  const [newGsm, setNewGsm] = useState<number>(0);
  const [newInitialKg, setNewInitialKg] = useState<number>(0);
  const [newRatePerKg, setNewRatePerKg] = useState<number>(0);
  const [newTotalCost, setNewTotalCost] = useState<number | undefined>(undefined);
  const [newAmountPaid, setNewAmountPaid] = useState<number>(0);
  const [newPaymentStatus, setNewPaymentStatus] = useState<'Paid' | 'Partial' | 'Unpaid'>('Unpaid');
  const [newPaymentNotes, setNewPaymentNotes] = useState<string>('');
  const [newSingleSpec, setNewSingleSpec] = useState<number>(0);
  const [newDoubleSpec, setNewDoubleSpec] = useState<number>(0);
  const [newGaddaSpec, setNewGaddaSpec] = useState<number>(0);
  const [newSingleFabricMeters, setNewSingleFabricMeters] = useState<number>(0);
  const [newDoubleFabricMeters, setNewDoubleFabricMeters] = useState<number>(0);
  const [newGaddaFabricMeters, setNewGaddaFabricMeters] = useState<number>(0);
  const [newFabricRatePerMeter, setNewFabricRatePerMeter] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');

  // Quick Pay Modal for Wadding Supplier
  const [quickPayWadding, setQuickPayWadding] = useState<WaddingItem | null>(null);
  const [quickPayWaddingAmount, setQuickPayWaddingAmount] = useState<number>(0);
  const [quickPayWaddingNotes, setQuickPayWaddingNotes] = useState<string>('');

  // Production Feed Entry Form State
  const [selectedWaddingId, setSelectedWaddingId] = useState<string>(items[0]?.id || '');
  const [selectedFabricLot, setSelectedFabricLot] = useState<string>(lots[0]?.lotNumber || 'LOT-2026-001');
  const [customFabricLot, setCustomFabricLot] = useState<string>('');
  const [singleQuiltsProduced, setSingleQuiltsProduced] = useState<number>(0);
  const [doubleQuiltsProduced, setDoubleQuiltsProduced] = useState<number>(0);
  const [feedWaddingRate, setFeedWaddingRate] = useState<number>(0);
  const [feedFabricRate, setFeedFabricRate] = useState<number>(0);
  const [feedLaborCostPerPiece, setFeedLaborCostPerPiece] = useState<number>(0);
  const [feedSellingPriceSingle, setFeedSellingPriceSingle] = useState<number>(0);
  const [feedSellingPriceDouble, setFeedSellingPriceDouble] = useState<number>(0);
  const [feedNotes, setFeedNotes] = useState<string>('');

  // Estimator Calculator State
  const [estimatorSelectedItemId, setEstimatorSelectedItemId] = useState<string>('all');
  const [targetSingleQty, setTargetSingleQty] = useState<number>(0);
  const [targetDoubleQty, setTargetDoubleQty] = useState<number>(0);
  const [fixedWaddingKgInput, setFixedWaddingKgInput] = useState<number>(0);
  const [singleAllocationPercent, setSingleAllocationPercent] = useState<number>(0);

  // Sync selected wadding item attributes to Feed Entry form
  const currentFeedWaddingItem = items.find((i) => i.id === selectedWaddingId) || items[0];

  React.useEffect(() => {
    if (currentFeedWaddingItem) {
      if (currentFeedWaddingItem.ratePerKg) setFeedWaddingRate(currentFeedWaddingItem.ratePerKg);
      if (currentFeedWaddingItem.fabricRatePerMeter) setFeedFabricRate(currentFeedWaddingItem.fabricRatePerMeter);
    }
  }, [selectedWaddingId]);

  // Helper to sync updated items array back to global WaddingStock
  const updateWaddingData = (newItems: WaddingItem[]) => {
    const totalAvailable = newItems.reduce((sum, i) => sum + i.availableKg, 0);
    const totalPurchased = newItems.reduce((sum, i) => sum + i.totalPurchasedKg, 0);
    const totalUsed = newItems.reduce((sum, i) => sum + i.usedKg, 0);

    const firstItem = newItems[0];
    const defaultSingleSpec = firstItem ? firstItem.singleQuiltSpecKg : 0.8;
    const defaultDoubleSpec = firstItem ? firstItem.doubleQuiltSpecKg : 1.4;

    onSaveWadding({
      ...wadding,
      availableKg: totalAvailable,
      totalPurchasedKg: totalPurchased,
      usedKg: totalUsed,
      singleQuiltSpecKg: defaultSingleSpec,
      doubleQuiltSpecKg: defaultDoubleSpec,
      items: newItems,
    });
  };

  // Filter wadding items
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.type.toLowerCase().includes(q) ||
      item.gsm.toString().includes(q) ||
      (item.supplierName && item.supplierName.toLowerCase().includes(q)) ||
      (item.supplierAddress && item.supplierAddress.toLowerCase().includes(q)) ||
      (item.lotNumber && item.lotNumber.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q));

    let matchesGsm = true;
    if (gsmFilter === 'light') matchesGsm = item.gsm < 200;
    else if (gsmFilter === 'medium') matchesGsm = item.gsm >= 200 && item.gsm <= 250;
    else if (gsmFilter === 'heavy') matchesGsm = item.gsm > 250;

    return matchesSearch && matchesGsm;
  });

  // Action Handler: Add New Wadding Variety
  const handleAddNewVariety = (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = newTypeName.trim();
    if (!finalType || !newGsm || newGsm <= 0) {
      alert('Please enter a valid Wadding Type name and GSM value.');
      return;
    }

    const initialKg = Number(newInitialKg) || 0;
    const ratePerKg = Number(newRatePerKg) || 350;
    const cost = newTotalCost !== undefined ? Number(newTotalCost) : initialKg * ratePerKg;
    const paid = Number(newAmountPaid) || 0;
    let status: 'Paid' | 'Partial' | 'Unpaid' = newPaymentStatus;
    if (cost > 0 && paid >= cost) status = 'Paid';
    else if (paid > 0) status = 'Partial';
    else status = 'Unpaid';

    const newItem: WaddingItem = {
      id: `wad-${Date.now()}`,
      type: finalType,
      gsm: Number(newGsm),
      supplierName: newSupplierName.trim() || 'Direct Supplier',
      supplierAddress: newSupplierAddress.trim() || undefined,
      lotNumber: newLotNumber.trim() || `WAD-LOT-${Date.now().toString().slice(-4)}`,
      ratePerKg,
      availableKg: initialKg,
      totalPurchasedKg: initialKg,
      usedKg: 0,
      singleQuiltSpecKg: Number(newSingleSpec) || 0.8,
      doubleQuiltSpecKg: Number(newDoubleSpec) || 1.4,
      gaddaSpecKg: Number(newGaddaSpec) || 2.0,
      singleQuiltFabricMeters: Number(newSingleFabricMeters) || 2.5,
      doubleQuiltFabricMeters: Number(newDoubleFabricMeters) || 4.2,
      gaddaFabricMeters: Number(newGaddaFabricMeters) || 3.5,
      fabricRatePerMeter: Number(newFabricRatePerMeter) || 120,
      totalCost: cost,
      amountPaid: paid,
      paymentStatus: status,
      paymentNotes: newPaymentNotes.trim(),
      notes: newNotes.trim(),
    };

    const updatedItems = [newItem, ...items];
    updateWaddingData(updatedItems);

    // Reset Form
    setNewTypeName('');
    setNewSupplierName('');
    setNewSupplierAddress('');
    setNewLotNumber('');
    setNewGsm(0);
    setNewInitialKg(0);
    setNewRatePerKg(0);
    setNewTotalCost(undefined);
    setNewAmountPaid(0);
    setNewPaymentStatus('Unpaid');
    setNewPaymentNotes('');
    setNewSingleSpec(0);
    setNewDoubleSpec(0);
    setNewGaddaSpec(0);
    setNewSingleFabricMeters(0);
    setNewDoubleFabricMeters(0);
    setNewGaddaFabricMeters(0);
    setNewFabricRatePerMeter(0);
    setNewNotes('');
    setActiveTab('inventory');
    alert(`Successfully added new ${newItem.gsm} GSM ${newItem.type} wadding lot (${newItem.lotNumber})!`);
  };

  // Quick Pay Modal Handler for Wadding Supplier
  const handleOpenQuickPayWadding = (item: WaddingItem) => {
    setQuickPayWadding(item);
    setQuickPayWaddingAmount(item.amountPaid || 0);
    setQuickPayWaddingNotes(item.paymentNotes || '');
  };

  const handleSaveQuickPayWadding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayWadding) return;

    const totalCost =
      quickPayWadding.totalCost !== undefined
        ? quickPayWadding.totalCost
        : quickPayWadding.totalPurchasedKg * (quickPayWadding.ratePerKg || 350);
    const paidVal = Number(quickPayWaddingAmount) || 0;
    let status: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (totalCost > 0 && paidVal >= totalCost) status = 'Paid';
    else if (paidVal > 0) status = 'Partial';

    const updatedItems = items.map((item) => {
      if (item.id !== quickPayWadding.id) return item;
      return {
        ...item,
        amountPaid: paidVal,
        paymentStatus: status,
        paymentNotes: quickPayWaddingNotes,
      };
    });

    updateWaddingData(updatedItems);
    setQuickPayWadding(null);
  };

  // Stock Modal Submit
  const handleStockModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalItem || !stockModalAction) return;

    const val = Number(modalKgValue) || 0;

    const updatedItems = items.map((item) => {
      if (item.id !== stockModalItem.id) return item;

      if (stockModalAction === 'add') {
        return {
          ...item,
          totalPurchasedKg: item.totalPurchasedKg + val,
          availableKg: item.availableKg + val,
          notes: modalReasonNotes ? `${item.notes || ''} | Topup: ${modalReasonNotes}` : item.notes,
        };
      } else if (stockModalAction === 'deduct') {
        const deductVal = Math.min(val, item.availableKg);
        return {
          ...item,
          availableKg: Math.max(0, item.availableKg - deductVal),
          usedKg: item.usedKg + deductVal,
          notes: modalReasonNotes ? `${item.notes || ''} | Deduction: ${modalReasonNotes}` : item.notes,
        };
      } else if (stockModalAction === 'edit_spec') {
        return {
          ...item,
          singleQuiltSpecKg: Number(modalSingleSpec) || item.singleQuiltSpecKg,
          doubleQuiltSpecKg: Number(modalDoubleSpec) || item.doubleQuiltSpecKg,
          gaddaSpecKg: Number(modalGaddaSpec) || item.gaddaSpecKg || 2.0,
          singleQuiltFabricMeters: Number(modalSingleFabric) || item.singleQuiltFabricMeters || 2.5,
          doubleQuiltFabricMeters: Number(modalDoubleFabric) || item.doubleQuiltFabricMeters || 4.2,
          gaddaFabricMeters: Number(modalGaddaFabric) || item.gaddaFabricMeters || 3.5,
          ratePerKg: Number(modalWaddingRate) || item.ratePerKg || 350,
          fabricRatePerMeter: Number(modalFabricRate) || item.fabricRatePerMeter || 120,
        };
      }
      return item;
    });

    updateWaddingData(updatedItems);
    closeStockModal();
  };

  const openStockModal = (item: WaddingItem, action: 'add' | 'deduct' | 'edit_spec') => {
    setStockModalItem(item);
    setStockModalAction(action);
    setModalKgValue('');
    setModalSingleSpec(item.singleQuiltSpecKg.toString());
    setModalDoubleSpec(item.doubleQuiltSpecKg.toString());
    setModalGaddaSpec((item.gaddaSpecKg || 2.0).toString());
    setModalSingleFabric((item.singleQuiltFabricMeters || 2.5).toString());
    setModalDoubleFabric((item.doubleQuiltFabricMeters || 4.2).toString());
    setModalGaddaFabric((item.gaddaFabricMeters || 3.5).toString());
    setModalWaddingRate((item.ratePerKg || 350).toString());
    setModalFabricRate((item.fabricRatePerMeter || 120).toString());
    setModalReasonNotes('');
  };

  const closeStockModal = () => {
    setStockModalItem(null);
    setStockModalAction(null);
    setModalKgValue('');
    setModalReasonNotes('');
  };

  // Fabric Inward Management Handlers
  const handleOpenAddFabricLot = () => {
    setEditingFabricLotId(null);
    setInwardLotNumber(`LOT-2026-${Math.floor(100 + Math.random() * 900)}`);
    setInwardSupplierName('');
    setInwardDateReceived(new Date().toISOString().split('T')[0]);
    setInwardNotes('');
    setInwardDesigns([
      { id: `design-${Date.now()}-1`, designNumber: 'DS-101', designName: 'Premium Printed Cotton', frontMeters: 0, reverseMeters: 0, totalMeters: 1000 }
    ]);
    setIsFabricModalOpen(true);
  };

  const handleOpenEditFabricLot = (lot: FabricLot) => {
    setEditingFabricLotId(lot.id);
    setInwardLotNumber(lot.lotNumber);
    setInwardSupplierName(lot.supplierName);
    setInwardDateReceived(lot.dateReceived);
    setInwardNotes(lot.notes || '');
    setInwardDesigns(
      lot.designs && lot.designs.length > 0
        ? lot.designs.map((d) => ({ ...d, totalMeters: getDesignTotalMeters(d) }))
        : [{ id: `d-1`, designNumber: 'DS-101', designName: '', frontMeters: 0, reverseMeters: 0, totalMeters: 500 }]
    );
    setIsFabricModalOpen(true);
  };

  const handleAddDesignRow = () => {
    setInwardDesigns((prev) => [
      ...prev,
      {
        id: `design-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        designNumber: `DS-${Math.floor(100 + Math.random() * 900)}`,
        designName: '',
        frontMeters: 0,
        reverseMeters: 0,
        totalMeters: 500,
      },
    ]);
  };

  const handleRemoveDesignRow = (index: number) => {
    setInwardDesigns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDesignChange = (index: number, field: keyof FabricDesign, value: string | number) => {
    setInwardDesigns((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveFabricLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardLotNumber.trim()) return;

    const sanitizedDesigns = inwardDesigns.map((d) => {
      const totalMtrs = Number(d.totalMeters) || getDesignTotalMeters(d);
      return {
        ...d,
        frontMeters: 0,
        reverseMeters: 0,
        totalMeters: totalMtrs,
      };
    });

    if (editingFabricLotId) {
      const updated = lots.map((l) =>
        l.id === editingFabricLotId
          ? { ...l, lotNumber: inwardLotNumber, supplierName: inwardSupplierName, dateReceived: inwardDateReceived, notes: inwardNotes, designs: sanitizedDesigns }
          : l
      );
      if (onSaveLots) onSaveLots(updated);
    } else {
      const newLot: FabricLot = {
        id: `lot-${Date.now()}`,
        lotNumber: inwardLotNumber,
        supplierName: inwardSupplierName,
        dateReceived: inwardDateReceived,
        notes: inwardNotes,
        designs: sanitizedDesigns,
      };
      if (onSaveLots) onSaveLots([newLot, ...lots]);
    }

    setIsFabricModalOpen(false);
  };

  const handleConfirmDeleteFabricLot = () => {
    if (fabricLotToDelete && onSaveLots) {
      const updated = lots.filter((l) => l.id !== fabricLotToDelete.id);
      onSaveLots(updated);
      setFabricLotToDelete(null);
    }
  };

  // Fabric Inward Stock Calculations
  const totalFabricInwardMeters = lots.reduce((acc, lot) => {
    const lotMeters = (lot.designs || []).reduce(
      (sum, d) => sum + getDesignTotalMeters(d),
      0
    );
    return acc + lotMeters;
  }, 0);

  const totalFabricLotsCount = lots.length;
  const totalFabricDesignsCount = lots.reduce((acc, lot) => acc + (lot.designs?.length || 0), 0);

  const filteredFabricLots = lots.filter((lot) => {
    const q = fabricSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchLot = lot.lotNumber.toLowerCase().includes(q);
    const matchSupplier = lot.supplierName.toLowerCase().includes(q);
    const matchDesign = lot.designs.some(
      (d) => d.designName.toLowerCase().includes(q) || d.designNumber.toLowerCase().includes(q)
    );
    return matchLot || matchSupplier || matchDesign;
  });

  // Delete Wadding Variety Item
  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    const updatedItems = items.filter((i) => i.id !== itemToDelete.id);
    updateWaddingData(updatedItems);
    setItemToDelete(null);
  };

  // Clear All Wadding Stock
  const handleConfirmClearAll = () => {
    onSaveWadding({
      totalPurchasedKg: 0,
      usedKg: 0,
      availableKg: 0,
      singleQuiltSpecKg: 0.8,
      doubleQuiltSpecKg: 1.4,
      items: [],
    });
    setIsConfirmClearAllOpen(false);
  };

  // Estimator Calculations
  const selectedEstimatorItem = items.find((i) => i.id === estimatorSelectedItemId);
  const estSingleSpec = selectedEstimatorItem ? selectedEstimatorItem.singleQuiltSpecKg : wadding.singleQuiltSpecKg || 0.8;
  const estDoubleSpec = selectedEstimatorItem ? selectedEstimatorItem.doubleQuiltSpecKg : wadding.doubleQuiltSpecKg || 1.4;
  const estAvailableKg = selectedEstimatorItem ? selectedEstimatorItem.availableKg : wadding.availableKg;

  const reqSingleKg = targetSingleQty * estSingleSpec;
  const reqDoubleKg = targetDoubleQty * estDoubleSpec;
  const grandReqKg = reqSingleKg + reqDoubleKg;

  const singleAllocatedKg = (fixedWaddingKgInput * singleAllocationPercent) / 100;
  const doubleAllocatedKg = fixedWaddingKgInput - singleAllocatedKg;
  const maxSingleQuiltsPossible = Math.floor(singleAllocatedKg / (estSingleSpec || 0.8));
  const maxDoubleQuiltsPossible = Math.floor(doubleAllocatedKg / (estDoubleSpec || 1.4));

  const gsmPresets = [100, 120, 150, 180, 200, 250, 300, 350, 400];

  // Dedicated Simple Estimator Calculations for Single Quilt, Double Quilt & Gadda
  const simpleS_Kg = simpleSingleSpecKg > 0 ? simpleSingleSpecKg : 0;
  const simpleD_Kg = simpleDoubleSpecKg > 0 ? simpleDoubleSpecKg : 0;
  const simpleG_Kg = simpleGaddaSpecKg > 0 ? simpleGaddaSpecKg : 0;

  const simpleS_Fab = simpleSingleFabricMtr > 0 ? simpleSingleFabricMtr : 0;
  const simpleD_Fab = simpleDoubleFabricMtr > 0 ? simpleDoubleFabricMtr : 0;
  const simpleG_Fab = simpleGaddaFabricMtr > 0 ? simpleGaddaFabricMtr : 0;

  const totalAvailableKg = simpleTotalWaddingKg > 0 ? simpleTotalWaddingKg : 0;

  // Material required for target batch order (Single + Double + Gadda)
  const singleTargetWaddingNeeded = Number((simpleTargetSingle * simpleS_Kg).toFixed(1));
  const singleTargetFabricNeeded = Number((simpleTargetSingle * simpleS_Fab).toFixed(1));
  const singleTargetCost = simpleTargetSingle * simpleSingleCost;
  const singleTargetRevenue = simpleTargetSingle * simpleSinglePrice;
  const singleTargetProfit = singleTargetRevenue - singleTargetCost;

  const doubleTargetWaddingNeeded = Number((simpleTargetDouble * simpleD_Kg).toFixed(1));
  const doubleTargetFabricNeeded = Number((simpleTargetDouble * simpleD_Fab).toFixed(1));
  const doubleTargetCost = simpleTargetDouble * simpleDoubleCost;
  const doubleTargetRevenue = simpleTargetDouble * simpleDoublePrice;
  const doubleTargetProfit = doubleTargetRevenue - doubleTargetCost;

  const gaddaTargetWaddingNeeded = Number((simpleTargetGadda * simpleG_Kg).toFixed(1));
  const gaddaTargetFabricNeeded = Number((simpleTargetGadda * simpleG_Fab).toFixed(1));
  const gaddaTargetCost = simpleTargetGadda * simpleGaddaCost;
  const gaddaTargetRevenue = simpleTargetGadda * simpleGaddaPrice;
  const gaddaTargetProfit = gaddaTargetRevenue - gaddaTargetCost;

  const targetWaddingNeeded = Number((singleTargetWaddingNeeded + doubleTargetWaddingNeeded + gaddaTargetWaddingNeeded).toFixed(1));
  const targetFabricNeeded = Number((singleTargetFabricNeeded + doubleTargetFabricNeeded + gaddaTargetFabricNeeded).toFixed(1));
  const targetTotalCost = singleTargetCost + doubleTargetCost + gaddaTargetCost;
  const targetTotalRevenue = singleTargetRevenue + doubleTargetRevenue + gaddaTargetRevenue;
  const targetTotalProfit = targetTotalRevenue - targetTotalCost;

  const waddingStockBalance = Number((totalAvailableKg - targetWaddingNeeded).toFixed(1));
  const fabricStockBalanceMeters = Number((totalFabricInwardMeters - targetFabricNeeded).toFixed(1));

  // Max capacity per item if producing ONLY 1 product category from available wadding
  const singleOnlyMaxPcs = simpleS_Kg > 0 ? Math.floor(totalAvailableKg / simpleS_Kg) : 0;
  const singleOnlyWaddingKg = Number((singleOnlyMaxPcs * simpleS_Kg).toFixed(1));
  const singleOnlyFabricMtr = Number((singleOnlyMaxPcs * simpleS_Fab).toFixed(1));
  const singleOnlyCost = singleOnlyMaxPcs * simpleSingleCost;
  const singleOnlyRevenue = singleOnlyMaxPcs * simpleSinglePrice;
  const singleOnlyProfit = singleOnlyRevenue - singleOnlyCost;

  const doubleOnlyMaxPcs = simpleD_Kg > 0 ? Math.floor(totalAvailableKg / simpleD_Kg) : 0;
  const doubleOnlyWaddingKg = Number((doubleOnlyMaxPcs * simpleD_Kg).toFixed(1));
  const doubleOnlyFabricMtr = Number((doubleOnlyMaxPcs * simpleD_Fab).toFixed(1));
  const doubleOnlyCost = doubleOnlyMaxPcs * simpleDoubleCost;
  const doubleOnlyRevenue = doubleOnlyMaxPcs * simpleDoublePrice;
  const doubleOnlyProfit = doubleOnlyRevenue - doubleOnlyCost;

  const gaddaOnlyMaxPcs = simpleG_Kg > 0 ? Math.floor(totalAvailableKg / simpleG_Kg) : 0;
  const gaddaOnlyWaddingKg = Number((gaddaOnlyMaxPcs * simpleG_Kg).toFixed(1));
  const gaddaOnlyFabricMtr = Number((gaddaOnlyMaxPcs * simpleG_Fab).toFixed(1));
  const gaddaOnlyCost = gaddaOnlyMaxPcs * simpleGaddaCost;
  const gaddaOnlyRevenue = gaddaOnlyMaxPcs * simpleGaddaPrice;
  const gaddaOnlyProfit = gaddaOnlyRevenue - gaddaOnlyCost;
  return (
    <div className="space-y-6">
      {/* Top Consolidated Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Wadding & Quilt Manufacturing ERP</h2>
              <p className="text-xs text-indigo-200">
                Fiber Stock, Fabric Consumption & Quilt Material Calculator
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <span className="text-indigo-200 text-[10px] block font-medium">Available Fiber</span>
              <span className="text-sm font-extrabold text-emerald-300">{wadding.availableKg.toLocaleString()} Kg</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <span className="text-indigo-200 text-[10px] block font-medium">Total Purchased</span>
              <span className="text-sm font-extrabold text-white">{wadding.totalPurchasedKg.toLocaleString()} Kg</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <span className="text-indigo-200 text-[10px] block font-medium">Total Fiber Used</span>
              <span className="text-sm font-extrabold text-indigo-200">{wadding.usedKg.toLocaleString()} Kg</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <span className="text-indigo-200 text-[10px] block font-medium">Active Varieties</span>
              <span className="text-sm font-extrabold text-indigo-300">{items.length} Types</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container with Tab Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tab Header */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('estimator')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                activeTab === 'estimator'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Calculator className="w-4 h-4 text-amber-300" />
              <span>⚡ Quilt, Double & Gadda Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Wadding Varieties ({items.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ New Variety / Lot</span>
            </button>
          </div>

          {activeTab === 'inventory' && (
            <button
              onClick={() => setIsConfirmClearAllOpen(true)}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1 px-2 py-1 hover:bg-red-50 rounded transition cursor-pointer"
              title="Reset all wadding stock data"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Stock</span>
            </button>
          )}
        </div>

        {/* Tab 1: Wadding Inventory Table */}
        {activeTab === 'inventory' && (
          <div className="p-5 space-y-4">
            {/* Wadding Summary Stats Header */}
            {(() => {
              const overallWaddingKg = items.reduce((acc, i) => acc + i.availableKg, 0);
              const overallWaddingCost = items.reduce(
                (acc, i) => acc + (i.totalCost !== undefined ? i.totalCost : i.totalPurchasedKg * (i.ratePerKg || 350)),
                0
              );
              const overallWaddingPaid = items.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
              const overallWaddingDue = Math.max(0, overallWaddingCost - overallWaddingPaid);

              return (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                      Total Wadding In Stock
                    </span>
                    <span className="text-xl font-black">{overallWaddingKg.toLocaleString()} Kg</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Across all roll varieties</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Total Purchase Cost
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      {currencySymbol} {overallWaddingCost.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Total wadding invoice value</span>
                  </div>

                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Amount Paid to Suppliers
                    </span>
                    <span className="text-xl font-black text-emerald-950">
                      {currencySymbol} {overallWaddingPaid.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">Paid to wadding mills</span>
                  </div>

                  <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Supplier Balance Due
                    </span>
                    <span className="text-xl font-black text-amber-950">
                      {currencySymbol} {overallWaddingDue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">Remaining payable</span>
                  </div>
                </div>
              );
            })()}

            {/* Search & GSM Filter Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-800 text-xs">Filter Wadding Stock:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1 sm:flex-none">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search type, supplier, lot # or GSM..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

                <select
                  value={gsmFilter}
                  onChange={(e) => setGsmFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All GSM Ratings</option>
                  <option value="light">Light (&lt; 200 GSM)</option>
                  <option value="medium">Medium (200 - 250 GSM)</option>
                  <option value="heavy">Heavy (&gt; 250 GSM)</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No wadding items match your search or filter parameters.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Wadding Type & Supplier Lot</th>
                      <th className="py-3 px-4 text-center">GSM Rating</th>
                      <th className="py-3 px-4 text-center">Available Stock</th>
                      <th className="py-3 px-4">Quilt Consumption Specs</th>
                      <th className="py-3 px-4">Cost & Supplier Payment</th>
                      <th className="py-3 px-4 text-center">Stock & Payment Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const itemTotalCost =
                        item.totalCost !== undefined
                          ? item.totalCost
                          : item.totalPurchasedKg * (item.ratePerKg || 350);
                      const itemPaid = Number(item.amountPaid || 0);
                      const itemBalance = Math.max(0, itemTotalCost - itemPaid);
                      const itemStatus =
                        item.paymentStatus ||
                        (itemTotalCost > 0 && itemPaid >= itemTotalCost ? 'Paid' : itemPaid > 0 ? 'Partial' : 'Unpaid');

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-slate-900 block">{item.type}</span>
                              <span
                                className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${
                                  itemStatus === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : itemStatus === 'Partial'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {itemStatus}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                              {item.supplierName && (
                                <span className="flex items-center space-x-1">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  <span>{item.supplierName}</span>
                                  {item.supplierAddress && <span className="text-slate-400 font-normal">({item.supplierAddress})</span>}
                                </span>
                              )}
                              {item.lotNumber && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 border border-slate-200">
                                  {item.lotNumber}
                                </span>
                              )}
                            </div>
                            {item.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{item.notes}</p>}
                            {item.paymentNotes && (
                              <p className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded mt-1">
                                Pay Note: {item.paymentNotes}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-md border border-indigo-200 text-xs">
                              {item.gsm} GSM
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`font-extrabold text-sm ${
                                item.availableKg <= 50 ? 'text-red-600' : 'text-emerald-700'
                              }`}
                            >
                              {item.availableKg.toLocaleString()} Kg
                            </span>
                            {item.availableKg <= 50 && (
                              <span className="block text-[10px] font-semibold text-red-500 uppercase tracking-wider">
                                Low Stock
                              </span>
                            )}
                            <span className="block text-[10px] text-slate-400">Total: {item.totalPurchasedKg} Kg</span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-[11px] text-slate-700 font-medium">
                              <div>
                                <span className="text-slate-400">Single:</span>{' '}
                                <strong className="text-slate-900">{item.singleQuiltSpecKg} kg</strong> | {item.singleQuiltFabricMeters || 2.5}m
                              </div>
                              <div>
                                <span className="text-slate-400">Double:</span>{' '}
                                <strong className="text-slate-900">{item.doubleQuiltSpecKg} kg</strong> | {item.doubleQuiltFabricMeters || 4.2}m
                              </div>
                              <div>
                                <span className="text-emerald-700 font-semibold">Gadda:</span>{' '}
                                <strong className="text-emerald-950">{item.gaddaSpecKg || 2.0} kg</strong> | {item.gaddaFabricMeters || 3.5}m
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-[11px] text-slate-700">
                              <div>
                                <span className="text-slate-400">Rate:</span>{' '}
                                <strong className="text-indigo-700">
                                  {currencySymbol} {item.ratePerKg || 350}/kg
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400">Total Cost:</span>{' '}
                                <strong className="text-slate-900">
                                  {currencySymbol} {itemTotalCost.toLocaleString()}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400">Paid:</span>{' '}
                                <span className="font-bold text-emerald-700">
                                  {currencySymbol} {itemPaid.toLocaleString()}
                                </span>
                                {itemBalance > 0 && (
                                  <span className="text-amber-800 font-semibold ml-1.5">
                                    (Due: {currencySymbol} {itemBalance.toLocaleString()})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1 flex-wrap gap-1">
                              <button
                                onClick={() => handleOpenQuickPayWadding(item)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded border border-emerald-300 flex items-center space-x-1 transition cursor-pointer"
                                title="Pay Wadding Supplier"
                              >
                                <CreditCard className="w-3 h-3 text-emerald-600" />
                                <span>Pay</span>
                              </button>

                              <button
                                onClick={() => openStockModal(item, 'add')}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded border border-indigo-200 flex items-center space-x-1 transition cursor-pointer"
                                title="Add purchased stock"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Stock</span>
                              </button>

                              <button
                                onClick={() => openStockModal(item, 'deduct')}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded border border-amber-200 flex items-center space-x-1 transition cursor-pointer"
                                title="Deduct damaged/waste stock"
                              >
                                <MinusCircle className="w-3 h-3" />
                                <span>- Deduct</span>
                              </button>

                              <button
                                onClick={() => openStockModal(item, 'edit_spec')}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                title="Edit Specs & Pricing"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setItemToDelete(item)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                title="Delete wadding type"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab: Fabric Inward Stock & Arrival Tracker */}
        {activeTab === 'fabric_inward' && (
          <div className="p-5 space-y-5">
            {/* Top Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Fabric Inward Stock & Arrival Details Tracker
                  </h3>
                  <p className="text-xs text-slate-600">
                    Track incoming fabric rolls/lots, supplier challans, front & reverse meterage, and available fabric inventory.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddFabricLot}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Fabric Arrival</span>
              </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Fabric Received</span>
                <div className="text-2xl font-black text-indigo-900 mt-1">
                  {totalFabricInwardMeters.toLocaleString()} <span className="text-xs font-bold text-indigo-700">Meters</span>
                </div>
                <span className="text-[11px] text-slate-500">Across all inward rolls & lots</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Active Fabric Lots</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {totalFabricLotsCount} <span className="text-xs font-bold text-slate-600">Lots</span>
                </div>
                <span className="text-[11px] text-slate-500">Suppliers: {Array.from(new Set(lots.map(l => l.supplierName).filter(Boolean))).join(', ') || 'N/A'}</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Fabric Designs / Qualities</span>
                <div className="text-2xl font-black text-emerald-800 mt-1">
                  {totalFabricDesignsCount} <span className="text-xs font-bold text-emerald-600">Designs</span>
                </div>
                <span className="text-[11px] text-slate-500">Front & reverse roll patterns</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Est. Quilt Capacity</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  ~{Math.floor(totalFabricInwardMeters / 4.2).toLocaleString()} <span className="text-xs font-bold text-emerald-600">Double Quilts</span>
                </div>
                <span className="text-[11px] text-slate-500">Based on 4.2m/pc avg spec</span>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search fabric lots by lot #, supplier, or design name..."
                  value={fabricSearchQuery}
                  onChange={(e) => setFabricSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="text-xs text-slate-600 font-bold self-center">
                Showing {filteredFabricLots.length} of {lots.length} Fabric Lots
              </div>
            </div>

            {/* Fabric Lots Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              {filteredFabricLots.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No fabric lots found. Click <strong>+ Record Fabric Arrival</strong> to add incoming fabric rolls.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                      <th className="p-3">Lot # & Supplier</th>
                      <th className="p-3">Receipt Date</th>
                      <th className="p-3">Fabric Design & Roll Details</th>
                      <th className="p-3 text-right">Total Fabric Meters</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredFabricLots.map((lot) => {
                      const lotTotalMeters = (lot.designs || []).reduce((sum, d) => sum + getDesignTotalMeters(d), 0);

                      return (
                        <tr key={lot.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-medium">
                            <div className="font-extrabold text-indigo-950">{lot.lotNumber}</div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{lot.supplierName || 'General Supplier'}</span>
                            </div>
                            {lot.notes && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5">{lot.notes}</div>
                            )}
                          </td>

                          <td className="p-3 text-slate-600 font-semibold">
                            {lot.dateReceived}
                          </td>

                          <td className="p-3">
                            <div className="space-y-1">
                              {(lot.designs || []).map((d, idx) => (
                                <div key={d.id || idx} className="flex items-center space-x-1.5 text-[11px]">
                                  <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded">{d.designNumber}</span>
                                  <span className="font-semibold text-slate-800">{d.designName || 'Fabric Roll'}</span>
                                  <span className="text-slate-400 font-mono">({getDesignTotalMeters(d).toLocaleString()}m)</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                              {lotTotalMeters.toLocaleString()} Meters
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleOpenEditFabricLot(lot)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Edit Fabric Lot"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setFabricLotToDelete(lot)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Delete Fabric Lot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}        {/* Tab 3: Add New Wadding Variety Form */}
        {activeTab === 'add' && (
          <div className="p-5 max-w-2xl mx-auto space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Register New Wadding Type, Supplier Lot & Consumption Specs</span>
              </h3>
              <p className="text-xs text-slate-500">
                Specify supplier details, cost per Kg, GSM, initial stock received, and single/double quilt specifications.
              </p>
            </div>

            <form onSubmit={handleAddNewVariety} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wadding Type / Material Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Siliconized Polyester Fiber, Microfiber, etc."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GSM Rating (Grams per Sq Meter) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      required
                      min="50"
                      max="1000"
                      placeholder="e.g. 200"
                      value={newGsm || ''}
                      onChange={(e) => setNewGsm(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-extrabold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-500 shrink-0">GSM</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {gsmPresets.map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setNewGsm(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                          newGsm === preset
                            ? 'bg-indigo-600 text-white font-bold border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset} GSM
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Supplier & Lot Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. National Fiber Mills Ltd"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mills Road, Faisalabad"
                    value={newSupplierAddress}
                    onChange={(e) => setNewSupplierAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Lot / Batch Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WAD-LOT-2026-A1"
                    value={newLotNumber}
                    onChange={(e) => setNewLotNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Initial Stock & Cost Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Incoming Stock (Kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 500"
                    value={newInitialKg || ''}
                    onChange={(e) => {
                      const kg = Number(e.target.value);
                      setNewInitialKg(kg);
                      if (newRatePerKg) setNewTotalCost(kg * newRatePerKg);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wadding Cost per Kg ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 350"
                    value={newRatePerKg || ''}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      setNewRatePerKg(rate);
                      if (newInitialKg) setNewTotalCost(newInitialKg * rate);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-indigo-700"
                  />
                </div>
              </div>

              {/* Supplier Purchase & Payment Tracking Box */}
              <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center space-x-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <span>Wadding Supplier Payment Details (Kitni Payment Ki Hai)</span>
                  </h4>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${
                      (newTotalCost !== undefined ? newTotalCost : (newInitialKg || 0) * (newRatePerKg || 350)) > 0 &&
                      newAmountPaid >= (newTotalCost !== undefined ? newTotalCost : (newInitialKg || 0) * (newRatePerKg || 350))
                        ? 'bg-emerald-200 text-emerald-900'
                        : newAmountPaid > 0
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    Status:{' '}
                    {(newTotalCost !== undefined ? newTotalCost : (newInitialKg || 0) * (newRatePerKg || 350)) > 0 &&
                    newAmountPaid >= (newTotalCost !== undefined ? newTotalCost : (newInitialKg || 0) * (newRatePerKg || 350))
                      ? 'Paid'
                      : newAmountPaid > 0
                      ? 'Partial'
                      : 'Unpaid'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Total Lot Cost (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Auto computed"
                      value={newTotalCost !== undefined ? newTotalCost : (newInitialKg || 0) * (newRatePerKg || 350)}
                      onChange={(e) => setNewTotalCost(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      Amount Paid to Supplier (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 25000"
                      value={newAmountPaid || ''}
                      onChange={(e) => setNewAmountPaid(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-400 rounded-lg text-xs font-black text-emerald-950"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1">
                      Supplier Balance Due (Rs.)
                    </label>
                    <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black text-amber-950">
                      Rs.{' '}
                      {Math.max(
                        0,
                        (newTotalCost !== undefined ? newTotalCost : (newInitialKg || 0) * (newRatePerKg || 350)) -
                          newAmountPaid
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Payment Note / Supplier Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid cash 20k on arrival, rest payable on bill submission..."
                    value={newPaymentNotes}
                    onChange={(e) => setNewPaymentNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Specs for Single & Double Quilts */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Manufacturing Consumption Specifications
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Single Wadding (Kg/pc)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={newSingleSpec || ''}
                      onChange={(e) => setNewSingleSpec(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Double Wadding (Kg/pc)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={newDoubleSpec || ''}
                      onChange={(e) => setNewDoubleSpec(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1 flex items-center justify-between">
                      <span>Gadda Wadding (Kg/pc)</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={newGaddaSpec || ''}
                      onChange={(e) => setNewGaddaSpec(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-emerald-50/50 border border-emerald-300 rounded-lg text-xs font-extrabold text-emerald-950"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Single Fabric (Mtr/pc)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={newSingleFabricMeters || ''}
                      onChange={(e) => setNewSingleFabricMeters(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Double Fabric (Mtr/pc)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={newDoubleFabricMeters || ''}
                      onChange={(e) => setNewDoubleFabricMeters(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      Gadda Fabric (Mtr/pc)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={newGaddaFabricMeters || ''}
                      onChange={(e) => setNewGaddaFabricMeters(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-emerald-50/50 border border-emerald-300 rounded-lg text-xs font-extrabold text-emerald-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Fabric Cost per Meter ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newFabricRatePerMeter || ''}
                    onChange={(e) => setNewFabricRatePerMeter(Number(e.target.value))}
                    className="w-full max-w-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quality Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium siliconized 1st quality roll supplier"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Wadding Variety & Specs</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 5: Quilt, Double & Gadda Material Calculator */}
        {activeTab === 'estimator' && (
          <div className="p-5 space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Quilt, Double & Gadda Material Calculator</h3>
                  <p className="text-xs text-slate-600">
                    Calculate total wadding (Kg) and fabric (Meters) required for target batch orders of Single Quilts, Double Quilts, and Gadda.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimpleTotalWaddingKg(0);
                    setSimpleSingleSpecKg(0);
                    setSimpleDoubleSpecKg(0);
                    setSimpleGaddaSpecKg(0);
                    setSimpleSingleFabricMtr(0);
                    setSimpleDoubleFabricMtr(0);
                    setSimpleGaddaFabricMtr(0);
                    setSimpleSingleCost(0);
                    setSimpleSinglePrice(0);
                    setSimpleDoubleCost(0);
                    setSimpleDoublePrice(0);
                    setSimpleGaddaCost(0);
                    setSimpleGaddaPrice(0);
                    setSimpleTargetSingle(0);
                    setSimpleTargetDouble(0);
                    setSimpleTargetGadda(0);
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition shrink-0 cursor-pointer flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset to 0</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimpleTotalWaddingKg(wadding.availableKg || 0)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-indigo-700 shadow-2xs transition shrink-0 cursor-pointer flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Autofill Stock ({wadding.availableKg} Kg)</span>
                </button>
              </div>
            </div>

            {/* Main 2-Column Calculator Form Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Inputs (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-5">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>1. Wadding Stock & Material Specs</span>
                  </h4>
                </div>

                {/* Total Wadding Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Total Available Wadding Stock (Kg) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={simpleTotalWaddingKg || ''}
                      onChange={(e) => setSimpleTotalWaddingKg(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-indigo-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      placeholder="0"
                    />
                    <span className="text-xs font-extrabold text-slate-500 shrink-0">Kg</span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[0, 50, 100, 200, 500, 1000].map((kg) => (
                      <button
                        key={kg}
                        type="button"
                        onClick={() => setSimpleTotalWaddingKg(kg)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          simpleTotalWaddingKg === kg
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {kg} Kg
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consumption Specifications */}
                <div className="space-y-3">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                    Material Consumption per Unit:
                  </span>

                  {/* Single Quilt Specifications */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900">Single Quilt</span>
                      <span className="text-[10px] font-semibold text-slate-500">Per Piece Specs & Financials</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Wadding (Kg)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={simpleSingleSpecKg || ''}
                          onChange={(e) => setSimpleSingleSpecKg(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Fabric (Meters)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={simpleSingleFabricMtr || ''}
                          onChange={(e) => setSimpleSingleFabricMtr(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Cost Price per Pc
                        </label>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={simpleSingleCost || ''}
                          onChange={(e) => setSimpleSingleCost(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Selling Price per Pc
                        </label>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={simpleSinglePrice || ''}
                          onChange={(e) => setSimpleSinglePrice(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Double Quilt Specifications */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900">Double Quilt</span>
                      <span className="text-[10px] font-semibold text-slate-500">Per Piece Specs & Financials</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Wadding (Kg)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={simpleDoubleSpecKg || ''}
                          onChange={(e) => setSimpleDoubleSpecKg(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Fabric (Meters)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={simpleDoubleFabricMtr || ''}
                          onChange={(e) => setSimpleDoubleFabricMtr(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Cost Price per Pc
                        </label>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={simpleDoubleCost || ''}
                          onChange={(e) => setSimpleDoubleCost(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Selling Price per Pc
                        </label>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={simpleDoublePrice || ''}
                          onChange={(e) => setSimpleDoublePrice(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gadda Specifications */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1">
                        <Layers3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Gadda (Mattress Pad/Roll)</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        New Product
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-800 mb-0.5">
                          Wadding (Kg)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={simpleGaddaSpecKg || ''}
                          onChange={(e) => setSimpleGaddaSpecKg(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-extrabold text-slate-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-800 mb-0.5">
                          Fabric (Meters)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={simpleGaddaFabricMtr || ''}
                          onChange={(e) => setSimpleGaddaFabricMtr(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-extrabold text-slate-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-800 mb-0.5">
                          Cost Price per Pc
                        </label>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={simpleGaddaCost || ''}
                          onChange={(e) => setSimpleGaddaCost(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-800 mb-0.5">
                          Selling Price per Pc
                        </label>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={simpleGaddaPrice || ''}
                          onChange={(e) => setSimpleGaddaPrice(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Quantities */}
                <div className="border-t border-slate-200 pt-3 space-y-3">
                  <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>2. Target Order Quantities (Pieces)</span>
                  </h5>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Single Quilts
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={simpleTargetSingle || ''}
                        onChange={(e) => setSimpleTargetSingle(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900 text-center"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Double Quilts
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={simpleTargetDouble || ''}
                        onChange={(e) => setSimpleTargetDouble(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900 text-center"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Gadda
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={simpleTargetGadda || ''}
                        onChange={(e) => setSimpleTargetGadda(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 bg-emerald-50/50 rounded-lg text-xs font-extrabold text-emerald-900 text-center"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Calculator Output (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Main Requirement Calculation Summary Card */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                        Material Calculation Summary
                      </h4>
                    </div>

                    {waddingStockBalance >= 0 ? (
                      <span className="font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full text-xs flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sufficient Stock</span>
                      </span>
                    ) : (
                      <span className="font-extrabold text-red-400 bg-red-500/20 border border-red-500/40 px-3 py-1 rounded-full text-xs flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Shortage by {Math.abs(waddingStockBalance)} Kg</span>
                      </span>
                    )}
                  </div>

                  {/* Primary Metrics Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80">
                      <span className="text-xs text-slate-400 font-medium block">Total Wadding & Fabric</span>
                      <div className="text-lg font-black text-white mt-0.5">
                        {targetWaddingNeeded} <span className="text-xs font-bold text-amber-400">Kg Wadding</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">
                        {targetFabricNeeded} <span className="text-[10px] text-emerald-300">Meters Fabric</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80">
                      <span className="text-xs text-slate-400 font-medium block">Total Order Cost & Revenue</span>
                      <div className="text-lg font-black text-slate-200 mt-0.5">
                        Cost: <span className="text-amber-300">Rs. {targetTotalCost.toLocaleString()}</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-300 mt-0.5">
                        Sales: <span>Rs. {targetTotalRevenue.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/30">
                      <span className="text-xs text-emerald-300 font-bold block">Estimated Net Profit</span>
                      <div className="text-2xl font-black text-emerald-400 mt-0.5">
                        Rs. {targetTotalProfit.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-emerald-300/80 mt-1 block">
                        Revenue minus Total Cost
                      </span>
                    </div>
                  </div>

                  {/* Detailed Item Breakdown Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-800/60 px-3 py-2 font-extrabold text-slate-300 grid grid-cols-12 gap-2 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                      <span className="col-span-3">Item Category</span>
                      <span className="col-span-2 text-center">Target</span>
                      <span className="col-span-3 text-right">Materials</span>
                      <span className="col-span-2 text-right">Cost / Sale</span>
                      <span className="col-span-2 text-right">Net Profit</span>
                    </div>

                    <div className="divide-y divide-slate-800/60 bg-slate-900/50">
                      {/* Single Quilts Row */}
                      {(simpleS_Kg > 0 || simpleTargetSingle > 0) && (
                        <div className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center">
                          <span className="col-span-3 font-bold text-slate-200">Single Quilt</span>
                          <span className="col-span-2 text-center font-extrabold text-slate-100">{simpleTargetSingle} pcs</span>
                          <div className="col-span-3 text-right leading-tight">
                            <div className="font-bold text-amber-300">{singleTargetWaddingNeeded} Kg</div>
                            <div className="text-[10px] text-emerald-400 font-semibold">{singleTargetFabricNeeded} Mtr</div>
                          </div>
                          <div className="col-span-2 text-right leading-tight">
                            <div className="text-[10px] text-slate-400">C: Rs. {singleTargetCost.toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-slate-200">S: Rs. {singleTargetRevenue.toLocaleString()}</div>
                          </div>
                          <span className="col-span-2 text-right font-extrabold text-emerald-400">
                            +Rs. {singleTargetProfit.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Double Quilts Row */}
                      {(simpleD_Kg > 0 || simpleTargetDouble > 0) && (
                        <div className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center">
                          <span className="col-span-3 font-bold text-slate-200">Double Quilt</span>
                          <span className="col-span-2 text-center font-extrabold text-slate-100">{simpleTargetDouble} pcs</span>
                          <div className="col-span-3 text-right leading-tight">
                            <div className="font-bold text-amber-300">{doubleTargetWaddingNeeded} Kg</div>
                            <div className="text-[10px] text-emerald-400 font-semibold">{doubleTargetFabricNeeded} Mtr</div>
                          </div>
                          <div className="col-span-2 text-right leading-tight">
                            <div className="text-[10px] text-slate-400">C: Rs. {doubleTargetCost.toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-slate-200">S: Rs. {doubleTargetRevenue.toLocaleString()}</div>
                          </div>
                          <span className="col-span-2 text-right font-extrabold text-emerald-400">
                            +Rs. {doubleTargetProfit.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Gadda Row */}
                      {(simpleG_Kg > 0 || simpleTargetGadda > 0) && (
                        <div className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center bg-emerald-950/20">
                          <span className="col-span-3 font-bold text-emerald-300 flex items-center space-x-1">
                            <span>Gadda (Mattress)</span>
                          </span>
                          <span className="col-span-2 text-center font-extrabold text-emerald-200">{simpleTargetGadda} pcs</span>
                          <div className="col-span-3 text-right leading-tight">
                            <div className="font-bold text-amber-300">{gaddaTargetWaddingNeeded} Kg</div>
                            <div className="text-[10px] text-emerald-400 font-semibold">{gaddaTargetFabricNeeded} Mtr</div>
                          </div>
                          <div className="col-span-2 text-right leading-tight">
                            <div className="text-[10px] text-emerald-300/70">C: Rs. {gaddaTargetCost.toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-emerald-200">S: Rs. {gaddaTargetRevenue.toLocaleString()}</div>
                          </div>
                          <span className="col-span-2 text-right font-extrabold text-emerald-400">
                            +Rs. {gaddaTargetProfit.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {simpleS_Kg <= 0 && simpleD_Kg <= 0 && simpleG_Kg <= 0 && simpleTargetSingle <= 0 && simpleTargetDouble <= 0 && simpleTargetGadda <= 0 && (
                        <div className="px-3 py-3 text-center text-slate-400 italic">
                          No items selected or inputted for calculation.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Maximum Production Capacity Cards (If 100% Stock Used for 1 Item) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <PieChart className="w-4 h-4 text-indigo-600" />
                    <span>Maximum Production Capacity & Profitability from {totalAvailableKg} Kg Wadding</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Single Quilts Max Capacity */}
                    {simpleS_Kg > 0 && (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                        <span className="text-[11px] font-extrabold text-slate-800 block">Single Quilts Only</span>
                        <div className="text-xl font-black text-indigo-900">
                          {singleOnlyMaxPcs} <span className="text-xs font-bold text-indigo-700">Pcs Max</span>
                        </div>
                        <div className="text-[10px] text-slate-600 space-y-1 border-t border-slate-200 pt-1.5">
                          <div className="flex justify-between">
                            <span>Wadding / Fabric:</span>
                            <strong className="text-slate-800">{singleOnlyWaddingKg}Kg / {singleOnlyFabricMtr}M</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Cost:</span>
                            <strong className="text-slate-700">Rs. {singleOnlyCost.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Sales:</span>
                            <strong className="text-slate-900">Rs. {singleOnlyRevenue.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-1 text-emerald-700 font-extrabold">
                            <span>Max Profit:</span>
                            <span>Rs. {singleOnlyProfit.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Double Quilts Max Capacity */}
                    {simpleD_Kg > 0 && (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                        <span className="text-[11px] font-extrabold text-slate-800 block">Double Quilts Only</span>
                        <div className="text-xl font-black text-indigo-900">
                          {doubleOnlyMaxPcs} <span className="text-xs font-bold text-indigo-700">Pcs Max</span>
                        </div>
                        <div className="text-[10px] text-slate-600 space-y-1 border-t border-slate-200 pt-1.5">
                          <div className="flex justify-between">
                            <span>Wadding / Fabric:</span>
                            <strong className="text-slate-800">{doubleOnlyWaddingKg}Kg / {doubleOnlyFabricMtr}M</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Cost:</span>
                            <strong className="text-slate-700">Rs. {doubleOnlyCost.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Sales:</span>
                            <strong className="text-slate-900">Rs. {doubleOnlyRevenue.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-1 text-emerald-700 font-extrabold">
                            <span>Max Profit:</span>
                            <span>Rs. {doubleOnlyProfit.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gadda Max Capacity */}
                    {simpleG_Kg > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2">
                        <span className="text-[11px] font-extrabold text-emerald-900 block">Gadda Only</span>
                        <div className="text-xl font-black text-emerald-900">
                          {gaddaOnlyMaxPcs} <span className="text-xs font-bold text-emerald-700">Pcs Max</span>
                        </div>
                        <div className="text-[10px] text-emerald-800 space-y-1 border-t border-emerald-200 pt-1.5">
                          <div className="flex justify-between">
                            <span>Wadding / Fabric:</span>
                            <strong className="text-slate-900">{gaddaOnlyWaddingKg}Kg / {gaddaOnlyFabricMtr}M</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Cost:</span>
                            <strong className="text-slate-800">Rs. {gaddaOnlyCost.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Sales:</span>
                            <strong className="text-emerald-950">Rs. {gaddaOnlyRevenue.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between border-t border-emerald-200 pt-1 text-emerald-700 font-extrabold">
                            <span>Max Profit:</span>
                            <span>Rs. {gaddaOnlyProfit.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {simpleS_Kg <= 0 && simpleD_Kg <= 0 && simpleG_Kg <= 0 && (
                      <div className="col-span-full bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl text-center text-xs text-slate-500 font-medium">
                        No material consumption entered. Please enter wadding (Kg per piece) above for Single Quilt, Double Quilt, or Gadda to view maximum capacity.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjust Modal */}
      {stockModalItem && stockModalAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 relative animate-in fade-in">
            <button
              onClick={closeStockModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900">
              {stockModalAction === 'add' && `Add Purchased Stock (${stockModalItem.type})`}
              {stockModalAction === 'deduct' && `Deduct Stock (${stockModalItem.type})`}
              {stockModalAction === 'edit_spec' && `Edit Specifications & Pricing (${stockModalItem.type})`}
            </h3>

            <form onSubmit={handleStockModalSubmit} className="space-y-4">
              {stockModalAction !== 'edit_spec' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {stockModalAction === 'add' ? 'Purchased Stock Quantity (Kg) *' : 'Deduction Quantity (Kg) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="0.1"
                      placeholder="e.g. 50"
                      value={modalKgValue}
                      onChange={(e) => setModalKgValue(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-extrabold text-indigo-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Notes</label>
                    <input
                      type="text"
                      placeholder={stockModalAction === 'add' ? 'Invoice # / Shipment note' : 'Damaged roll / Waste'}
                      value={modalReasonNotes}
                      onChange={(e) => setModalReasonNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Single Wadding (Kg)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={modalSingleSpec}
                        onChange={(e) => setModalSingleSpec(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Double Wadding (Kg)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={modalDoubleSpec}
                        onChange={(e) => setModalDoubleSpec(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">Gadda Wadding (Kg)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={modalGaddaSpec}
                        onChange={(e) => setModalGaddaSpec(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-emerald-300 bg-emerald-50/50 rounded-lg text-xs font-extrabold text-emerald-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Single Fabric (Mtr)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={modalSingleFabric}
                        onChange={(e) => setModalSingleFabric(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Double Fabric (Mtr)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={modalDoubleFabric}
                        onChange={(e) => setModalDoubleFabric(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">Gadda Fabric (Mtr)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={modalGaddaFabric}
                        onChange={(e) => setModalGaddaFabric(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-emerald-300 bg-emerald-50/50 rounded-lg text-xs font-extrabold text-emerald-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Wadding Cost ({currencySymbol}/Kg)</label>
                      <input
                        type="number"
                        value={modalWaddingRate}
                        onChange={(e) => setModalWaddingRate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Fabric Cost ({currencySymbol}/Mtr)</label>
                      <input
                        type="number"
                        value={modalFabricRate}
                        onChange={(e) => setModalFabricRate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-indigo-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        title="Delete Wadding Variety"
        message={`Are you sure you want to delete ${itemToDelete?.type} (${itemToDelete?.gsm} GSM)?`}
        confirmText="Delete Wadding Variety"
        onConfirm={handleConfirmDeleteItem}
        onClose={() => setItemToDelete(null)}
      />

      {/* Clear All Stock Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmClearAllOpen}
        title="Clear All Wadding Stock"
        message="Are you sure you want to clear all wadding varieties and stock logs?"
        confirmText="Yes, Clear All Stock"
        onConfirm={handleConfirmClearAll}
        onClose={() => setIsConfirmClearAllOpen(false)}
      />

      {/* Record / Edit Incoming Fabric Modal */}
      {isFabricModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 relative animate-in fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsFabricModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                {editingFabricLotId ? 'Edit Incoming Fabric Lot' : 'Record New Incoming Fabric Arrival'}
              </h3>
            </div>

            <form onSubmit={handleSaveFabricLot} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lot / Challan # *</label>
                  <input
                    type="text"
                    required
                    value={inwardLotNumber}
                    onChange={(e) => setInwardLotNumber(e.target.value)}
                    placeholder="e.g. FAB-LOT-2026-X1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={inwardSupplierName}
                    onChange={(e) => setInwardSupplierName(e.target.value)}
                    placeholder="e.g. Sunrise Weaving Mills"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date *</label>
                  <input
                    type="date"
                    required
                    value={inwardDateReceived}
                    onChange={(e) => setInwardDateReceived(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Designs List */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Fabric Roll Designs & Meterage
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddDesignRow}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Design</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {inwardDesigns.map((design, index) => (
                    <div key={design.id || index} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Design / Code</label>
                        <input
                          type="text"
                          placeholder="Code (DS-101)"
                          value={design.designNumber}
                          onChange={(e) => handleDesignChange(index, 'designNumber', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Design Name / Quality</label>
                        <input
                          type="text"
                          placeholder="Name (e.g. Premium Cotton)"
                          value={design.designName}
                          onChange={(e) => handleDesignChange(index, 'designName', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-emerald-700 mb-0.5">Fabric Total Meters</label>
                        <input
                          type="number"
                          placeholder="Total Mtr"
                          min="0"
                          value={design.totalMeters || ''}
                          onChange={(e) => handleDesignChange(index, 'totalMeters', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-emerald-400 rounded text-xs font-bold text-emerald-900 bg-emerald-50/60"
                        />
                      </div>
                      <div className="col-span-1 text-center pt-3">
                        {inwardDesigns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDesignRow(index)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Quality Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. 100% Cotton 300 Thread Count, Grade A Quality"
                  value={inwardNotes}
                  onChange={(e) => setInwardNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFabricModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Save Fabric Arrival Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Pay Modal for Wadding Supplier */}
      {quickPayWadding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Record Payment to Wadding Supplier</h3>
              </div>
              <button onClick={() => setQuickPayWadding(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPayWadding} className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Wadding Item / Lot:</span>
                  <span className="font-bold text-slate-900">
                    {quickPayWadding.type} ({quickPayWadding.lotNumber || 'N/A'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-semibold text-slate-800">{quickPayWadding.supplierName || 'Direct Supplier'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Purchase Cost:</span>
                  <span className="font-extrabold text-slate-900">
                    Rs.{' '}
                    {(
                      quickPayWadding.totalCost !== undefined
                        ? quickPayWadding.totalCost
                        : quickPayWadding.totalPurchasedKg * (quickPayWadding.ratePerKg || 350)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Amount Paid to Wadding Supplier (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={quickPayWaddingAmount}
                  onChange={(e) => setQuickPayWaddingAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-sm font-black text-emerald-950 bg-emerald-50/40 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Note / Bank Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #891 / Online Transfer"
                  value={quickPayWaddingNotes}
                  onChange={(e) => setQuickPayWaddingNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickPayWadding(null)}
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

      {/* Confirm Delete Fabric Lot Modal */}
      <ConfirmDeleteModal
        isOpen={!!fabricLotToDelete}
        title="Delete Fabric Lot"
        message={`Are you sure you want to delete fabric lot ${fabricLotToDelete?.lotNumber} (${fabricLotToDelete?.supplierName})?`}
        confirmText="Delete Fabric Lot"
        onConfirm={handleConfirmDeleteFabricLot}
        onClose={() => setFabricLotToDelete(null)}
      />
    </div>
  );
};

