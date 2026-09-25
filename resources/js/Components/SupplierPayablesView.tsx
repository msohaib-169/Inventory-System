// @ts-nocheck
import React, { useState } from 'react';
import {
  SupplierProfile,
  SupplierBill,
  SupplierPayment,
  SupplierCategory,
  FabricLot,
  WaddingStock,
  RawMaterialStockItem,
  CurrencyOption,
} from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  CreditCard,
  Plus,
  DollarSign,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  X,
  Printer,
  Calendar,
  Layers,
  Boxes,
  Scale,
  Building2,
  ArrowDownRight,
  TrendingDown,
  Receipt,
  Download,
} from 'lucide-react';
import { getDesignTotalMeters } from '@/lib/storage';

interface SupplierPayablesViewProps {
  suppliers: SupplierProfile[];
  supplierBills: SupplierBill[];
  supplierPayments: SupplierPayment[];
  lots: FabricLot[];
  wadding: WaddingStock;
  rawMaterials: RawMaterialStockItem[];
  currency: CurrencyOption;
  onSaveSupplierData: (
    updatedSuppliers: SupplierProfile[],
    updatedBills: SupplierBill[],
    updatedPayments: SupplierPayment[],
    updatedLots?: FabricLot[],
    updatedWadding?: WaddingStock,
    updatedRawMaterials?: RawMaterialStockItem[]
  ) => void;
}

export const SupplierPayablesView: React.FC<SupplierPayablesViewProps> = ({
  suppliers,
  supplierBills,
  supplierPayments,
  lots,
  wadding,
  rawMaterials,
  currency,
  onSaveSupplierData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'suppliers' | 'bills' | 'payments'>('suppliers');

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierProfile | null>(null);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<SupplierBill | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<string>('');
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<string>('');

  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState<SupplierProfile | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'has_dues' | 'paid' | 'partial'>('all');

  const currSym = currency.symbol;

  // Supplier Form State
  const [supplierName, setSupplierName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('+92 ');
  const [city, setCity] = useState('Faisalabad');
  const [address, setAddress] = useState('');
  const [supplierCat, setSupplierCat] = useState<SupplierCategory>('fabric');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Bill Form State
  const [billSupplierName, setBillSupplierName] = useState('');
  const [billSupplierAddress, setBillSupplierAddress] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billDueDate, setBillDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [billCategory, setBillCategory] = useState<SupplierCategory>('fabric');
  const [billItemDesc, setBillItemDesc] = useState('');
  const [billQty, setBillQty] = useState<number>(0);
  const [billUnit, setBillUnit] = useState('pcs');
  const [billRate, setBillRate] = useState<number>(0);
  const [billTotalAmount, setBillTotalAmount] = useState<number>(0);
  const [billAmountPaid, setBillAmountPaid] = useState<number>(0);
  const [billNotes, setBillNotes] = useState('');

  // Payment Form State (Zero default)
  const [paymentSupplierAddress, setPaymentSupplierAddress] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'Online/UPI'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Auto calculate dynamic totals
  const totalBillsAmount = supplierBills.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
  const totalPaidAmount = supplierBills.reduce((s, b) => s + (Number(b.amountPaid) || 0), 0);
  const totalDuesPayable = supplierBills.reduce((s, b) => s + (Number(b.balanceDue) || 0), 0);

  const suppliersWithDuesCount = suppliers.filter((sup) => {
    const supBills = supplierBills.filter((b) => b.supplierName.toLowerCase() === sup.name.toLowerCase());
    const due = supBills.reduce((s, b) => s + (Number(b.balanceDue) || 0), 0);
    return due > 0;
  }).length;

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter((sup) => {
    // Category filter
    if (categoryFilter !== 'all' && sup.category !== categoryFilter) {
      return false;
    }

    // Calculate supplier specific total dues from bills
    const supBills = supplierBills.filter((b) => b.supplierName.toLowerCase() === sup.name.toLowerCase());
    const supTotalDue = supBills.reduce((s, b) => s + (Number(b.balanceDue) || 0), 0);

    // Status filter
    if (statusFilter === 'has_dues' && supTotalDue <= 0) return false;
    if (statusFilter === 'paid' && supTotalDue > 0) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = sup.name.toLowerCase().includes(q);
      const matchCompany = (sup.companyName || '').toLowerCase().includes(q);
      const matchPhone = (sup.phone || '').toLowerCase().includes(q);
      const matchCity = (sup.city || '').toLowerCase().includes(q);
      const matchCat = sup.category.toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchPhone && !matchCity && !matchCat) {
        return false;
      }
    }
    return true;
  });

  // Filtered Bills
  const filteredBills = supplierBills.filter((bill) => {
    // Category filter
    if (categoryFilter !== 'all' && bill.category !== categoryFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === 'has_dues' && (bill.balanceDue || 0) <= 0) return false;
    if (statusFilter === 'paid' && (bill.balanceDue || 0) > 0) return false;
    if (statusFilter === 'partial' && bill.paymentStatus !== 'Partial') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSup = bill.supplierName.toLowerCase().includes(q);
      const matchBillNo = bill.billNumber.toLowerCase().includes(q);
      const matchDesc = bill.itemDescription.toLowerCase().includes(q);
      const matchDate = bill.date.includes(q);
      const matchNotes = (bill.paymentNotes || '').toLowerCase().includes(q);
      if (!matchSup && !matchBillNo && !matchDesc && !matchDate && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  // Filtered Payments
  const filteredPayments = supplierPayments.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSup = p.supplierName.toLowerCase().includes(q);
      const matchBillNo = (p.billNumber || '').toLowerCase().includes(q);
      const matchRef = (p.referenceNo || '').toLowerCase().includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      const matchMethod = p.paymentMethod.toLowerCase().includes(q);
      if (!matchSup && !matchBillNo && !matchRef && !matchNotes && !matchMethod) {
        return false;
      }
    }
    return true;
  });

  // Category Badge Helper
  const getCategoryBadge = (cat: SupplierCategory) => {
    switch (cat) {
      case 'fabric':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-800 rounded-md">Fabric Mills</span>;
      case 'wadding':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-100 text-cyan-800 rounded-md">Wadding / Fiber</span>;
      case 'packaging_bags':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-md">Bags & Packaging</span>;
      case 'stiffener_labels':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-100 text-purple-800 rounded-md">Stiffeners & Labels</span>;
      case 'zipper_buttons':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">Zippers & Buttons</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-800 rounded-md">General Vendor</span>;
    }
  };

  // Supplier CRUD
  const handleOpenAddSupplier = () => {
    setEditingSupplierId(null);
    setSupplierName('');
    setCompanyName('');
    setPhone('+92 ');
    setCity('Faisalabad');
    setAddress('');
    setSupplierCat('fabric');
    setSupplierNotes('');
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup: SupplierProfile) => {
    setEditingSupplierId(sup.id);
    setSupplierName(sup.name);
    setCompanyName(sup.companyName || sup.name);
    setPhone(sup.phone || '+92 ');
    setCity(sup.city || 'Faisalabad');
    setAddress(sup.address || '');
    setSupplierCat(sup.category);
    setSupplierNotes(sup.notes || '');
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;

    if (editingSupplierId) {
      const updated = suppliers.map((s) =>
        s.id === editingSupplierId
          ? {
            ...s,
            name: supplierName,
            companyName: companyName || supplierName,
            phone,
            city,
            address,
            category: supplierCat,
            notes: supplierNotes,
          }
          : s
      );
      onSaveSupplierData(updated, supplierBills, supplierPayments, lots, wadding, rawMaterials);
    } else {
      const newSup: SupplierProfile = {
        id: `sup-${Date.now()}`,
        name: supplierName,
        companyName: companyName || supplierName,
        phone,
        city,
        address,
        category: supplierCat,
        totalPurchases: 0,
        totalPaid: 0,
        currentDues: 0,
        notes: supplierNotes,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onSaveSupplierData([newSup, ...suppliers], supplierBills, supplierPayments, lots, wadding, rawMaterials);
    }

    setIsSupplierModalOpen(false);
  };

  const handleConfirmDeleteSupplier = () => {
    if (supplierToDelete) {
      const updated = suppliers.filter((s) => s.id !== supplierToDelete.id);
      onSaveSupplierData(updated, supplierBills, supplierPayments, lots, wadding, rawMaterials);
      setSupplierToDelete(null);
    }
  };

  // Bill CRUD
  const handleOpenAddBill = (presetSupName?: string) => {
    const defaultSup = presetSupName || suppliers[0]?.name || 'Sunrise Textile Mills';
    const foundSup = suppliers.find((s) => s.name.toLowerCase() === defaultSup.toLowerCase());

    setBillSupplierName(defaultSup);
    setBillSupplierAddress(foundSup?.address || '');
    setBillCategory(foundSup?.category || 'fabric');
    setBillNumber(`BILL-2026-${Math.floor(100 + Math.random() * 900)}`);
    setBillDate(new Date().toISOString().split('T')[0]);
    setBillDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setBillItemDesc('');
    setBillQty(0);
    setBillUnit('pcs');
    setBillRate(0);
    setBillTotalAmount(0);
    setBillAmountPaid(0);
    setBillNotes('');
    setIsBillModalOpen(true);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billSupplierName.trim() || !billNumber.trim() || billTotalAmount <= 0) return;

    const totalAmt = Number(billTotalAmount) || 0;
    const paidAmt = Number(billAmountPaid) || 0;
    const balance = Math.max(0, totalAmt - paidAmt);
    let status: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (balance === 0) status = 'Paid';
    else if (paidAmt > 0) status = 'Partial';

    const newBill: SupplierBill = {
      id: `sb-${Date.now()}`,
      supplierName: billSupplierName,
      supplierAddress: billSupplierAddress.trim() || undefined,
      category: billCategory,
      billNumber,
      date: billDate,
      dueDate: billDueDate,
      itemDescription: billItemDesc || `${billQty} ${billUnit} Raw Material Purchase`,
      quantity: Number(billQty),
      unit: billUnit,
      ratePerUnit: Number(billRate),
      totalAmount: totalAmt,
      amountPaid: paidAmt,
      balanceDue: balance,
      paymentStatus: status,
      paymentNotes: billNotes,
      sourceType: 'manual_bill',
    };

    let updatedPayments = [...supplierPayments];
    if (paidAmt > 0) {
      const paymentRec: SupplierPayment = {
        id: `spay-${Date.now()}`,
        supplierName: billSupplierName,
        supplierAddress: billSupplierAddress.trim() || undefined,
        billId: newBill.id,
        billNumber: newBill.billNumber,
        date: billDate,
        amount: paidAmt,
        paymentMethod: 'Bank Transfer',
        referenceNo: `INIT-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: `Initial payment recorded on bill creation (${billNumber})`,
      };
      updatedPayments = [paymentRec, ...supplierPayments];
    }

    // Ensure supplier exists in profiles
    let updatedSuppliers = [...suppliers];
    const supIndex = updatedSuppliers.findIndex((s) => s.name.toLowerCase() === billSupplierName.toLowerCase());
    if (supIndex >= 0) {
      updatedSuppliers[supIndex] = {
        ...updatedSuppliers[supIndex],
        totalPurchases: (updatedSuppliers[supIndex].totalPurchases || 0) + totalAmt,
        totalPaid: (updatedSuppliers[supIndex].totalPaid || 0) + paidAmt,
        currentDues: Math.max(0, (updatedSuppliers[supIndex].currentDues || 0) + balance),
      };
    } else {
      updatedSuppliers.unshift({
        id: `sup-${Date.now()}`,
        name: billSupplierName,
        companyName: billSupplierName,
        category: billCategory,
        totalPurchases: totalAmt,
        totalPaid: paidAmt,
        currentDues: balance,
        createdAt: billDate,
      });
    }

    onSaveSupplierData(
      updatedSuppliers,
      [newBill, ...supplierBills],
      updatedPayments,
      lots,
      wadding,
      rawMaterials
    );

    setIsBillModalOpen(false);
  };

  const handleConfirmDeleteBill = () => {
    if (billToDelete) {
      const updatedBills = supplierBills.filter((b) => b.id !== billToDelete.id);
      onSaveSupplierData(suppliers, updatedBills, supplierPayments, lots, wadding, rawMaterials);
      setBillToDelete(null);
    }
  };

  // Payment Recording
  const handleOpenPaymentModal = (supName?: string, billId?: string) => {
    const defaultSup = supName || suppliers[0]?.name || '';
    const foundSup = suppliers.find((s) => s.name.toLowerCase() === defaultSup.toLowerCase());
    setSelectedSupplierForPayment(defaultSup);
    setPaymentSupplierAddress(foundSup?.address || '');
    setSelectedBillForPayment(billId || '');

    // Auto-calculate suggested payment amount
    if (billId) {
      const targetBill = supplierBills.find((b) => b.id === billId);
      setPaymentAmount(targetBill ? targetBill.balanceDue : 0);
    } else {
      const supBills = supplierBills.filter((b) => b.supplierName.toLowerCase() === defaultSup.toLowerCase());
      const totalDue = supBills.reduce((s, b) => s + (b.balanceDue || 0), 0);
      setPaymentAmount(totalDue > 0 ? totalDue : 0);
    }

    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Bank Transfer');
    setPaymentRef(`REC-${Math.floor(1000 + Math.random() * 9000)}`);
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = Number(paymentAmount);
    if (!selectedSupplierForPayment || payAmt <= 0) return;

    let updatedBills = [...supplierBills];
    let updatedLots = lots ? [...lots] : [];
    let updatedWadding = wadding ? { ...wadding } : undefined;
    let remainingPayment = payAmt;

    // If specific bill selected
    if (selectedBillForPayment) {
      updatedBills = updatedBills.map((bill) => {
        if (bill.id !== selectedBillForPayment) return bill;
        const newPaid = (bill.amountPaid || 0) + payAmt;
        const newBal = Math.max(0, bill.totalAmount - newPaid);
        const newStatus = newBal === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
        return {
          ...bill,
          amountPaid: newPaid,
          balanceDue: newBal,
          paymentStatus: newStatus,
          paymentNotes: paymentNotes
            ? `${bill.paymentNotes || ''} | Paid ${payAmt} on ${paymentDate} (${paymentMethod} ${paymentRef})`.trim()
            : bill.paymentNotes,
        };
      });

      // Synchronize with source Fabric Lot, Wadding Item, or Raw Material if applicable
      const targetBill = supplierBills.find((b) => b.id === selectedBillForPayment);
      if (targetBill?.sourceType === 'fabric_lot' && targetBill.sourceId && updatedLots) {
        updatedLots = updatedLots.map((lot) => {
          if (lot.id !== targetBill.sourceId && lot.lotNumber !== targetBill.billNumber) return lot;
          const newPaid = (lot.amountPaid || 0) + payAmt;
          const lotCost = lot.totalCost !== undefined ? lot.totalCost : (lot.ratePerMeter ? lot.designs.reduce((acc, d) => acc + getDesignTotalMeters(d), 0) * lot.ratePerMeter : 0);
          const newStatus = lotCost > 0 && newPaid >= lotCost ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
          return {
            ...lot,
            amountPaid: newPaid,
            paymentStatus: newStatus,
            paymentNotes: paymentNotes
              ? `${lot.paymentNotes || ''} | Paid ${payAmt} on ${paymentDate}`.trim()
              : lot.paymentNotes,
          };
        });
      } else if (
        (targetBill?.sourceType === 'wadding_item' || targetBill?.id.startsWith('bill-wad-')) &&
        updatedWadding &&
        updatedWadding.items
      ) {
        const wId = targetBill.sourceId || targetBill.id.replace('bill-wad-', '');
        updatedWadding = {
          ...updatedWadding,
          items: updatedWadding.items.map((item) => {
            if (item.id !== wId && item.lotNumber !== targetBill.billNumber) return item;
            const newPaid = (item.amountPaid || 0) + payAmt;
            const totalCost = item.totalCost !== undefined ? item.totalCost : (item.ratePerKg ? item.totalPurchasedKg * item.ratePerKg : 0);
            const newStatus = totalCost > 0 && newPaid >= totalCost ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
            return {
              ...item,
              amountPaid: newPaid,
              paymentStatus: newStatus,
              paymentNotes: paymentNotes
                ? `${item.paymentNotes || ''} | Paid ${payAmt} on ${paymentDate}`.trim()
                : item.paymentNotes,
            };
          }),
        };
      } else if (
        (targetBill?.sourceType === 'raw_material' || targetBill?.id.startsWith('bill-rm-')) &&
        rawMaterials
      ) {
        const rmId = targetBill.sourceId || targetBill.id.replace('bill-rm-', '');
        rawMaterials = rawMaterials.map((rm) => {
          if (rm.id !== rmId && rm.lotNumber !== targetBill.billNumber) return rm;
          const newPaid = (rm.amountPaid || 0) + payAmt;
          const totalCost = rm.totalCost !== undefined ? rm.totalCost : (rm.costPerUnit ? (rm.totalPurchasedQty || rm.quantityInStock) * rm.costPerUnit : 0);
          const newStatus = totalCost > 0 && newPaid >= totalCost ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
          return {
            ...rm,
            amountPaid: newPaid,
            paymentStatus: newStatus,
            paymentNotes: paymentNotes
              ? `${rm.paymentNotes || ''} | Paid ${payAmt} on ${paymentDate}`.trim()
              : rm.paymentNotes,
          };
        });
      }
    } else {
      // Apply payment FIFO to supplier bills with pending dues
      const lotDeductions = new Map<string, number>();
      const waddingDeductions = new Map<string, number>();
      const rmDeductions = new Map<string, number>();

      updatedBills = updatedBills.map((bill) => {
        if (bill.supplierName.toLowerCase() !== selectedSupplierForPayment.toLowerCase() || bill.balanceDue <= 0 || remainingPayment <= 0) {
          return bill;
        }
        const payToBill = Math.min(bill.balanceDue, remainingPayment);
        remainingPayment -= payToBill;
        const newPaid = (bill.amountPaid || 0) + payToBill;
        const newBal = Math.max(0, bill.totalAmount - newPaid);
        const newStatus = newBal === 0 ? 'Paid' : 'Partial';

        if (bill.sourceType === 'fabric_lot' && bill.sourceId) {
          lotDeductions.set(bill.sourceId, (lotDeductions.get(bill.sourceId) || 0) + payToBill);
        } else if (bill.sourceType === 'wadding_item' && bill.sourceId) {
          waddingDeductions.set(bill.sourceId, (waddingDeductions.get(bill.sourceId) || 0) + payToBill);
        } else if (bill.sourceType === 'raw_material' && bill.sourceId) {
          rmDeductions.set(bill.sourceId, (rmDeductions.get(bill.sourceId) || 0) + payToBill);
        }

        return {
          ...bill,
          amountPaid: newPaid,
          balanceDue: newBal,
          paymentStatus: newStatus,
        };
      });

      if (lotDeductions.size > 0 && updatedLots) {
        updatedLots = updatedLots.map((lot) => {
          const addPaid = lotDeductions.get(lot.id);
          if (!addPaid) return lot;
          const newPaid = (lot.amountPaid || 0) + addPaid;
          const lotCost = lot.totalCost !== undefined ? lot.totalCost : (lot.ratePerMeter ? lot.designs.reduce((acc, d) => acc + getDesignTotalMeters(d), 0) * lot.ratePerMeter : 0);
          const newStatus = lotCost > 0 && newPaid >= lotCost ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
          return {
            ...lot,
            amountPaid: newPaid,
            paymentStatus: newStatus,
          };
        });
      }

      if (waddingDeductions.size > 0 && updatedWadding && updatedWadding.items) {
        updatedWadding = {
          ...updatedWadding,
          items: updatedWadding.items.map((item) => {
            const addPaid = waddingDeductions.get(item.id);
            if (!addPaid) return item;
            const newPaid = (item.amountPaid || 0) + addPaid;
            const totalCost = item.totalCost !== undefined ? item.totalCost : (item.ratePerKg ? item.totalPurchasedKg * item.ratePerKg : 0);
            const newStatus = totalCost > 0 && newPaid >= totalCost ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
            return {
              ...item,
              amountPaid: newPaid,
              paymentStatus: newStatus,
            };
          }),
        };
      }

      if (rmDeductions.size > 0 && rawMaterials) {
        rawMaterials = rawMaterials.map((rm) => {
          const addPaid = rmDeductions.get(rm.id);
          if (!addPaid) return rm;
          const newPaid = (rm.amountPaid || 0) + addPaid;
          const totalCost = rm.totalCost !== undefined ? rm.totalCost : (rm.costPerUnit ? (rm.totalPurchasedQty || rm.quantityInStock) * rm.costPerUnit : 0);
          const newStatus = totalCost > 0 && newPaid >= totalCost ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
          return {
            ...rm,
            amountPaid: newPaid,
            paymentStatus: newStatus,
          };
        });
      }
    }

    const newPaymentRecord: SupplierPayment = {
      id: `spay-${Date.now()}`,
      supplierName: selectedSupplierForPayment,
      supplierAddress: paymentSupplierAddress.trim() || undefined,
      billId: selectedBillForPayment || undefined,
      billNumber: selectedBillForPayment ? supplierBills.find((b) => b.id === selectedBillForPayment)?.billNumber : undefined,
      date: paymentDate,
      amount: payAmt,
      paymentMethod,
      referenceNo: paymentRef,
      notes: paymentNotes || `Supplier payment cleared via ${paymentMethod}`,
    };

    // Update supplier profile totals
    const updatedSuppliers = suppliers.map((sup) => {
      if (sup.name.toLowerCase() !== selectedSupplierForPayment.toLowerCase()) return sup;
      const newPaid = (sup.totalPaid || 0) + payAmt;
      const newDues = Math.max(0, (sup.currentDues || 0) - payAmt);
      return {
        ...sup,
        address: paymentSupplierAddress.trim() || sup.address,
        totalPaid: newPaid,
        currentDues: newDues,
      };
    });

    onSaveSupplierData(
      updatedSuppliers,
      updatedBills,
      [newPaymentRecord, ...supplierPayments],
      updatedLots,
      updatedWadding,
      rawMaterials
    );

    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900">
                Supplier Dues & Accounts Payable Ledger
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded-full">
                Accounts Payable Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Centralized accounts payable ledger for Fabric Mills, Wadding Suppliers, Quilt & Bag Vendors, Stiffeners, Labels, Zippers & Accessories.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={() => handleOpenAddBill()}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Supplier Bill</span>
          </button>
          <button
            onClick={() => handleOpenPaymentModal()}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center justify-center space-x-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Record Payment (Pay Dues)</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-rose-300 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider">
              Total Outstanding Dues
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900">
            {currSym} {totalDuesPayable.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-rose-800 font-bold flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{suppliersWithDuesCount} suppliers have pending balances</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Amount Paid
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {currSym} {totalPaidAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {supplierPayments.length} recorded supplier disbursements
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Purchases Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {currSym} {totalBillsAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {supplierBills.length} purchase lots & raw material bills
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Suppliers
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {suppliers.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Fabric, wadding, packaging & accessories
          </p>
        </div>
      </div>

      {/* Main Container with Tabs, Search, and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Navigation & Controls Header */}
        <div className="p-4 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Tab switchers */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveSubTab('suppliers')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'suppliers'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Supplier Balances ({suppliers.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('bills')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'bills'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Bills & Lot Invoices ({supplierBills.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('payments')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'payments'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payment Audit Log ({supplierPayments.length})</span>
              </button>
            </div>

            {/* Sub actions */}
            {activeSubTab === 'suppliers' && (
              <button
                onClick={handleOpenAddSupplier}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Supplier Profile</span>
              </button>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {/* Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search supplier, bill #, phone, item description, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Supplier Types</option>
                <option value="fabric">Fabric Mills</option>
                <option value="wadding">Wadding / Fiber Suppliers</option>
                <option value="packaging_bags">Bags & Packaging</option>
                <option value="stiffener_labels">Stiffeners & Labels</option>
                <option value="zipper_buttons">Zippers & Buttons</option>
                <option value="general">General Vendors</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Payment Statuses</option>
                <option value="has_dues">Pending Dues Only (Unpaid/Partial)</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Fully Cleared (Paid)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab 1: Supplier Directory & Balance Summaries */}
        {activeSubTab === 'suppliers' && (
          <div className="p-4">
            {filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No suppliers found matching your filter</p>
                <p className="text-xs text-slate-400 mt-1">Try changing search query or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((sup) => {
                  const supBills = supplierBills.filter((b) => b.supplierName.toLowerCase() === sup.name.toLowerCase());
                  const supTotalPurchases = supBills.reduce((s, b) => s + (b.totalAmount || 0), 0) || sup.totalPurchases;
                  const supTotalPaid = supBills.reduce((s, b) => s + (b.amountPaid || 0), 0) || sup.totalPaid;
                  const supCurrentDues = supBills.reduce((s, b) => s + (b.balanceDue || 0), 0) || Math.max(0, supTotalPurchases - supTotalPaid);

                  return (
                    <div
                      key={sup.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900">{sup.name}</h3>
                            {sup.companyName && sup.companyName !== sup.name && (
                              <p className="text-xs text-slate-500 font-medium">{sup.companyName}</p>
                            )}
                          </div>
                          {getCategoryBadge(sup.category)}
                        </div>

                        {/* Contact details */}
                        <div className="space-y-1 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl">
                          {sup.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{sup.phone}</span>
                            </div>
                          )}
                          {sup.city && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{sup.city}</span>
                            </div>
                          )}
                          {sup.notes && (
                            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60 mt-1">
                              {sup.notes}
                            </p>
                          )}
                        </div>

                        {/* Financial balance breakdown */}
                        <div className="grid grid-cols-3 gap-2 text-center p-2.5 bg-slate-100/70 rounded-xl mb-4">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Bills</span>
                            <span className="text-xs font-extrabold text-slate-800">
                              {currSym} {supTotalPurchases.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Paid</span>
                            <span className="text-xs font-extrabold text-emerald-600">
                              {currSym} {supTotalPaid.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-rose-500 uppercase font-bold block">Balance Due</span>
                            <span className={`text-xs font-black ${supCurrentDues > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {currSym} {supCurrentDues.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedSupplierForLedger(sup)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                            title="View Statement"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Statement</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditSupplier(sup)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSupplierToDelete(sup)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {supCurrentDues > 0 ? (
                          <button
                            onClick={() => handleOpenPaymentModal(sup.name)}
                            className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-lg transition flex items-center space-x-1 shadow-xs cursor-pointer"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Pay Dues</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bills & Lots Invoices List */}
        {activeSubTab === 'bills' && (
          <div className="overflow-x-auto">
            {filteredBills.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No supplier bills found</p>
                <p className="text-xs text-slate-400 mt-1">Add a new supplier purchase bill or check filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Bill / Lot #</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 font-mono block">{bill.billNumber}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {bill.date}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{bill.supplierName}</span>
                        {bill.supplierPhone && (
                          <span className="text-[11px] text-slate-400">{bill.supplierPhone}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getCategoryBadge(bill.category)}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-800 font-medium truncate">{bill.itemDescription}</p>
                        {bill.paymentNotes && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{bill.paymentNotes}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {currSym} {bill.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                        {currSym} {bill.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-black ${bill.balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {currSym} {bill.balanceDue.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {bill.paymentStatus === 'Paid' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                            Paid
                          </span>
                        ) : bill.paymentStatus === 'Partial' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
                            Partial
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {bill.balanceDue > 0 && (
                            <button
                              onClick={() => handleOpenPaymentModal(bill.supplierName, bill.id)}
                              className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                              title="Pay this bill"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => setBillToDelete(bill)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Payment Audit Log */}
        {activeSubTab === 'payments' && (
          <div className="overflow-x-auto">
            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No payment records found</p>
                <p className="text-xs text-slate-400 mt-1">Record a payment to see the transaction ledger.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Against Bill #</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Ref / Receipt #</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{pay.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{pay.supplierName}</div>
                        {pay.supplierAddress && <div className="text-[10px] text-slate-400">{pay.supplierAddress}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {pay.billNumber || <span className="text-slate-400 italic">On Account</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-800 rounded-md">
                          {pay.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{pay.referenceNo || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{pay.notes || '—'}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600 text-sm">
                        {currSym} {pay.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Add/Edit Supplier Profile */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingSupplierId ? 'Edit Supplier Profile' : 'Add New Supplier Profile'}
                </h3>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier / Mill Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunrise Textile Mills"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Weaving Processing Unit"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={supplierCat}
                    onChange={(e) => setSupplierCat(e.target.value as SupplierCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="fabric">Fabric Mills</option>
                    <option value="wadding">Wadding / Fiber</option>
                    <option value="packaging_bags">Bags & Packaging</option>
                    <option value="stiffener_labels">Stiffeners & Labels</option>
                    <option value="zipper_buttons">Zippers & Buttons</option>
                    <option value="general">General Vendor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Faisalabad / Lahore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address / Mill Location</label>
                <input
                  type="text"
                  placeholder="Industrial Area, Millat Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  placeholder="Credit term details, quality specifications..."
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {editingSupplierId ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Supplier Bill / Purchase */}
      {isBillModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <Receipt className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Record New Supplier Bill / Purchase
                </h3>
              </div>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supplier Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="suppliers-datalist"
                    placeholder="Select or enter supplier"
                    value={billSupplierName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setBillSupplierName(name);
                      const found = suppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
                      if (found) {
                        setBillSupplierAddress(found.address || '');
                        setBillCategory(found.category || 'fabric');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <datalist id="suppliers-datalist">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Mill Area, Faisalabad"
                    value={billSupplierAddress}
                    onChange={(e) => setBillSupplierAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Category</label>
                  <select
                    value={billCategory}
                    onChange={(e) => setBillCategory(e.target.value as SupplierCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="fabric">Fabric Mills</option>
                    <option value="wadding">Wadding / Fiber</option>
                    <option value="packaging_bags">Bags & Packaging</option>
                    <option value="stiffener_labels">Stiffeners & Labels</option>
                    <option value="zipper_buttons">Zippers & Buttons</option>
                    <option value="general">General Vendor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bill / Lot # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LOT-2026-105"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Description & Specs
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5,000 Single Quilt Zipper Bags & 2,000 Double Bags"
                  value={billItemDesc}
                  onChange={(e) => setBillItemDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={billQty}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setBillQty(q);
                      if (billRate > 0) setBillTotalAmount(q * billRate);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="pcs / meters / kg"
                    value={billUnit}
                    onChange={(e) => setBillUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rate per Unit ({currSym})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={billRate}
                    onChange={(e) => {
                      const r = Number(e.target.value);
                      setBillRate(r);
                      if (billQty > 0) setBillTotalAmount(billQty * r);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total & Initial Paid */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Total Bill Amount ({currSym}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={billTotalAmount}
                      onChange={(e) => setBillTotalAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 mb-1">
                      Initial Amount Paid ({currSym})
                    </label>
                    <input
                      type="number"
                      value={billAmountPaid}
                      onChange={(e) => setBillAmountPaid(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm font-extrabold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-600">Calculated Balance Due:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {currSym} {Math.max(0, billTotalAmount - billAmountPaid).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes / Voucher Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via Bank Transfer on unloading"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Save Bill & Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Payment to Supplier */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <DollarSign className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Record Payment to Supplier (Disburse Funds)
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedSupplierForPayment}
                    onChange={(e) => {
                      const sup = e.target.value;
                      setSelectedSupplierForPayment(sup);
                      setSelectedBillForPayment('');
                      const foundSup = suppliers.find((s) => s.name.toLowerCase() === sup.toLowerCase());
                      setPaymentSupplierAddress(foundSup?.address || '');
                      const supBills = supplierBills.filter((b) => b.supplierName.toLowerCase() === sup.toLowerCase());
                      const totalDue = supBills.reduce((s, b) => s + (b.balanceDue || 0), 0);
                      setPaymentAmount(totalDue > 0 ? totalDue : 0);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => {
                      const supBills = supplierBills.filter((b) => b.supplierName.toLowerCase() === s.name.toLowerCase());
                      const due = supBills.reduce((acc, b) => acc + (b.balanceDue || 0), 0);
                      return (
                        <option key={s.id} value={s.name}>
                          {s.name} (Due: {currSym} {due.toLocaleString()})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Factory Area / Market, Faisalabad"
                    value={paymentSupplierAddress}
                    onChange={(e) => setPaymentSupplierAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Bill Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Apply to Specific Bill / Lot (Optional)
                </label>
                <select
                  value={selectedBillForPayment}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setSelectedBillForPayment(bId);
                    if (bId) {
                      const b = supplierBills.find((x) => x.id === bId);
                      if (b) setPaymentAmount(b.balanceDue);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- General Account Balance (FIFO Auto-Clear) --</option>
                  {supplierBills
                    .filter((b) => b.supplierName.toLowerCase() === selectedSupplierForPayment.toLowerCase() && b.balanceDue > 0)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.billNumber} - {b.itemDescription} (Due: {currSym} {b.balanceDue.toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount to Pay ({currSym}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-rose-300 rounded-xl text-sm font-extrabold text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer (FT / IBFT)</option>
                    <option value="Cash">Cash Voucher</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online/UPI">Online / JazzCash / EasyPaisa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Cheque #</label>
                  <input
                    type="text"
                    placeholder="e.g. CHK-9901 or FT-4412"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full via Habib Bank Transfer"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Record Payment & Deduct Due
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Printable Supplier Khata / Ledger Statement */}
      {selectedSupplierForLedger && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header & Print Action */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Supplier Ledger Statement: {selectedSupplierForLedger.name}
                  </h3>
                  <p className="text-xs text-slate-500">Official Purchase & Payment Ledger Record</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
                <button
                  onClick={() => setSelectedSupplierForLedger(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Supplier Details & Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Supplier Type</span>
                <span className="font-extrabold text-slate-900">{selectedSupplierForLedger.category.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Phone</span>
                <span className="font-extrabold text-slate-900">{selectedSupplierForLedger.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">City / Address</span>
                <span className="font-extrabold text-slate-900">{selectedSupplierForLedger.city || selectedSupplierForLedger.address || 'N/A'}</span>
              </div>
              <div>
                <span className="text-rose-500 font-bold block">Current Pending Dues</span>
                <span className="font-black text-rose-600 text-sm">
                  {currSym}{' '}
                  {supplierBills
                    .filter((b) => b.supplierName.toLowerCase() === selectedSupplierForLedger.name.toLowerCase())
                    .reduce((s, b) => s + (b.balanceDue || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bills & Transactions Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Purchase Bills & Lots ({supplierBills.filter((b) => b.supplierName.toLowerCase() === selectedSupplierForLedger.name.toLowerCase()).length})
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Bill / Lot #</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {supplierBills
                      .filter((b) => b.supplierName.toLowerCase() === selectedSupplierForLedger.name.toLowerCase())
                      .map((b) => (
                        <tr key={b.id}>
                          <td className="py-2.5 px-3 font-mono">{b.date}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{b.billNumber}</td>
                          <td className="py-2.5 px-3 text-slate-700">{b.itemDescription}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {currSym} {b.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            {currSym} {b.amountPaid.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-600">
                            {currSym} {b.balanceDue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Payments History */}
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider pt-2">
                Recorded Payments ({supplierPayments.filter((p) => p.supplierName.toLowerCase() === selectedSupplierForLedger.name.toLowerCase()).length})
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Ref #</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {supplierPayments
                      .filter((p) => p.supplierName.toLowerCase() === selectedSupplierForLedger.name.toLowerCase())
                      .map((p) => (
                        <tr key={p.id}>
                          <td className="py-2.5 px-3 font-mono">{p.date}</td>
                          <td className="py-2.5 px-3 font-semibold">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 font-mono">{p.referenceNo || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.notes || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600">
                            {currSym} {p.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
              <button
                onClick={() => setSelectedSupplierForLedger(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      {supplierToDelete && (
        <ConfirmDeleteModal
          isOpen={!!supplierToDelete}
          title="Delete Supplier Profile"
          message={`Are you sure you want to delete supplier "${supplierToDelete.name}"? Historical bills will remain intact.`}
          onConfirm={handleConfirmDeleteSupplier}
          onClose={() => setSupplierToDelete(null)}
        />
      )}

      {billToDelete && (
        <ConfirmDeleteModal
          isOpen={!!billToDelete}
          title="Delete Supplier Bill"
          message={`Are you sure you want to delete bill "${billToDelete.billNumber}" from ${billToDelete.supplierName}?`}
          onConfirm={handleConfirmDeleteBill}
          onClose={() => setBillToDelete(null)}
        />
      )}
    </div>
  );
};

