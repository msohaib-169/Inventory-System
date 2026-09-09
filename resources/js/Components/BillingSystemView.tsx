import React, { useState } from 'react';
import { Invoice, InvoiceItem, FinishedProduct, Party, CurrencyOption, FabricLossRecord, FabricLot, PaymentTransaction } from '../types';
import { COMPANY_INFO, PDFGenerator } from '../lib/pdfGenerator';
import { ERPAPI } from '../lib/api';
import { PrintableBillModal } from './PrintableBillModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { matchesDesignSearch } from '../lib/designSearch';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Scissors,
  Package,
  Pencil,
} from 'lucide-react';

interface BillingSystemViewProps {
  invoices: Invoice[];
  products: FinishedProduct[];
  parties: Party[];
  currency: CurrencyOption;
  onSaveBillingData: (
    updatedInvoices: Invoice[],
    updatedProducts: FinishedProduct[],
    updatedParties: Party[],
    updatedPayments?: PaymentTransaction[]
  ) => void;
  payments?: PaymentTransaction[];
  fabricLosses?: FabricLossRecord[];
  onSaveFabricLosses?: (updatedLosses: FabricLossRecord[]) => void;
  lots?: FabricLot[];
  onNavigateTab?: (tab: string) => void;
}

export const BillingSystemView: React.FC<BillingSystemViewProps> = ({
  invoices,
  products,
  parties,
  currency,
  onSaveBillingData,
  payments = [],
  fabricLosses = [],
  onSaveFabricLosses,
  lots = [],
  onNavigateTab,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'Paid' | 'Partial' | 'Unpaid'>('all');

  // --- Detailed Modal Form State ---
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState(parties[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [items, setItems] = useState<
    {
      productId: string;
      productName?: string;
      designNumber?: string;
      isCustom?: boolean;
      quantity: number;
      unitPrice: number;
      itemType: 'product' | 'loose_fabric';
      fabricLossId?: string;
      lotNumber?: string;
      meters?: number;
      frontMeters?: number;
      reverseMeters?: number;
    }[]
  >([]);

  const [taxRatePercent, setTaxRatePercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('Delivered in good condition.');

  const currSym = currency.symbol;

  // Helper to find all unbilled loose fabric records for a party
  const getPartyLooseFabrics = (partyId: string) => {
    const targetParty = parties.find((p) => p.id === partyId);
    if (!targetParty) return [];

    const pName = (targetParty.name || '').trim().toLowerCase();
    const pCompany = (targetParty.companyName || '').trim().toLowerCase();

    return fabricLosses.filter((loss) => {
      if (loss.billed) return false;
      if (loss.partyId && loss.partyId === targetParty.id) return true;
      if (loss.partyName) {
        const lName = loss.partyName.trim().toLowerCase();
        if (lName === pName || (pCompany && lName === pCompany)) return true;
        if (pName && (lName.includes(pName) || pName.includes(lName))) return true;
      }
      return false;
    });
  };

  // Selected party object
  const currentParty = parties.find((p) => p.id === selectedPartyId) || parties[0];

  // Filtering Invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (paymentStatusFilter !== 'all' && inv.status !== paymentStatusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchInvNo = inv.invoiceNumber.toLowerCase().includes(q);
      const matchPartyName = inv.partyName.toLowerCase().includes(q);
      const matchPartyPhone = (inv.partyPhone || '').toLowerCase().includes(q);
      const matchItemName = inv.items.some((item) => item.productName.toLowerCase().includes(q));
      const matchDesign = inv.items.some((item) => matchesDesignSearch(item.designNumber, searchQuery));
      if (!matchInvNo && !matchPartyName && !matchPartyPhone && !matchItemName && !matchDesign) {
        return false;
      }
    }
    return true;
  });

  // ----------------------------------------------------
  // INVOICE MODAL HANDLERS
  // ----------------------------------------------------
  const handleOpenAddInvoice = (prefillPartyId?: string) => {
    setEditingInvoice(null);
    const newInvNum = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    setInvoiceNumber(newInvNum);
    const pId = prefillPartyId || parties[0]?.id || '';
    setSelectedPartyId(pId);
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Find party loose fabric records and AUTO-POPULATE them
    const partyLoose = getPartyLooseFabrics(pId);

    if (partyLoose.length > 0) {
      // Auto-load all loose fabric cuts belonging to this party
      const autoLooseRows = partyLoose.map((loss) => {
        const meters = loss.metersLost || (Number(loss.frontMeters || 0) + Number(loss.reverseMeters || 0)) || 1;
        const rate = loss.ratePerMeter || 150;
        return {
          productId: '',
          productName: `Loose Fabric Cut - Lot #${loss.lotNumber} (${loss.designName || loss.designNumber || 'Fabric Cut'})`,
          designNumber: loss.designNumber || 'Fabric Cut',
          isCustom: true,
          quantity: meters,
          unitPrice: rate,
          itemType: 'loose_fabric' as const,
          fabricLossId: loss.id,
          lotNumber: loss.lotNumber,
          meters: meters,
          frontMeters: loss.frontMeters,
          reverseMeters: loss.reverseMeters,
        };
      });
      setItems(autoLooseRows);
    } else {
      // If party has no loose fabric cuts, provide 1 default finished product
      const firstProduct = products[0];
      if (firstProduct) {
        setItems([
          {
            productId: firstProduct.id,
            productName: firstProduct.name,
            designNumber: firstProduct.designNumber,
            isCustom: false,
            quantity: 1,
            unitPrice: firstProduct.sellingPrice,
            itemType: 'product',
          },
        ]);
      } else {
        setItems([]);
      }
    }

    setTaxRatePercent(0);
    setDiscountAmount(0);
    setAmountPaid(0);
    setNotes('Delivered in good condition.');
    setIsModalOpen(true);
  };

  const handleOpenEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceNumber(invoice.invoiceNumber);
    setSelectedPartyId(invoice.partyId);
    setDate(invoice.date);
    setDueDate(invoice.dueDate);
    setItems(invoice.items.map((item) => ({
      productId: item.productId || '',
      productName: item.productName,
      designNumber: item.designNumber,
      isCustom: !item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      itemType: item.itemType === 'loose_fabric' ? 'loose_fabric' : 'product',
      fabricLossId: item.fabricLossId,
      lotNumber: item.lotNumber,
      meters: item.meters,
      frontMeters: item.frontMeters,
      reverseMeters: item.reverseMeters,
    })));
    setTaxRatePercent(invoice.taxRatePercent || 0);
    setDiscountAmount(invoice.discountAmount || 0);
    setAmountPaid(invoice.amountPaid || 0);
    setNotes(invoice.notes || '');
    setSelectedInvoiceForPrint(null);
    setIsModalOpen(true);
  };

  // When changing party in modal dropdown -> Auto-load party's loose fabrics
  const handlePartyChange = (newPartyId: string) => {
    setSelectedPartyId(newPartyId);
    const partyLoose = getPartyLooseFabrics(newPartyId);

    // Keep any already added catalog products, but replace loose fabrics with the newly selected party's loose cuts
    const existingProducts = items.filter((it) => it.itemType === 'product' && !it.fabricLossId);

    const newLooseRows = partyLoose.map((loss) => {
      const meters = loss.metersLost || (Number(loss.frontMeters || 0) + Number(loss.reverseMeters || 0)) || 1;
      const rate = loss.ratePerMeter || 150;
      return {
        productId: '',
        productName: `Loose Fabric Cut - Lot #${loss.lotNumber} (${loss.designName || loss.designNumber || 'Fabric Cut'})`,
        designNumber: loss.designNumber || 'Fabric Cut',
        isCustom: true,
        quantity: meters,
        unitPrice: rate,
        itemType: 'loose_fabric' as const,
        fabricLossId: loss.id,
        lotNumber: loss.lotNumber,
        meters: meters,
        frontMeters: loss.frontMeters,
        reverseMeters: loss.reverseMeters,
      };
    });

    if (newLooseRows.length > 0 || existingProducts.length > 0) {
      setItems([...newLooseRows, ...existingProducts]);
    } else {
      const firstProduct = products[0];
      if (firstProduct) {
        setItems([
          {
            productId: firstProduct.id,
            productName: firstProduct.name,
            designNumber: firstProduct.designNumber,
            isCustom: false,
            quantity: 1,
            unitPrice: firstProduct.sellingPrice,
            itemType: 'product',
          },
        ]);
      } else {
        setItems([]);
      }
    }
  };

  // Add a new finished product row from catalog or custom
  const handleAddProductRow = () => {
    const firstProduct = products && products.length > 0 ? products[0] : null;
    if (firstProduct) {
      setItems((prev) => [
        ...prev,
        {
          productId: firstProduct.id,
          productName: firstProduct.name,
          designNumber: firstProduct.designNumber,
          isCustom: false,
          quantity: 1,
          unitPrice: firstProduct.sellingPrice || 1000,
          itemType: 'product',
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: '',
          productName: 'Quilt Set / Finished Product',
          designNumber: 'Standard',
          isCustom: true,
          quantity: 1,
          unitPrice: 1500,
          itemType: 'product',
        },
      ]);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Product selection handler for catalog items
  const handleProductSelect = (index: number, selectedProductId: string) => {
    if (selectedProductId === '__custom__') {
      setItems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          return {
            ...item,
            productId: '',
            productName: item.productName || 'Quilt Set / Finished Product',
            designNumber: item.designNumber || '',
            unitPrice: item.unitPrice || 1000,
            quantity: item.quantity > 0 ? item.quantity : 1,
            isCustom: true,
            itemType: 'product',
          };
        })
      );
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (prod) {
      setItems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          return {
            ...item,
            productId: prod.id,
            productName: prod.name,
            designNumber: prod.designNumber,
            unitPrice: prod.sellingPrice,
            quantity: item.quantity > 0 ? item.quantity : 1,
            isCustom: false,
            itemType: 'product',
          };
        })
      );
    }
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, [field]: value };
      })
    );
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);

  const taxAmount = (subtotal * (Number(taxRatePercent) || 0)) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - (Number(discountAmount) || 0));
  const balanceDue = Math.max(0, grandTotal - (Number(amountPaid) || 0));

  let invoiceStatus: 'Unpaid' | 'Partially Paid' | 'Paid' = 'Unpaid';
  if (amountPaid >= grandTotal) {
    invoiceStatus = 'Paid';
  } else if (amountPaid > 0) {
    invoiceStatus = 'Partially Paid';
  }

  // Check product stock availability
  let stockSufficient = true;
  let stockErrorMessage = '';

  items.forEach((item) => {
    if (!item.isCustom && item.productId) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && prod.stockQuantity < item.quantity) {
        stockSufficient = false;
        stockErrorMessage = `Insufficient stock for "${prod.name}" (${prod.designNumber})! Requested: ${item.quantity} pcs, Available in Stock: ${prod.stockQuantity} pcs`;
      }
    }
  });

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParty || !items.length || !stockSufficient) return;

    const usedLossIds: string[] = [];

    // 1. Prepare Invoice Items
    const processedItems: InvoiceItem[] = items.map((item) => {
      const prod = !item.isCustom ? products.find((p) => p.id === item.productId) : undefined;
      const isLoose = item.itemType === 'loose_fabric' || item.fabricLossId;

      if (item.fabricLossId) {
        usedLossIds.push(item.fabricLossId);
      }

      return {
        id: `ii-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: prod?.id,
        productName: prod?.name || item.productName || 'Loose Fabric Cut',
        designNumber: prod?.designNumber || item.designNumber || '',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.quantity) * Number(item.unitPrice),
        itemType: isLoose ? 'loose_fabric' : 'product',
        fabricLossId: item.fabricLossId,
        lotNumber: item.lotNumber,
        meters: item.meters || (isLoose ? Number(item.quantity) : undefined),
        frontMeters: item.frontMeters,
        reverseMeters: item.reverseMeters,
      };
    });

    const oldInvoice = editingInvoice;

    // 2. Manage party entity update. In edit mode, reverse the old invoice first.
    let billPartyId = currentParty.id;
    let billPartyName = currentParty.name;
    let billPartyAddress = `${currentParty.address || ''}${currentParty.city ? `, ${currentParty.city}` : ''}`;
    let billPartyPhone = currentParty.phone;

    const updatedParties = parties.map((p) => {
      const oldPartyAdjustment = oldInvoice && p.id === oldInvoice.partyId
        ? { totalInvoiced: oldInvoice.grandTotal, totalPaid: oldInvoice.amountPaid, currentDues: oldInvoice.balanceDue }
        : { totalInvoiced: 0, totalPaid: 0, currentDues: 0 };
      if (p.id !== currentParty.id && !oldPartyAdjustment.totalInvoiced && !oldPartyAdjustment.totalPaid && !oldPartyAdjustment.currentDues) return p;
      return {
        ...p,
        totalInvoiced: p.totalInvoiced - oldPartyAdjustment.totalInvoiced + grandTotal,
        totalPaid: p.totalPaid - oldPartyAdjustment.totalPaid + Number(amountPaid),
        currentDues: p.currentDues - oldPartyAdjustment.currentDues + balanceDue,
      };
    });

    // 3. Create or update the invoice record.
    const newInvoice: Invoice = {
      id: oldInvoice?.id || `inv-${Date.now()}`,
      invoiceNumber,
      partyId: billPartyId,
      partyName: billPartyName,
      partyAddress: billPartyAddress,
      partyPhone: billPartyPhone,
      date,
      dueDate,
      items: processedItems,
      subtotal,
      taxRatePercent: Number(taxRatePercent),
      taxAmount,
      discountAmount: Number(discountAmount),
      grandTotal,
      amountPaid: Number(amountPaid),
      balanceDue,
      status: invoiceStatus,
      hasLooseFabric: usedLossIds.length > 0,
      totalLooseFabricMeters: processedItems
        .filter((it) => it.itemType === 'loose_fabric')
        .reduce((sum, it) => sum + (it.meters || it.quantity || 0), 0),
      notes,
      currencyCode: currency.code,
      currencySymbol: currency.symbol,
    };

    // 4. Restore the old stock in edit mode, then deduct the new quantities.
    const updatedProducts = products.map((prod) => {
      const oldQuantity = oldInvoice?.items.filter((item) => item.productId === prod.id).reduce((sum, item) => sum + item.quantity, 0) || 0;
      const newQuantity = items.filter((item) => !item.isCustom && item.productId === prod.id).reduce((sum, item) => sum + Number(item.quantity), 0);
      if (oldQuantity || newQuantity) {
        return {
          ...prod,
          stockQuantity: Math.max(0, prod.stockQuantity + oldQuantity - newQuantity),
        };
      }
      return prod;
    });

    // 5. Mark used loose fabric records as billed
    if (onSaveFabricLosses) {
      const updatedLosses = fabricLosses.map((l) =>
        oldInvoice?.items.some((item) => item.fabricLossId === l.id) && !usedLossIds.includes(l.id)
          ? { ...l, billed: false, invoiceId: undefined, invoiceNumber: undefined }
          : usedLossIds.includes(l.id)
          ? { ...l, billed: true, invoiceId: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber }
          : l
      );
      onSaveFabricLosses(updatedLosses);
    }

    // 6. Keep the invoice's initial payment transaction in sync.
    let updatedPayments = [...payments];
    const initialPaid = Number(amountPaid) || 0;
    const paymentReference = `INV-${newInvoice.invoiceNumber}`;
    const oldPaymentIndex = updatedPayments.findIndex((payment) => payment.referenceNo === paymentReference);
    if (initialPaid > 0 && oldPaymentIndex >= 0) {
      updatedPayments[oldPaymentIndex] = { ...updatedPayments[oldPaymentIndex], amount: initialPaid, date };
    } else if (initialPaid > 0) {
      const newPayRecord: PaymentTransaction = {
        id: `pay-${Date.now()}`,
        partyId: billPartyId,
        partyName: billPartyName,
        date: date,
        amount: initialPaid,
        paymentMethod: 'Bank Transfer',
        referenceNo: `INV-${newInvoice.invoiceNumber}`,
        notes: `Initial payment on Invoice #${newInvoice.invoiceNumber}`,
      };
      updatedPayments = [newPayRecord, ...payments];
    } else if (oldPaymentIndex >= 0) {
      updatedPayments.splice(oldPaymentIndex, 1);
    }

    const updatedInvoices = oldInvoice
      ? invoices.map((invoice) => (invoice.id === oldInvoice.id ? newInvoice : invoice))
      : [newInvoice, ...invoices];
    onSaveBillingData(updatedInvoices, updatedProducts, updatedParties, updatedPayments);
    if (oldInvoice && /^\d+$/.test(oldInvoice.id)) {
      ERPAPI.updateInvoice(oldInvoice.id, newInvoice).catch(() => { });
    }
    setIsModalOpen(false);
    setEditingInvoice(null);

    // Open Printable Bill Modal immediately for printing
    setSelectedInvoiceForPrint(newInvoice);
  };

  const handleDeleteInvoice = (inv: Invoice) => {
    setInvoiceToDelete(inv);
  };

  const handleConfirmDeleteInvoice = () => {
    if (invoiceToDelete) {
      const updated = invoices.filter((i) => i.id !== invoiceToDelete.id);
      onSaveBillingData(updated, products, parties);
      setInvoiceToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Total Invoices Issued</span>
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black">
            {invoices.length} <span className="text-sm font-medium text-slate-300">Invoices</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Generated customer billing records</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Invoiced</span>
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {currSym} {invoices.reduce((s, i) => s + i.grandTotal, 0).toLocaleString()}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Gross sales billed in {currency.code}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Uncollected Invoice Dues</span>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          </div>
          <h2 className="text-2xl font-bold text-amber-700">
            {currSym} {invoices.reduce((s, i) => s + i.balanceDue, 0).toLocaleString()}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Pending unpaid balances ({currency.code})</p>
        </div>
      </div>

      {/* Action Header & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Customer Invoices & Billing System</h2>
            <p className="text-xs text-slate-500">
              Create bills with auto-loaded party loose fabric cuts & in-stock products in {currency.code} ({currSym})
            </p>
          </div>
          <button
            onClick={() => handleOpenAddInvoice()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice & Print Bill</span>
          </button>
        </div>

        {/* Live Search and Status Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-slate-100 pt-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoices by INV#, customer name, phone number, product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Payment Status:
            </span>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as 'all' | 'Paid' | 'Partial' | 'Unpaid')}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Invoices ({invoices.length})</option>
              <option value="Paid">✅ Fully Paid</option>
              <option value="Partial">🟡 Partial Payment</option>
              <option value="Unpaid">🔴 Unpaid / Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer / Party</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Items & Type</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right text-emerald-700">Paid</th>
                <th className="py-3 px-4 text-right text-amber-700">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Print / PDF Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    No matching billing invoices found. Click <strong>"Create Invoice & Print Bill"</strong> to issue a new bill.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const invSym = inv.currencySymbol || currSym;
                  const hasLoose =
                    inv.hasLooseFabric ||
                    inv.items.some(
                      (it) =>
                        it.itemType === 'loose_fabric' ||
                        it.fabricLossId ||
                        it.productName.toLowerCase().includes('loose fabric')
                    );

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-indigo-700">
                        <div className="flex items-center space-x-1.5">
                          <span>{inv.invoiceNumber}</span>
                          {hasLoose && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 font-extrabold rounded border border-amber-300">
                              Loose Fabric
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{inv.partyName}</p>
                        <span className="text-[10px] text-slate-400">{inv.partyPhone}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{inv.date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800">{inv.items.length} items</span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {invSym} {inv.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {invSym} {inv.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">
                        {invSym} {inv.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedInvoiceForPrint(inv)}
                            title="Print Bill Slip"
                            className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[11px] transition shadow cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Bill</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditInvoice(inv)}
                            title="Edit Invoice"
                            className="p-1 text-indigo-500 hover:text-indigo-700 rounded bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              PDFGenerator.generateInvoicePDF(inv, COMPANY_INFO);
                            }}
                            title="Download PDF"
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(inv)}
                            title="Delete Invoice"
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition cursor-pointer"
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

      {/* ========================================================================= */}
      {/* 🧾 CREATE INVOICE & PRINT BILL MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>{editingInvoice ? 'Edit Invoice & Print Bill' : 'Create Invoice & Print Bill'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {editingInvoice ? 'Update invoice details and save the revised bill.' : `Party loose fabric cuts auto-load directly for ${currentParty?.name || 'Party'} (${currency.code})`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-200">
                  {invoiceNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4">
              {/* Customer & Invoice Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Party / Customer *
                    </label>
                    <select
                      value={selectedPartyId}
                      onChange={(e) => handlePartyChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
                    >
                      {parties.map((p) => {
                        const looseCount = getPartyLooseFabrics(p.id).length;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.companyName || p.city}) {looseCount > 0 ? `✂️ [${looseCount} Loose Cuts]` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Due Date</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Items & Quantities */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Invoice Items</h4>
                    <p className="text-[11px] text-slate-500">
                      Party loose fabric cuts appear automatically. Click "+ Add Product" to include finished products.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProductRow}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Product</span>
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No items in this invoice. Click <strong>"+ Add Product"</strong> to add finished items.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {items.map((item, index) => {
                      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                      const isLoose = item.itemType === 'loose_fabric' || !!item.fabricLossId;
                      const prodObj = !isLoose && item.productId ? products.find((p) => p.id === item.productId) : undefined;

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-xl border text-xs transition ${
                            isLoose
                              ? 'bg-amber-50/80 border-amber-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="grid grid-cols-12 gap-3 items-center">
                            {/* Product Item Column */}
                            <div className="col-span-12 sm:col-span-6">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                                  <span>{isLoose ? 'Party Loose Fabric Cut' : 'Select Finished Product'}</span>
                                  {isLoose && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded font-bold">
                                      ✂️ Auto-Loaded Party Cut
                                    </span>
                                  )}
                                </label>
                              </div>

                              {isLoose ? (
                                <div className="p-2 bg-amber-100/70 border border-amber-300 rounded-lg">
                                  <p className="font-bold text-amber-950 text-xs flex items-center space-x-1.5">
                                    <Scissors className="w-3.5 h-3.5 text-amber-700" />
                                    <span>{item.productName}</span>
                                  </p>
                                  <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                                    Lot #{item.lotNumber} | Design: {item.designNumber}
                                    {item.frontMeters !== undefined || item.reverseMeters !== undefined
                                      ? ` (${item.frontMeters || 0}m Front, ${item.reverseMeters || 0}m Rev)`
                                      : ''}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {products.length > 0 && (
                                    <select
                                      value={item.isCustom ? '__custom__' : item.productId}
                                      onChange={(e) => handleProductSelect(index, e.target.value)}
                                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
                                    >
                                      {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          📦 {p.name} ({p.designNumber}) — In Stock: {p.stockQuantity} pcs — {currSym} {p.sellingPrice.toLocaleString()}
                                        </option>
                                      ))}
                                      <option value="__custom__">✏️ + Custom / Other Product Item...</option>
                                    </select>
                                  )}

                                  {(item.isCustom || !item.productId || products.length === 0) && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        placeholder="Product / Item Name (e.g. Quilt Set)"
                                        value={item.productName || ''}
                                        onChange={(e) => handleItemFieldChange(index, 'productName', e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Design / Size (e.g. DS-101 / King)"
                                        value={item.designNumber || ''}
                                        onChange={(e) => handleItemFieldChange(index, 'designNumber', e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white"
                                      />
                                    </div>
                                  )}

                                  {prodObj && !item.isCustom && (
                                    <div className="mt-1 flex items-center justify-between text-[10px]">
                                      <span
                                        className={`font-semibold ${
                                          prodObj.stockQuantity < item.quantity ? 'text-red-600 font-bold' : 'text-emerald-700'
                                        }`}
                                      >
                                        Available in Stock: <strong>{prodObj.stockQuantity} pcs</strong>
                                      </span>
                                      <span className="text-slate-400">Default Price: {currSym} {prodObj.sellingPrice}/pc</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Quantity / Meters Input */}
                            <div className="col-span-6 sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                {isLoose ? 'Meters' : 'Qty (Pcs)'}
                              </label>
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => handleItemFieldChange(index, 'quantity', Number(e.target.value))}
                                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                              />
                            </div>

                            {/* Unit Price Input */}
                            <div className="col-span-6 sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Unit Price ({currSym})
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handleItemFieldChange(index, 'unitPrice', Number(e.target.value))}
                                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                              />
                            </div>

                            {/* Subtotal & Delete Action */}
                            <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end sm:space-x-3 pt-1 sm:pt-0">
                              <div className="text-left sm:text-right">
                                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Subtotal</span>
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {currSym} {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(index)}
                                className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer transition"
                                title="Remove Line Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!stockSufficient && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <span>{stockErrorMessage}</span>
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Discount Amount ({currSym})</label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount || ''}
                      placeholder="0"
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Amount Paid Now ({currSym}) <span className="text-[10px] text-emerald-600">(Received Cash/Bank)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={amountPaid || ''}
                      placeholder="0 (Unpaid / Full Credit)"
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-emerald-400 bg-white rounded-lg text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Invoice Notes / Terms</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Gross Subtotal:</span>
                      <span>
                        {currSym} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Discount:</span>
                        <span>
                          -{currSym} {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-base text-white pt-2 border-t border-slate-800">
                      <span>Grand Total:</span>
                      <span className="text-indigo-400">
                        {currSym} {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-400 pt-1">
                      <span>Paid Amount:</span>
                      <span className="font-bold">
                        {currSym} {Number(amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-300 pt-1 border-t border-slate-800">
                      <span>Remaining Balance Due:</span>
                      <span className="font-black text-sm">
                        {currSym} {balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span
                      className={`block text-center py-1 rounded text-[11px] font-extrabold ${
                        invoiceStatus === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : invoiceStatus === 'Partially Paid'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      Status: {invoiceStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!stockSufficient || items.length === 0}
                  className={`px-5 py-2.5 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition ${
                    stockSufficient && items.length > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {editingInvoice ? 'Update & Print Bill Slip' : 'Confirm & Print Bill Slip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!invoiceToDelete}
        title="Delete Customer Invoice"
        itemName={
          invoiceToDelete ? `Invoice #${invoiceToDelete.invoiceNumber} (${invoiceToDelete.partyName})` : undefined
        }
        message="Are you sure you want to delete this invoice record from your billing database?"
        onConfirm={handleConfirmDeleteInvoice}
        onClose={() => setInvoiceToDelete(null)}
      />

      {/* Printable Bill Slip Modal */}
      {selectedInvoiceForPrint && (
        <PrintableBillModal
          invoice={selectedInvoiceForPrint}
          currency={currency}
          onEdit={() => handleOpenEditInvoice(selectedInvoiceForPrint)}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};
