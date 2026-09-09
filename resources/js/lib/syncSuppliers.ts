import {
  FabricLot,
  FabricDesign,
  WaddingStock,
  RawMaterialStockItem,
  SupplierProfile,
  SupplierBill,
  SupplierPayment,
  SupplierCategory,
} from '../types';
import { getDesignTotalMeters } from './storage';

export function syncSupplierLedgers(
  lots: FabricLot[] = [],
  wadding?: WaddingStock,
  rawMaterials: RawMaterialStockItem[] = [],
  existingSuppliers: SupplierProfile[] = [],
  existingBills: SupplierBill[] = [],
  existingPayments: SupplierPayment[] = []
): {
  syncedSuppliers: SupplierProfile[];
  syncedBills: SupplierBill[];
  syncedPayments: SupplierPayment[];
} {
  const autoBills: SupplierBill[] = [];
  const autoPayments: SupplierPayment[] = [];

  // 1. Process Fabric Lots
  lots.forEach((lot) => {
    const rawSup = (lot.supplierName || '').trim();
    if (!rawSup) return;

    const designs: FabricDesign[] = lot.designs || [];
    const totalMeters = designs.reduce((sum, d) => sum + getDesignTotalMeters(d), 0);
    const rate = Number(lot.ratePerMeter) || 0;
    const totalCost = rate > 0
      ? totalMeters * rate
      : (lot.totalCost !== undefined && lot.totalCost > 0 ? Number(lot.totalCost) : 0);
    const amountPaid = Number(lot.amountPaid || 0);
    const balanceDue = Math.max(0, totalCost - amountPaid);
    const paymentStatus: 'Paid' | 'Partial' | 'Unpaid' =
      totalCost > 0 && amountPaid >= totalCost ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

    const designNames = designs
      .map((d) => d.designName || d.designNumber)
      .filter(Boolean)
      .join(', ');
    const desc = `Fabric Lot #${lot.lotNumber}${designNames ? ` (${designNames})` : ''} - ${totalMeters.toLocaleString()} Mtr`;

    const billId = `bill-lot-${lot.id}`;
    autoBills.push({
      id: billId,
      supplierName: rawSup,
      supplierAddress: lot.supplierAddress || '',
      category: 'fabric',
      billNumber: lot.lotNumber || `LOT-${lot.id}`,
      date: lot.dateReceived || new Date().toISOString().split('T')[0],
      itemDescription: desc,
      quantity: totalMeters,
      unit: 'meters',
      ratePerUnit: rate || (totalMeters > 0 ? totalCost / totalMeters : 0),
      totalAmount: totalCost,
      amountPaid: amountPaid,
      balanceDue: balanceDue,
      paymentStatus: paymentStatus,
      paymentNotes: lot.paymentNotes || '',
      sourceType: 'fabric_lot',
      sourceId: lot.id,
    });

    if (amountPaid > 0) {
      autoPayments.push({
        id: `pay-lot-${lot.id}`,
        supplierName: rawSup,
        supplierAddress: lot.supplierAddress || '',
        billId: billId,
        billNumber: lot.lotNumber || `LOT-${lot.id}`,
        date: lot.dateReceived || new Date().toISOString().split('T')[0],
        amount: amountPaid,
        paymentMethod: 'Cash',
        referenceNo: `LOT-${lot.lotNumber}`,
        notes: lot.paymentNotes ? `Payment: ${lot.paymentNotes}` : `Initial payment for Fabric Lot #${lot.lotNumber}`,
      });
    }
  });

  // 2. Process Wadding Items
  const waddingItems = wadding?.items || [];
  waddingItems.forEach((item) => {
    const rawSup = (item.supplierName || '').trim();
    if (!rawSup) return;

    const totalKg = Number(item.totalPurchasedKg || item.availableKg || 0);
    const rate = Number(item.ratePerKg) || 0;
    const totalCost = rate > 0
      ? totalKg * rate
      : (item.totalCost !== undefined && item.totalCost > 0 ? Number(item.totalCost) : 0);
    const amountPaid = Number(item.amountPaid || 0);
    const balanceDue = Math.max(0, totalCost - amountPaid);
    const paymentStatus: 'Paid' | 'Partial' | 'Unpaid' =
      totalCost > 0 && amountPaid >= totalCost ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

    const billId = `bill-wad-${item.id}`;
    autoBills.push({
      id: billId,
      supplierName: rawSup,
      supplierAddress: item.supplierAddress || '',
      category: 'wadding',
      billNumber: item.lotNumber || `WAD-${item.id}`,
      date: new Date().toISOString().split('T')[0],
      itemDescription: `${item.gsm || 200} GSM ${item.type || 'Wadding Fiber'} (${totalKg.toLocaleString()} Kg)`,
      quantity: totalKg,
      unit: 'kg',
      ratePerUnit: rate || 0,
      totalAmount: totalCost,
      amountPaid: amountPaid,
      balanceDue: balanceDue,
      paymentStatus: paymentStatus,
      paymentNotes: item.paymentNotes || '',
      sourceType: 'wadding_item',
      sourceId: item.id,
    });

    if (amountPaid > 0) {
      autoPayments.push({
        id: `pay-wad-${item.id}`,
        supplierName: rawSup,
        supplierAddress: item.supplierAddress || '',
        billId: billId,
        billNumber: item.lotNumber || `WAD-${item.id}`,
        date: new Date().toISOString().split('T')[0],
        amount: amountPaid,
        paymentMethod: 'Cash',
        referenceNo: `WAD-${item.lotNumber || item.id}`,
        notes: item.paymentNotes ? `Payment: ${item.paymentNotes}` : `Payment for Wadding Lot #${item.lotNumber}`,
      });
    }
  });

  // 3. Process Raw Materials / Packaging
  rawMaterials.forEach((rm) => {
    const rawSup = (rm.supplierName || '').trim();
    if (!rawSup) return;

    const totalQty = Number(rm.totalPurchasedQty || rm.quantityInStock || 0);
    const unitCost = Number(rm.costPerUnit) || 0;
    const totalCost = unitCost > 0
      ? totalQty * unitCost
      : (rm.totalCost !== undefined && rm.totalCost > 0 ? Number(rm.totalCost) : 0);
    const amountPaid = Number(rm.amountPaid || 0);
    const balanceDue = Math.max(0, totalCost - amountPaid);
    const paymentStatus: 'Paid' | 'Partial' | 'Unpaid' =
      totalCost > 0 && amountPaid >= totalCost ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

    let cat: SupplierCategory = 'general';
    const catLower = (rm.category || '').toLowerCase();
    if (['quilt_bag', 'comforter_bag', 'polybag', 'carton_box', 'bags'].includes(catLower) || catLower.includes('bag')) {
      cat = 'packaging_bags';
    } else if (['stiffener', 'label_tag', 'design_card', 'label', 'stiffner', 'cards'].includes(catLower) || catLower.includes('label') || catLower.includes('stiff') || catLower.includes('card')) {
      cat = 'stiffener_labels';
    } else if (['zipper', 'button', 'clip_pin', 'ribbon'].includes(catLower) || catLower.includes('zipper') || catLower.includes('button')) {
      cat = 'zipper_buttons';
    }

    const billId = `bill-rm-${rm.id}`;
    autoBills.push({
      id: billId,
      supplierName: rawSup,
      supplierAddress: rm.supplierAddress || '',
      category: cat,
      billNumber: rm.lotNumber || `RM-${rm.id}`,
      date: new Date().toISOString().split('T')[0],
      itemDescription: `${rm.name} (${totalQty.toLocaleString()} ${rm.unit || 'pcs'})`,
      quantity: totalQty,
      unit: rm.unit || 'pcs',
      ratePerUnit: rm.costPerUnit || 0,
      totalAmount: totalCost,
      amountPaid: amountPaid,
      balanceDue: balanceDue,
      paymentStatus: paymentStatus,
      paymentNotes: rm.paymentNotes || '',
      sourceType: 'raw_material',
      sourceId: rm.id,
    });

    if (amountPaid > 0) {
      autoPayments.push({
        id: `pay-rm-${rm.id}`,
        supplierName: rawSup,
        supplierAddress: rm.supplierAddress || '',
        billId: billId,
        billNumber: rm.lotNumber || `RM-${rm.id}`,
        date: new Date().toISOString().split('T')[0],
        amount: amountPaid,
        paymentMethod: 'Cash',
        referenceNo: `RM-${rm.id}`,
        notes: rm.paymentNotes ? `Payment: ${rm.paymentNotes}` : `Payment for Raw Material ${rm.name}`,
      });
    }
  });

  // 4. Preserve Manual Bills & Manual Payments
  const manualBills = existingBills.filter(
    (b) => !b.sourceType || b.sourceType === 'manual_bill' || (!b.sourceId && !b.id.startsWith('bill-'))
  );
  const manualPayments = existingPayments.filter(
    (p) =>
      !p.id.startsWith('pay-lot-') &&
      !p.id.startsWith('pay-wad-') &&
      !p.id.startsWith('pay-rm-')
  );

  const syncedBills = [...autoBills, ...manualBills];
  const syncedPayments = [...autoPayments, ...manualPayments];

  // 5. Build/Update Supplier Profiles
  const supplierMap = new Map<string, SupplierProfile>();

  // Initialize with existing supplier profiles
  existingSuppliers.forEach((sup) => {
    const key = sup.name.trim().toLowerCase();
    if (key) {
      supplierMap.set(key, { ...sup });
    }
  });

  // Collect all suppliers from synced bills & payments
  syncedBills.forEach((bill) => {
    const key = bill.supplierName.trim().toLowerCase();
    if (!key) return;

    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: bill.supplierName.trim(),
        companyName: bill.supplierName.trim(),
        phone: bill.supplierPhone || '+92 ',
        city: 'Faisalabad',
        address: bill.supplierAddress || '',
        category: bill.category || 'fabric',
        totalPurchases: 0,
        totalPaid: 0,
        currentDues: 0,
        createdAt: bill.date || new Date().toISOString().split('T')[0],
      });
    } else {
      const existing = supplierMap.get(key)!;
      if (!existing.address && bill.supplierAddress) {
        existing.address = bill.supplierAddress;
      }
    }
  });

  syncedPayments.forEach((pay) => {
    const key = pay.supplierName.trim().toLowerCase();
    if (!key) return;

    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: pay.supplierName.trim(),
        companyName: pay.supplierName.trim(),
        phone: '+92 ',
        city: 'Faisalabad',
        address: pay.supplierAddress || '',
        category: 'fabric',
        totalPurchases: 0,
        totalPaid: 0,
        currentDues: 0,
        createdAt: pay.date || new Date().toISOString().split('T')[0],
      });
    } else {
      const existing = supplierMap.get(key)!;
      if (!existing.address && pay.supplierAddress) {
        existing.address = pay.supplierAddress;
      }
    }
  });

  // Recalculate totals for each supplier
  const syncedSuppliers = Array.from(supplierMap.values()).map((sup) => {
    const key = sup.name.trim().toLowerCase();
    const supBills = syncedBills.filter((b) => b.supplierName.trim().toLowerCase() === key);
    const supPayments = syncedPayments.filter((p) => p.supplierName.trim().toLowerCase() === key);

    const totalPurchases = supBills.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const totalPaid = supPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const currentDues = Math.max(0, totalPurchases - totalPaid);

    // If category wasn't set, inherit from latest bill
    const primaryCat = supBills[0]?.category || sup.category || 'fabric';

    return {
      ...sup,
      category: primaryCat,
      totalPurchases,
      totalPaid,
      currentDues,
    };
  });

  return {
    syncedSuppliers,
    syncedBills,
    syncedPayments,
  };
}
