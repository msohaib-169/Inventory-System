// @ts-nocheck
import React, { useState, useMemo } from 'react';
import {
  FabricLot,
  CuttingRecord,
  ProductionRecord,
  FinishedProduct,
  Invoice,
  Party,
  CurrencyOption,
  WaddingStock,
  SupplierProfile,
  SupplierBill,
  SupplierPayment,
} from '../types';
import { COMPANY_INFO, PDFGenerator } from '../lib/pdfGenerator';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Scissors,
  Package,
  FileText,
  Search,
  X,
  CheckCircle2,
  Users,
  CreditCard,
  Building2,
  Scale,
  Truck,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

interface ReportsViewProps {
  lots: FabricLot[];
  cuttingRecords: CuttingRecord[];
  productionRecords?: ProductionRecord[];
  products: FinishedProduct[];
  invoices: Invoice[];
  parties?: Party[];
  wadding?: WaddingStock;
  suppliers?: SupplierProfile[];
  supplierBills?: SupplierBill[];
  supplierPayments?: SupplierPayment[];
  currency: CurrencyOption;
}

type ReportType =
  | 'daily_cutting'
  | 'production'
  | 'billing_sales'
  | 'supplier'
  | 'wadding'
  | 'lots'
  | 'product_stock';

type ExtendedPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export const ReportsView: React.FC<ReportsViewProps> = ({
  lots,
  cuttingRecords,
  productionRecords = [],
  products,
  invoices,
  parties = [],
  wadding,
  suppliers = [],
  supplierBills = [],
  supplierPayments = [],
  currency,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('daily_cutting');
  const [period, setPeriod] = useState<ExtendedPeriod>('monthly');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [billingSubTab, setBillingSubTab] = useState<'bills' | 'party_summary'>('bills');
  const [supplierSubTab, setSupplierSubTab] = useState<'profiles' | 'bills'>('profiles');

  const currSym = currency.symbol;

  // Filter helper based on period date check
  const isDateInPeriod = (dateStr?: string) => {
    if (!dateStr) return true;
    if (period === 'all') return true;

    const itemDate = new Date(dateStr);
    const now = new Date();

    if (period === 'daily') {
      if (customDate) {
        return dateStr === customDate;
      }
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

  // 1. Filtered Cutting Records
  const filteredCutting = useMemo(() => {
    return cuttingRecords.filter((r) => {
      const matchesPeriod = isDateInPeriod(r.date);
      if (!matchesPeriod) return false;
      if (!q) return true;
      return (
        r.lotNumber?.toLowerCase().includes(q) ||
        r.designNumber?.toLowerCase().includes(q) ||
        r.productType?.toLowerCase().includes(q) ||
        r.date?.includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    });
  }, [cuttingRecords, period, customDate, q]);

  // 2. Filtered Production Records
  const filteredProduction = useMemo(() => {
    return productionRecords.filter((p) => {
      const matchesPeriod = isDateInPeriod(p.date);
      if (!matchesPeriod) return false;
      if (!q) return true;
      return (
        p.productName?.toLowerCase().includes(q) ||
        p.productCategory?.toLowerCase().includes(q) ||
        (p.productSubCategory && p.productSubCategory.toLowerCase().includes(q)) ||
        p.designNumber?.toLowerCase().includes(q) ||
        p.date?.includes(q) ||
        (p.operatorName && p.operatorName.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    });
  }, [productionRecords, period, customDate, q]);

  // 3. Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesPeriod = isDateInPeriod(inv.date);
      if (!matchesPeriod) return false;
      if (!q) return true;
      return (
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.partyName?.toLowerCase().includes(q) ||
        inv.status?.toLowerCase().includes(q) ||
        inv.date?.includes(q) ||
        inv.items?.some((i) => i.productName?.toLowerCase().includes(q))
      );
    });
  }, [invoices, period, customDate, q]);

  // Party-wise billing summary for the selected period
  const partyWiseBilling = useMemo(() => {
    const summaryMap: Record<
      string,
      {
        partyName: string;
        billsCount: number;
        subtotal: number;
        grandTotal: number;
        amountPaid: number;
        balanceDue: number;
        invoices: string[];
      }
    > = {};

    filteredInvoices.forEach((inv) => {
      const party = inv.partyName || 'Walk-in Customer';
      if (!summaryMap[party]) {
        summaryMap[party] = {
          partyName: party,
          billsCount: 0,
          subtotal: 0,
          grandTotal: 0,
          amountPaid: 0,
          balanceDue: 0,
          invoices: [],
        };
      }
      summaryMap[party].billsCount += 1;
      summaryMap[party].subtotal += inv.subtotal || 0;
      summaryMap[party].grandTotal += inv.grandTotal || 0;
      summaryMap[party].amountPaid += inv.amountPaid || 0;
      summaryMap[party].balanceDue += inv.balanceDue || 0;
      summaryMap[party].invoices.push(inv.invoiceNumber);
    });

    return Object.values(summaryMap).sort((a, b) => b.grandTotal - a.grandTotal);
  }, [filteredInvoices]);

  // 4. Filtered Suppliers & Supplier Bills
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        (s.companyName && s.companyName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        s.category?.toLowerCase().includes(q)
      );
    });
  }, [suppliers, q]);

  const filteredSupplierBills = useMemo(() => {
    return supplierBills.filter((b) => {
      const matchesPeriod = isDateInPeriod(b.date);
      if (!matchesPeriod) return false;
      if (!q) return true;
      return (
        b.billNumber?.toLowerCase().includes(q) ||
        b.supplierName?.toLowerCase().includes(q) ||
        b.itemDescription?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.date?.includes(q) ||
        b.paymentStatus?.toLowerCase().includes(q)
      );
    });
  }, [supplierBills, period, customDate, q]);

  // 5. Filtered Wadding Items
  const waddingItems = useMemo(() => {
    const items = wadding?.items || [];
    return items.filter((w) => {
      if (!q) return true;
      return (
        w.type?.toLowerCase().includes(q) ||
        (w.supplierName && w.supplierName.toLowerCase().includes(q)) ||
        (w.lotNumber && w.lotNumber.toLowerCase().includes(q)) ||
        (w.notes && w.notes.toLowerCase().includes(q))
      );
    });
  }, [wadding, q]);

  // 6. Filtered Lots
  const filteredLots = useMemo(() => {
    return lots.filter((l) => {
      if (!q) return true;
      return (
        l.lotNumber?.toLowerCase().includes(q) ||
        (l.supplierName && l.supplierName.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q)) ||
        l.designs?.some((d) => d.designNumber?.toLowerCase().includes(q))
      );
    });
  }, [lots, q]);

  // 7. Filtered Products (WITHOUT SKU)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.designNumber?.toLowerCase().includes(q)
      );
    });
  }, [products, q]);

  // KPI Calculations
  const cuttingTotals = useMemo(() => {
    let pieces = 0;
    let front = 0;
    let reverse = 0;
    let totalMeters = 0;
    let waddingKg = 0;

    filteredCutting.forEach((r) => {
      pieces += r.quantityCut || 0;
      front += r.totalFrontMetersUsed || 0;
      reverse += r.totalReverseMetersUsed || 0;
      totalMeters += r.totalMetersUsed || 0;
      waddingKg += r.waddingUsedKg || (r.waddingKgPerPiece ? r.waddingKgPerPiece * r.quantityCut : 0);
    });

    return { pieces, front, reverse, totalMeters, waddingKg };
  }, [filteredCutting]);

  const productionTotals = useMemo(() => {
    let totalQty = 0;
    let waddingKg = 0;
    let stiffeners = 0;
    let polybags = 0;
    let cards = 0;
    let quiltBags = 0;

    filteredProduction.forEach((p) => {
      totalQty += p.quantityProduced || 0;
      waddingKg += p.waddingUsedKg || 0;
      stiffeners += p.stiffenersUsed || 0;
      polybags += p.polybagsUsed || 0;
      cards += p.cardsUsed || 0;
      quiltBags += (p.quiltBagsUsed || 0) + (p.comforterBagsUsed || 0);
    });

    return { totalQty, waddingKg, stiffeners, polybags, cards, quiltBags };
  }, [filteredProduction]);

  const billingTotals = useMemo(() => {
    let totalBills = filteredInvoices.length;
    let grandTotal = 0;
    let amountPaid = 0;
    let balanceDue = 0;

    filteredInvoices.forEach((inv) => {
      grandTotal += inv.grandTotal || 0;
      amountPaid += inv.amountPaid || 0;
      balanceDue += inv.balanceDue || 0;
    });

    return { totalBills, grandTotal, amountPaid, balanceDue };
  }, [filteredInvoices]);

  const supplierTotals = useMemo(() => {
    let totalPurchases = 0;
    let totalPaid = 0;
    let currentDues = 0;

    suppliers.forEach((s) => {
      totalPurchases += s.totalPurchases || 0;
      totalPaid += s.totalPaid || 0;
      currentDues += s.currentDues || 0;
    });

    let billsInPeriodAmount = 0;
    let billsInPeriodPaid = 0;
    let billsInPeriodDue = 0;

    filteredSupplierBills.forEach((b) => {
      billsInPeriodAmount += b.totalAmount || 0;
      billsInPeriodPaid += b.amountPaid || 0;
      billsInPeriodDue += b.balanceDue || 0;
    });

    return {
      totalSuppliers: suppliers.length,
      totalPurchases,
      totalPaid,
      currentDues,
      billsInPeriodCount: filteredSupplierBills.length,
      billsInPeriodAmount,
      billsInPeriodPaid,
      billsInPeriodDue,
    };
  }, [suppliers, filteredSupplierBills]);

  const waddingTotals = useMemo(() => {
    const totalPurchased = wadding?.totalPurchasedKg || 0;
    const used = wadding?.usedKg || 0;
    const available = wadding?.availableKg || Math.max(0, totalPurchased - used);
    let totalInventoryValue = 0;

    (wadding?.items || []).forEach((item) => {
      totalInventoryValue += (item.availableKg || 0) * (item.ratePerKg || 0);
    });

    return {
      totalPurchased,
      used,
      available,
      itemsCount: (wadding?.items || []).length,
      totalInventoryValue,
    };
  }, [wadding]);

  // Export handlers
  const handleExportPDF = () => {
    let title = '';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let stats: { label: string; value: string }[] = [];

    const periodText = period === 'daily' ? `DAILY (${customDate})` : period.toUpperCase();

    switch (selectedReportType) {
      case 'daily_cutting':
        title = 'Daily Cutting Details Log Report';
        headers = ['Date', 'Lot #', 'Design #', 'Product', 'Qty Cut', 'Front (m)', 'Reverse (m)', 'Total (m)', 'Wadding (kg)'];
        rows = filteredCutting.map((r) => [
          r.date,
          r.lotNumber,
          r.designNumber,
          r.productType,
          `${r.quantityCut} pcs`,
          `${r.totalFrontMetersUsed}m`,
          `${r.totalReverseMetersUsed}m`,
          `${r.totalMetersUsed}m`,
          `${(r.waddingUsedKg || (r.waddingKgPerPiece ? r.waddingKgPerPiece * r.quantityCut : 0)).toFixed(2)} kg`,
        ]);
        stats = [
          { label: 'Total Pieces Cut', value: `${cuttingTotals.pieces} pcs` },
          { label: 'Front Meters', value: `${cuttingTotals.front.toFixed(1)} m` },
          { label: 'Reverse Meters', value: `${cuttingTotals.reverse.toFixed(1)} m` },
          { label: 'Grand Total Fabric', value: `${cuttingTotals.totalMeters.toFixed(1)} m` },
        ];
        break;

      case 'production':
        title = 'Daily Production Log Report';
        headers = ['Date', 'Product Name', 'Category', 'Design #', 'Qty Made', 'Wadding (kg)', 'Bags', 'Stiffeners', 'Operator'];
        rows = filteredProduction.map((p) => [
          p.date,
          p.productName,
          p.productCategory || 'N/A',
          p.designNumber,
          `${p.quantityProduced} pcs`,
          `${(p.waddingUsedKg || 0).toFixed(2)} kg`,
          `${(p.quiltBagsUsed || 0) + (p.polybagsUsed || 0)} pcs`,
          `${p.stiffenersUsed || 0}`,
          p.operatorName || 'Factory',
        ]);
        stats = [
          { label: 'Total Produced', value: `${productionTotals.totalQty} pcs` },
          { label: 'Wadding Used', value: `${productionTotals.waddingKg.toFixed(1)} kg` },
          { label: 'Packaging Bags', value: `${productionTotals.quiltBags + productionTotals.polybags}` },
          { label: 'Stiffeners Used', value: `${productionTotals.stiffeners}` },
        ];
        break;

      case 'billing_sales':
        title = `Sales & Billing Invoices Report (${periodText})`;
        headers = ['Bill #', 'Date', 'Party / Customer', 'Items', 'Subtotal', 'Discount', 'Grand Total', 'Paid', 'Balance', 'Status'];
        rows = filteredInvoices.map((inv) => [
          inv.invoiceNumber,
          inv.date,
          inv.partyName,
          `${inv.items?.length || 0} items`,
          `${currSym} ${inv.subtotal.toFixed(2)}`,
          `${currSym} ${inv.discountAmount.toFixed(2)}`,
          `${currSym} ${inv.grandTotal.toFixed(2)}`,
          `${currSym} ${inv.amountPaid.toFixed(2)}`,
          `${currSym} ${inv.balanceDue.toFixed(2)}`,
          inv.status,
        ]);
        stats = [
          { label: 'Bills Issued', value: `${billingTotals.totalBills}` },
          { label: 'Total Invoiced', value: `${currSym} ${billingTotals.grandTotal.toLocaleString()}` },
          { label: 'Amount Collected', value: `${currSym} ${billingTotals.amountPaid.toLocaleString()}` },
          { label: 'Balance Due', value: `${currSym} ${billingTotals.balanceDue.toLocaleString()}` },
        ];
        break;

      case 'supplier':
        title = `Supplier Accounts & Purchases Report (${periodText})`;
        if (supplierSubTab === 'profiles') {
          headers = ['Supplier Name', 'Company', 'Category', 'Contact', 'Total Purchases', 'Total Paid', 'Current Dues'];
          rows = filteredSuppliers.map((s) => [
            s.name,
            s.companyName || '-',
            s.category || 'General',
            s.phone || s.city || '-',
            `${currSym} ${(s.totalPurchases || 0).toFixed(2)}`,
            `${currSym} ${(s.totalPaid || 0).toFixed(2)}`,
            `${currSym} ${(s.currentDues || 0).toFixed(2)}`,
          ]);
        } else {
          headers = ['Bill #', 'Date', 'Supplier', 'Category', 'Description', 'Total Amount', 'Paid', 'Balance Due', 'Status'];
          rows = filteredSupplierBills.map((b) => [
            b.billNumber,
            b.date,
            b.supplierName,
            b.category,
            b.itemDescription,
            `${currSym} ${(b.totalAmount || 0).toFixed(2)}`,
            `${currSym} ${(b.amountPaid || 0).toFixed(2)}`,
            `${currSym} ${(b.balanceDue || 0).toFixed(2)}`,
            b.paymentStatus,
          ]);
        }
        stats = [
          { label: 'Total Suppliers', value: `${supplierTotals.totalSuppliers}` },
          { label: 'Total Purchases', value: `${currSym} ${supplierTotals.totalPurchases.toLocaleString()}` },
          { label: 'Total Paid', value: `${currSym} ${supplierTotals.totalPaid.toLocaleString()}` },
          { label: 'Current Accounts Payable', value: `${currSym} ${supplierTotals.currentDues.toLocaleString()}` },
        ];
        break;

      case 'wadding':
        title = 'Quilt Wadding Stock & Materials Report';
        headers = ['Wadding Type', 'GSM', 'Supplier', 'Lot #', 'Rate/Kg', 'Purchased (Kg)', 'Used (Kg)', 'Available (Kg)', 'Specs (Single/Double)'];
        rows = waddingItems.map((w) => [
          w.type,
          `${w.gsm} GSM`,
          w.supplierName || 'Factory',
          w.lotNumber || '-',
          w.ratePerKg ? `${currSym} ${w.ratePerKg.toFixed(2)}` : '-',
          `${w.totalPurchasedKg || 0} kg`,
          `${w.usedKg || 0} kg`,
          `${w.availableKg || 0} kg`,
          `${w.singleQuiltSpecKg || 0}kg / ${w.doubleQuiltSpecKg || 0}kg`,
        ]);
        stats = [
          { label: 'Total Purchased', value: `${waddingTotals.totalPurchased.toFixed(1)} kg` },
          { label: 'Total Used', value: `${waddingTotals.used.toFixed(1)} kg` },
          { label: 'Available Stock', value: `${waddingTotals.available.toFixed(1)} kg` },
          { label: 'Wadding Lots', value: `${waddingTotals.itemsCount}` },
        ];
        break;

      case 'lots':
        title = 'Raw Material Lot Management Report';
        headers = ['Lot Number', 'Supplier', 'Date Received', 'Designs Count', 'Front Meters', 'Reverse Meters', 'Grand Total (m)'];
        rows = filteredLots.map((l) => {
          let front = 0,
            reverse = 0;
          l.designs?.forEach((d) => {
            front += d.frontMeters || 0;
            reverse += d.reverseMeters || 0;
          });
          return [l.lotNumber, l.supplierName || 'N/A', l.dateReceived, l.designs?.length || 0, front, reverse, front + reverse];
        });
        if (filteredLots.length > 0) {
          PDFGenerator.generateLotDetailReportPDF(filteredLots, periodText, {
            name: COMPANY_INFO.name,
            address: COMPANY_INFO.address,
            phone: COMPANY_INFO.phone,
          });
          return;
        }
        break;

      case 'product_stock':
        title = 'Finished Products Stock Inventory Report';
        // NO SKU CODE PER USER REQUEST
        headers = ['Product Name', 'Category', 'Design #', 'Stock Qty', 'Cost Price', 'Selling Price', 'Total Stock Cost'];
        rows = filteredProducts.map((p) => [
          p.name,
          p.category,
          p.designNumber,
          `${p.stockQuantity} ${p.unit}`,
          `${currSym} ${p.costPrice.toFixed(2)}`,
          `${currSym} ${p.sellingPrice.toFixed(2)}`,
          `${currSym} ${(p.stockQuantity * p.costPrice).toFixed(2)}`,
        ]);
        break;
    }

    if (selectedReportType !== 'lots' || filteredLots.length === 0) {
      PDFGenerator.generateGeneralReportPDF(title, periodText, headers, rows, stats);
    }
  };

  const handleExportCSV = () => {
    let title = selectedReportType;
    let csvRows: string[] = [];

    if (selectedReportType === 'daily_cutting') {
      csvRows.push('Date,Lot Number,Design Number,Product Type,Quantity Cut,Front Meters,Reverse Meters,Total Meters,Wadding Used (Kg),Notes');
      filteredCutting.forEach((r) => {
        const waddingKg = r.waddingUsedKg || (r.waddingKgPerPiece ? r.waddingKgPerPiece * r.quantityCut : 0);
        csvRows.push(
          `"${r.date}","${r.lotNumber}","${r.designNumber}","${r.productType}",${r.quantityCut},${r.totalFrontMetersUsed},${r.totalReverseMetersUsed},${r.totalMetersUsed},${waddingKg},"${r.notes || ''}"`
        );
      });
    } else if (selectedReportType === 'production') {
      csvRows.push('Date,Product Name,Category,Sub-Category,Design Number,Quantity Produced,Wadding Kg,Stiffeners,Polybags,Cards,Quilt Bags,Operator,Notes');
      filteredProduction.forEach((p) => {
        csvRows.push(
          `"${p.date}","${p.productName}","${p.productCategory || ''}","${p.productSubCategory || ''}","${p.designNumber}",${p.quantityProduced},${p.waddingUsedKg || 0},${p.stiffenersUsed || 0},${p.polybagsUsed || 0},${p.cardsUsed || 0},${(p.quiltBagsUsed || 0) + (p.comforterBagsUsed || 0)},"${p.operatorName || ''}","${p.notes || ''}"`
        );
      });
    } else if (selectedReportType === 'billing_sales') {
      csvRows.push('Invoice Number,Party Name,Date,Items Count,Subtotal,Discount,Grand Total,Amount Paid,Balance Due,Status');
      filteredInvoices.forEach((i) => {
        csvRows.push(
          `"${i.invoiceNumber}","${i.partyName}","${i.date}",${i.items?.length || 0},${i.subtotal},${i.discountAmount},${i.grandTotal},${i.amountPaid},${i.balanceDue},"${i.status}"`
        );
      });
    } else if (selectedReportType === 'supplier') {
      if (supplierSubTab === 'profiles') {
        csvRows.push('Supplier Name,Company Name,Category,Phone,City,Total Purchases,Total Paid,Current Dues');
        filteredSuppliers.forEach((s) => {
          csvRows.push(
            `"${s.name}","${s.companyName || ''}","${s.category || ''}","${s.phone || ''}","${s.city || ''}",${s.totalPurchases || 0},${s.totalPaid || 0},${s.currentDues || 0}`
          );
        });
      } else {
        csvRows.push('Bill Number,Date,Supplier Name,Category,Description,Total Amount,Amount Paid,Balance Due,Status');
        filteredSupplierBills.forEach((b) => {
          csvRows.push(
            `"${b.billNumber}","${b.date}","${b.supplierName}","${b.category}","${b.itemDescription}",${b.totalAmount},${b.amountPaid},${b.balanceDue},"${b.paymentStatus}"`
          );
        });
      }
    } else if (selectedReportType === 'wadding') {
      csvRows.push('Wadding Type,GSM,Supplier,Lot Number,Rate Per Kg,Total Purchased Kg,Used Kg,Available Kg,Single Quilt Spec Kg,Double Quilt Spec Kg');
      waddingItems.forEach((w) => {
        csvRows.push(
          `"${w.type}",${w.gsm},"${w.supplierName || ''}","${w.lotNumber || ''}",${w.ratePerKg || 0},${w.totalPurchasedKg || 0},${w.usedKg || 0},${w.availableKg || 0},${w.singleQuiltSpecKg || 0},${w.doubleQuiltSpecKg || 0}`
        );
      });
    } else if (selectedReportType === 'lots') {
      csvRows.push('Lot Number,Supplier,Date Received,Front Meters,Reverse Meters,Grand Total Meters');
      filteredLots.forEach((l) => {
        let front = 0,
          reverse = 0;
        l.designs?.forEach((d) => {
          front += d.frontMeters || 0;
          reverse += d.reverseMeters || 0;
        });
        csvRows.push(`"${l.lotNumber}","${l.supplierName || ''}","${l.dateReceived}",${front},${reverse},${front + reverse}`);
      });
    } else if (selectedReportType === 'product_stock') {
      // NO SKU CODE PER USER REQUEST
      csvRows.push('Product Name,Category,Design Number,Stock Quantity,Cost Price,Selling Price,Stock Cost Value');
      filteredProducts.forEach((p) => {
        csvRows.push(
          `"${p.name}","${p.category}","${p.designNumber}",${p.stockQuantity},${p.costPrice},${p.sellingPrice},${p.stockQuantity * p.costPrice}`
        );
      });
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
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
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">Factory Analytics & Management Reports</h2>
              <p className="text-xs text-slate-400">
                Cutting logs, daily production, period billing lists, supplier payables, and wadding reports
              </p>
            </div>
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
              onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="daily_cutting">1. Daily Cutting Log & Detail Report</option>
              <option value="production">2. Daily Production Report</option>
              <option value="billing_sales">3. Billing & Sales Invoices Report</option>
              <option value="supplier">4. Supplier Accounts & Purchases Report</option>
              <option value="wadding">5. Wadding Stock & Quilt Fiber Report</option>
              <option value="lots">6. Fabric Lots Management Report</option>
              <option value="product_stock">7. Finished Products Stock & Inventory Report</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Time Period Filter
              </label>
              {period === 'daily' && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-400">Date:</span>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-white text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {(['daily', 'weekly', 'monthly', 'yearly', 'all'] as ExtendedPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`py-2 px-1.5 text-center rounded-lg text-xs font-bold capitalize transition cursor-pointer ${period === p
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                >
                  {p === 'all' ? 'All Time' : p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1. KPI Cards: Daily Cutting */}
      {selectedReportType === 'daily_cutting' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <Scissors className="w-3.5 h-3.5 text-indigo-600" />
              <span>Total Pieces Cut</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{cuttingTotals.pieces} pcs</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{filteredCutting.length} operations</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Front Consumed</span>
            </div>
            <div className="text-xl font-bold text-blue-700">{cuttingTotals.front.toLocaleString()} m</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Front fabric usage</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Reverse Consumed</span>
            </div>
            <div className="text-xl font-bold text-purple-700">{cuttingTotals.reverse.toLocaleString()} m</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Reverse fabric usage</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Fabric Meters</span>
            </div>
            <div className="text-xl font-bold text-emerald-700">{cuttingTotals.totalMeters.toLocaleString()} m</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Front + Reverse total</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <span>Wadding Consumed</span>
            </div>
            <div className="text-xl font-bold text-amber-700">{cuttingTotals.waddingKg.toFixed(1)} kg</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Quilt wadding filled</p>
          </div>
        </div>
      )}

      {/* 2. KPI Cards: Production */}
      {selectedReportType === 'production' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Units Produced</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{productionTotals.totalQty} pcs</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{filteredProduction.length} production runs</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>Wadding Consumed</span>
            </div>
            <div className="text-xl font-bold text-indigo-700">{productionTotals.waddingKg.toFixed(1)} kg</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Deducted from stock</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <span>Packaging Bags Used</span>
            </div>
            <div className="text-xl font-bold text-amber-700">{productionTotals.quiltBags + productionTotals.polybags}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Quilt bags & polybags</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Stiffeners & Cards</span>
            </div>
            <div className="text-xl font-bold text-purple-700">{productionTotals.stiffeners + productionTotals.cards}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Accessory items deducted</p>
          </div>
        </div>
      )}

      {/* 3. KPI Cards & Subtabs: Billing & Sales */}
      {selectedReportType === 'billing_sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Total Bills Issued</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{billingTotals.totalBills} Bills</div>
              <p className="text-[11px] text-slate-400 mt-0.5">In selected period ({period})</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Total Invoiced Revenue</span>
              </div>
              <div className="text-xl font-bold text-blue-700">
                {currSym} {billingTotals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Net bill receivables</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Amount Collected</span>
              </div>
              <div className="text-xl font-bold text-emerald-700">
                {currSym} {billingTotals.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Paid by customers</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span>Pending Balance Due</span>
              </div>
              <div className="text-xl font-bold text-rose-700">
                {currSym} {billingTotals.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Outstanding from bills</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setBillingSubTab('bills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${billingSubTab === 'bills'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Bills List ({filteredInvoices.length})</span>
            </button>

            <button
              onClick={() => setBillingSubTab('party_summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${billingSubTab === 'party_summary'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Party-Wise Summary({partyWiseBilling.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. KPI Cards & Subtabs: Supplier Report */}
      {selectedReportType === 'supplier' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Total Suppliers</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{supplierTotals.totalSuppliers} Vendors</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Active supplier ledgers</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Total Purchases</span>
              </div>
              <div className="text-xl font-bold text-blue-700">
                {currSym} {supplierTotals.totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Total material purchased</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Total Paid to Suppliers</span>
              </div>
              <div className="text-xl font-bold text-emerald-700">
                {currSym} {supplierTotals.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Payments cleared</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Current Accounts Payable</span>
              </div>
              <div className="text-xl font-bold text-rose-700">
                {currSym} {supplierTotals.currentDues.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Outstanding supplier dues</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setSupplierSubTab('profiles')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${supplierSubTab === 'profiles'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Supplier Accounts & Payables ({filteredSuppliers.length})</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('bills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${supplierSubTab === 'bills'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Supplier Bills in {period.toUpperCase()} ({filteredSupplierBills.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. KPI Cards: Wadding Report */}
      {selectedReportType === 'wadding' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span>Total Purchased Wadding</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {waddingTotals.totalPurchased.toLocaleString()} kg
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{waddingTotals.itemsCount} fiber lots in system</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
              <span>Total Wadding Consumed</span>
            </div>
            <div className="text-xl font-bold text-amber-700">
              {waddingTotals.used.toLocaleString()} kg
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Used in quilts & manufacturing</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>Available Wadding Stock</span>
            </div>
            <div className="text-xl font-bold text-emerald-700">
              {waddingTotals.available.toLocaleString()} kg
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Ready for stitching/filling</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium mb-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Wadding Stock Valuation</span>
            </div>
            <div className="text-xl font-bold text-blue-700">
              {currSym} {waddingTotals.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Estimated inventory value</p>
          </div>
        </div>
      )}

      {/* Dynamic Report Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="capitalize text-slate-900 font-bold text-sm">
              {selectedReportType === 'daily_cutting' && 'Daily Cutting Log & Detailed Fabric Consumption'}
              {selectedReportType === 'production' && 'Daily Production Log (Kya Kya Cheez Kis Din Bani)'}
              {selectedReportType === 'billing_sales' &&
                (billingSubTab === 'bills'
                  ? `Billing Invoices Issued in ${period.toUpperCase()}`
                  : `Customer / Party Billing Breakdown in ${period.toUpperCase()}`)}
              {selectedReportType === 'supplier' &&
                (supplierSubTab === 'profiles'
                  ? 'Supplier Ledger Accounts & Current Payables'
                  : `Supplier Bills Issued in ${period.toUpperCase()}`)}
              {selectedReportType === 'wadding' && 'Quilt Wadding Stock & Inventory Fiber Breakdown'}
              {selectedReportType === 'lots' && 'Raw Material Lots & Fabric Designs'}
              {selectedReportType === 'product_stock' && 'Finished Products Stock Inventory'}
            </span>
            <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded font-semibold border border-indigo-200 uppercase">
              Filter: {period === 'daily' ? customDate : period}
            </span>
          </div>

          {/* Search bar inside Report Table */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search in report records..."
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
          {/* 1. Daily Cutting Report */}
          {selectedReportType === 'daily_cutting' && (
            filteredCutting.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No cutting log records found for the selected period ({period === 'daily' ? customDate : period}).
              </div>
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
                    <th className="py-3 px-4 text-right font-extrabold">Total Fabric</th>
                    <th className="py-3 px-4 text-right text-amber-700">Wadding Used</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCutting.map((r) => {
                    const waddingKg = r.waddingUsedKg || (r.waddingKgPerPiece ? r.waddingKgPerPiece * r.quantityCut : 0);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{r.date}</td>
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
                        <td className="py-3 px-4 text-right font-bold text-amber-700">
                          {waddingKg > 0 ? `${waddingKg.toFixed(2)} kg` : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">{r.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={4} className="py-3 px-4 text-right uppercase">Period Totals:</td>
                    <td className="py-3 px-4 text-center font-extrabold text-emerald-700">{cuttingTotals.pieces} pcs</td>
                    <td className="py-3 px-4 text-right text-blue-700">{cuttingTotals.front.toLocaleString()} m</td>
                    <td className="py-3 px-4 text-right text-purple-700">{cuttingTotals.reverse.toLocaleString()} m</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">{cuttingTotals.totalMeters.toLocaleString()} m</td>
                    <td className="py-3 px-4 text-right text-amber-700">{cuttingTotals.waddingKg.toFixed(2)} kg</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )
          )}

          {/* 2. Daily Production Report */}
          {selectedReportType === 'production' && (
            filteredProduction.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No daily production records found for the selected period ({period === 'daily' ? customDate : period}).
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Date Made</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category / Sub-Category</th>
                    <th className="py-3 px-4">Design #</th>
                    <th className="py-3 px-4 text-center">Qty Made</th>
                    <th className="py-3 px-4 text-right text-indigo-700">Wadding Deducted</th>
                    <th className="py-3 px-4 text-center text-amber-700">Packaging Bags</th>
                    <th className="py-3 px-4 text-center text-purple-700">Stiffeners / Cards</th>
                    <th className="py-3 px-4">Operator / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProduction.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{p.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.productName}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {p.productCategory} {p.productSubCategory ? `(${p.productSubCategory})` : ''}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700">{p.designNumber}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-emerald-700 bg-emerald-50/50">
                        {p.quantityProduced} pcs
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700">
                        {p.waddingUsedKg ? `${p.waddingUsedKg.toFixed(2)} kg` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-amber-700">
                        {(p.quiltBagsUsed || 0) + (p.polybagsUsed || 0)} bags
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-purple-700">
                        {p.stiffenersUsed || 0} stf / {p.cardsUsed || 0} crd
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {p.operatorName ? <span className="font-semibold text-slate-700">{p.operatorName}: </span> : ''}
                        {p.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={4} className="py-3 px-4 text-right uppercase">Production Totals:</td>
                    <td className="py-3 px-4 text-center font-extrabold text-emerald-700">{productionTotals.totalQty} pcs</td>
                    <td className="py-3 px-4 text-right text-indigo-700">{productionTotals.waddingKg.toFixed(2)} kg</td>
                    <td className="py-3 px-4 text-center text-amber-700">{productionTotals.quiltBags + productionTotals.polybags} bags</td>
                    <td className="py-3 px-4 text-center text-purple-700">{productionTotals.stiffeners} stf / {productionTotals.cards} crd</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )
          )}

          {/* 3. Billing & Sales Report */}
          {selectedReportType === 'billing_sales' && (
            billingSubTab === 'bills' ? (
              filteredInvoices.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No invoice records match your search or date filter ({period === 'daily' ? customDate : period}).
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Bill #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Party / Customer (Recipient)</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">Discount</th>
                      <th className="py-3 px-4 text-right font-extrabold">Net Bill Total</th>
                      <th className="py-3 px-4 text-right text-emerald-700">Amount Paid</th>
                      <th className="py-3 px-4 text-right text-rose-700 font-bold">Balance Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-indigo-700 whitespace-nowrap">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{inv.date}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{inv.partyName}</div>
                          {inv.partyPhone && <div className="text-[10px] text-slate-400">{inv.partyPhone}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs">
                          {inv.items && inv.items.length > 0 ? (
                            <span title={inv.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}>
                              {inv.items[0].productName} ({inv.items[0].quantity}x)
                              {inv.items.length > 1 ? ` +${inv.items.length - 1} more` : ''}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 font-medium">
                          {inv.currencySymbol || currSym} {inv.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-700 font-medium">
                          {inv.discountAmount > 0 ? `${inv.currencySymbol || currSym} ${inv.discountAmount.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50">
                          {inv.currencySymbol || currSym} {inv.grandTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {inv.currencySymbol || currSym} {inv.amountPaid.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700">
                          {inv.balanceDue > 0 ? `${inv.currencySymbol || currSym} ${inv.balanceDue.toFixed(2)}` : 'Rs 0.00'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                              }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={4} className="py-3 px-4 text-right uppercase">Period Totals ({filteredInvoices.length} Bills):</td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {currSym} {filteredInvoices.reduce((acc, i) => acc + i.subtotal, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-700">
                        {currSym} {filteredInvoices.reduce((acc, i) => acc + i.discountAmount, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {currSym} {billingTotals.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700">
                        {currSym} {billingTotals.amountPaid.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700">
                        {currSym} {billingTotals.balanceDue.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )
            ) : (
              partyWiseBilling.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No party billing records found for the selected period ({period === 'daily' ? customDate : period}).
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Customer / Party Name</th>
                      <th className="py-3 px-4 text-center">Bills Sent</th>
                      <th className="py-3 px-4">Invoice Numbers</th>
                      <th className="py-3 px-4 text-right font-extrabold">Total Billed Amount</th>
                      <th className="py-3 px-4 text-right text-emerald-700">Total Paid</th>
                      <th className="py-3 px-4 text-right text-rose-700 font-bold">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partyWiseBilling.map((pw, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                          <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{pw.partyName}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-700">
                          <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {pw.billsCount} bill{pw.billsCount > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {pw.invoices.slice(0, 4).join(', ')}
                          {pw.invoices.length > 4 ? ` +${pw.invoices.length - 4} more` : ''}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50">
                          {currSym} {pw.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {currSym} {pw.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700">
                          {pw.balanceDue > 0
                            ? `${currSym} ${pw.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                            : 'Rs 0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td className="py-3 px-4 uppercase">Total ({partyWiseBilling.length} Parties):</td>
                      <td className="py-3 px-4 text-center font-extrabold text-indigo-700">{billingTotals.totalBills} bills</td>
                      <td></td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {currSym} {billingTotals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700">
                        {currSym} {billingTotals.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700">
                        {currSym} {billingTotals.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )
            )
          )}

          {/* 4. Supplier Report */}
          {selectedReportType === 'supplier' && (
            supplierSubTab === 'profiles' ? (
              filteredSuppliers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No supplier accounts found matching your query.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Supplier Name</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">City</th>
                      <th className="py-3 px-4 text-right">Total Purchases</th>
                      <th className="py-3 px-4 text-right text-emerald-700">Total Paid</th>
                      <th className="py-3 px-4 text-right font-extrabold text-rose-700">Current Dues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                          <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{s.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{s.companyName || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold uppercase">
                            {s.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{s.phone || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">{s.city || '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">
                          {currSym} {(s.totalPurchases || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {currSym} {(s.totalPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-rose-700 bg-rose-50/40">
                          {currSym} {(s.currentDues || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={5} className="py-3 px-4 uppercase">Overall Supplier Totals:</td>
                      <td className="py-3 px-4 text-right">
                        {currSym} {supplierTotals.totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700">
                        {currSym} {supplierTotals.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700">
                        {currSym} {supplierTotals.currentDues.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )
            ) : (
              filteredSupplierBills.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No supplier bills found in the selected period ({period === 'daily' ? customDate : period}).
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Bill #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Supplier Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Item Description</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-right text-emerald-700">Paid</th>
                      <th className="py-3 px-4 text-right font-extrabold text-rose-700">Balance Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSupplierBills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-indigo-700">{b.billNumber}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{b.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{b.supplierName}</td>
                        <td className="py-3 px-4 text-slate-600 capitalize">{b.category?.replace('_', ' ')}</td>
                        <td className="py-3 px-4 text-slate-700 text-[11px] max-w-xs truncate">{b.itemDescription}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {currSym} {(b.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {currSym} {(b.amountPaid || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700">
                          {currSym} {(b.balanceDue || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.paymentStatus === 'Partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                              }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={5} className="py-3 px-4 uppercase">Period Bills Total:</td>
                      <td className="py-3 px-4 text-right">
                        {currSym} {supplierTotals.billsInPeriodAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700">
                        {currSym} {supplierTotals.billsInPeriodPaid.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700">
                        {currSym} {supplierTotals.billsInPeriodDue.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )
            )
          )}

          {/* 5. Wadding Report */}
          {selectedReportType === 'wadding' && (
            waddingItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No wadding fiber stock records found.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Wadding Fiber Type</th>
                    <th className="py-3 px-4 text-center">GSM</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Lot #</th>
                    <th className="py-3 px-4 text-right">Rate / Kg</th>
                    <th className="py-3 px-4 text-right">Purchased</th>
                    <th className="py-3 px-4 text-right text-amber-700">Used (Kg)</th>
                    <th className="py-3 px-4 text-right font-extrabold text-emerald-700">Available (Kg)</th>
                    <th className="py-3 px-4 text-center">Specs (Single / Double)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waddingItems.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{w.type}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{w.gsm} GSM</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{w.supplierName || 'Factory'}</td>
                      <td className="py-3 px-4 font-mono text-indigo-700">{w.lotNumber || '-'}</td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {w.ratePerKg ? `${currSym} ${w.ratePerKg.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">{w.totalPurchasedKg || 0} kg</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">{w.usedKg || 0} kg</td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-700 bg-emerald-50/50">
                        {w.availableKg || 0} kg
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 text-[11px]">
                        Single: <span className="font-bold">{w.singleQuiltSpecKg || 0}kg</span> | Double: <span className="font-bold">{w.doubleQuiltSpecKg || 0}kg</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(w.availableKg || 0) > 50
                            ? 'bg-emerald-100 text-emerald-800'
                            : (w.availableKg || 0) > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                            }`}
                        >
                          {(w.availableKg || 0) > 50 ? 'In Stock' : (w.availableKg || 0) > 0 ? 'Low Stock' : 'Depleted'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={5} className="py-3 px-4 uppercase">Wadding Stock Totals:</td>
                    <td className="py-3 px-4 text-right">{waddingTotals.totalPurchased.toLocaleString()} kg</td>
                    <td className="py-3 px-4 text-right text-amber-700">{waddingTotals.used.toLocaleString()} kg</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-extrabold">{waddingTotals.available.toLocaleString()} kg</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )
          )}

          {/* 6. Fabric Lots Report */}
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
                    l.designs?.forEach((d) => {
                      front += d.frontMeters || 0;
                      reverse += d.reverseMeters || 0;
                    });
                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-indigo-700">{l.lotNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{l.supplierName}</td>
                        <td className="py-3 px-4 text-slate-500">{l.dateReceived}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{l.designs?.length || 0}</td>
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

          {/* 7. Product Stock Report */}
          {selectedReportType === 'product_stock' && (
            filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No product inventory matches your search.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
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
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={3} className="py-3 px-4 uppercase">Total Products ({filteredProducts.length} Items):</td>
                    <td className="py-3 px-4 text-center font-extrabold text-indigo-700">
                      {filteredProducts.reduce((sum, p) => sum + p.stockQuantity, 0)} units
                    </td>
                    <td></td>
                    <td></td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {currSym} {filteredProducts.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
};

