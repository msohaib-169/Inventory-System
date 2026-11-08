import {
  FabricDesign,
} from '../types';

export function getDesignTotalMeters(d: FabricDesign): number {
  if (d.fabricType === 'single_roll' || d.fabricType === 'other') {
    return Number(d.totalMeters || 0);
  }
  if (d.totalMeters !== undefined && d.totalMeters > 0 && d.frontMeters === 0 && d.reverseMeters === 0) {
    return Number(d.totalMeters);
  }
  return Number(d.frontMeters || 0) + Number(d.reverseMeters || 0);
}

const STORAGE_KEYS = {
  LOTS: 'textile_erp_lots_v1',
  FABRIC_LOSSES: 'textile_erp_fabric_losses_v1',
  WADDING: 'textile_erp_wadding_v1',
  RAW_MATERIALS: 'textile_erp_raw_materials_v1',
  CUTTING: 'textile_erp_cutting_v1',
  CUT_PIECES: 'textile_erp_cut_pieces_v1',
  PRODUCTION: 'textile_erp_production_v1',
  PRODUCTS: 'textile_erp_products_v1',
  PARTIES: 'textile_erp_parties_v1',
  PAYMENTS: 'textile_erp_payments_v1',
  INVOICES: 'textile_erp_invoices_v1',
  SUPPLIERS: 'textile_erp_suppliers_v1',
  SUPPLIER_BILLS: 'textile_erp_supplier_bills_v1',
  SUPPLIER_PAYMENTS: 'textile_erp_supplier_payments_v1',
  PACKAGING_HIERARCHY: 'textile_erp_packaging_hierarchy_v1',
  PRODUCT_HIERARCHY: 'textile_erp_product_hierarchy_v1',
};

// Helper Storage Getters & Setters
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const ERPStorage = {
  getPackagingHierarchy: (): Record<string, string[]> => getItem(STORAGE_KEYS.PACKAGING_HIERARCHY, {}),
  savePackagingHierarchy: (hierarchy: Record<string, string[]>) => setItem(STORAGE_KEYS.PACKAGING_HIERARCHY, hierarchy),

  getProductHierarchy: (): Record<string, string[]> => getItem(STORAGE_KEYS.PRODUCT_HIERARCHY, {}),
  saveProductHierarchy: (hierarchy: Record<string, string[]>) => setItem(STORAGE_KEYS.PRODUCT_HIERARCHY, hierarchy),

  clearAllData: () => {
    [
      STORAGE_KEYS.LOTS,
      STORAGE_KEYS.FABRIC_LOSSES,
      STORAGE_KEYS.WADDING,
      STORAGE_KEYS.RAW_MATERIALS,
      STORAGE_KEYS.CUTTING,
      STORAGE_KEYS.CUT_PIECES,
      STORAGE_KEYS.PRODUCTION,
      STORAGE_KEYS.PRODUCTS,
      STORAGE_KEYS.PARTIES,
      STORAGE_KEYS.PAYMENTS,
      STORAGE_KEYS.INVOICES,
      STORAGE_KEYS.SUPPLIERS,
      STORAGE_KEYS.SUPPLIER_BILLS,
      STORAGE_KEYS.SUPPLIER_PAYMENTS,
    ].forEach((key) => localStorage.removeItem(key));
  },

};
