import axios from 'axios';
import {
  FabricLot,
  FabricLossRecord,
  WaddingStock,
  RawMaterialStockItem,
  CuttingRecord,
  CutPieceStockItem,
  ProductionRecord,
  FinishedProduct,
  Party,
  PaymentTransaction,
  Invoice,
  SupplierProfile,
  SupplierBill,
  SupplierPayment,
} from '../types';

const API_BASE = '/api/erp';

export const ERPAPI = {
  async fetchLots(): Promise<FabricLot[]> {
    const res = await axios.get(`${API_BASE}/lots`);
    return res.data;
  },

  async saveLots(lots: FabricLot[]): Promise<FabricLot[]> {
    const res = await axios.post(`${API_BASE}/lots/sync`, { lots });
    return res.data;
  },

  async fetchFabricLosses(): Promise<FabricLossRecord[]> {
    const res = await axios.get(`${API_BASE}/fabric-losses`);
    return res.data;
  },

  async saveFabricLosses(records: FabricLossRecord[]): Promise<FabricLossRecord[]> {
    const res = await axios.post(`${API_BASE}/fabric-losses/sync`, { records });
    return res.data;
  },

  async fetchWadding(): Promise<WaddingStock> {
    const res = await axios.get(`${API_BASE}/wadding`);
    return res.data;
  },

  async saveWadding(wadding: WaddingStock): Promise<WaddingStock> {
    const res = await axios.post(`${API_BASE}/wadding/sync`, { wadding });
    return res.data;
  },

  async fetchRawMaterials(): Promise<RawMaterialStockItem[]> {
    const res = await axios.get(`${API_BASE}/raw-materials`);
    return res.data;
  },

  async saveRawMaterials(rawMaterials: RawMaterialStockItem[]): Promise<RawMaterialStockItem[]> {
    const res = await axios.post(`${API_BASE}/raw-materials/sync`, { rawMaterials });
    return res.data;
  },

  async fetchCuttingRecords(): Promise<CuttingRecord[]> {
    const res = await axios.get(`${API_BASE}/cutting-records`);
    return res.data;
  },

  async fetchCutPiecesStock(): Promise<CutPieceStockItem[]> {
    const res = await axios.get(`${API_BASE}/cut-pieces`);
    return res.data;
  },

  async saveCuttingData(
    cuttingRecords: CuttingRecord[],
    cutPiecesStock: CutPieceStockItem[]
  ): Promise<{ cuttingRecords: CuttingRecord[]; cutPiecesStock: CutPieceStockItem[] }> {
    const res = await axios.post(`${API_BASE}/cutting/sync`, {
      cuttingRecords,
      cutPiecesStock,
    });
    return res.data;
  },

  async fetchProductionRecords(): Promise<ProductionRecord[]> {
    const res = await axios.get(`${API_BASE}/production`);
    return res.data;
  },

  async saveProductionRecords(records: ProductionRecord[]): Promise<ProductionRecord[]> {
    const res = await axios.post(`${API_BASE}/production/sync`, { productionRecords: records });
    return res.data;
  },

  async fetchProducts(): Promise<FinishedProduct[]> {
    const res = await axios.get(`${API_BASE}/products`);
    return res.data;
  },

  async saveProducts(products: FinishedProduct[]): Promise<FinishedProduct[]> {
    const res = await axios.post(`${API_BASE}/products/sync`, { products });
    return res.data;
  },

  async fetchParties(): Promise<Party[]> {
    const res = await axios.get(`${API_BASE}/parties`);
    return res.data;
  },

  async saveParties(parties: Party[]): Promise<Party[]> {
    const res = await axios.post(`${API_BASE}/parties/sync`, { parties });
    return res.data;
  },

  async fetchPayments(): Promise<PaymentTransaction[]> {
    const res = await axios.get(`${API_BASE}/payments`);
    return res.data;
  },

  async savePayments(payments: PaymentTransaction[]): Promise<PaymentTransaction[]> {
    const res = await axios.post(`${API_BASE}/payments/sync`, { payments });
    return res.data;
  },

  async fetchInvoices(): Promise<Invoice[]> {
    const res = await axios.get(`${API_BASE}/invoices`);
    return res.data;
  },

  async saveInvoices(invoices: Invoice[]): Promise<Invoice[]> {
    const res = await axios.post(`${API_BASE}/invoices/sync`, { invoices });
    return res.data;
  },

  async updateInvoice(invoiceId: string | number, invoice: Invoice): Promise<Invoice> {
    const res = await axios.put(`${API_BASE}/invoices/${invoiceId}`, invoice);
    return res.data;
  },

  async fetchSuppliers(): Promise<{ suppliers: SupplierProfile[]; bills: SupplierBill[]; payments: SupplierPayment[] }> {
    const res = await axios.get(`${API_BASE}/suppliers`);
    return res.data;
  },

  async saveSuppliers(
    suppliers: SupplierProfile[],
    bills: SupplierBill[],
    payments: SupplierPayment[]
  ): Promise<{ suppliers: SupplierProfile[]; bills: SupplierBill[]; payments: SupplierPayment[] }> {
    const res = await axios.post(`${API_BASE}/suppliers/sync`, { suppliers, bills, payments });
    return res.data;
  },

  async clearAllData(): Promise<void> {
    await axios.post(`${API_BASE}/reset/clear`);
  },

  async resetToDefault(): Promise<void> {
    await axios.post(`${API_BASE}/reset/default`);
  },
};
