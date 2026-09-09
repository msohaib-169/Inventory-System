export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee (PKR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal (SAR)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
];

export type FabricTypeCategory = 'bedsheet_set' | 'other' | 'quilting_fabric' | 'single_roll';

export interface FabricDesign {
  id: string;
  designNumber: string;
  designName: string;
  frontMeters: number;
  reverseMeters: number;
  fabricType?: FabricTypeCategory; // 'bedsheet_set' (Front + Rev) | 'other' (Custom Fabric Name & Total Meters)
  totalMeters?: number; // Total fabric meters for 'other'
  customFabricName?: string;
}

export interface FabricLossRecord {
  id: string;
  date: string;
  lotId?: string;
  lotNumber: string;
  designNumber?: string;
  designName?: string;
  category: 'Loss Fabric' | 'Given to Customer (Sample / Loss)' | 'Cutting Scrap & Waste' | 'Defect / Quality Damage' | 'Other Loss';
  partyId?: string;
  partyName?: string;
  frontMeters?: number;
  reverseMeters?: number;
  metersLost: number;
  ratePerMeter?: number;
  notes?: string;
  billed?: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface FabricLot {
  id: string;
  lotNumber: string;
  supplierName: string;
  supplierAddress?: string;
  dateReceived: string;
  designs: FabricDesign[];
  ratePerMeter?: number; // Purchase price / rate per meter
  totalCost?: number; // Total purchase cost of the lot
  amountPaid?: number; // Payment made to supplier
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid';
  paymentNotes?: string;
  notes?: string;
}

export interface WaddingItem {
  id: string;
  type: string; // e.g. "Siliconized Polyester Fiber", "Microfiber Soft Wadding", "Thermal Bonded Fiber"
  gsm: number;  // e.g. 100, 150, 180, 200, 250, 300, 350, 400
  supplierName?: string;
  supplierAddress?: string;
  lotNumber?: string;
  ratePerKg?: number; // Cost of wadding per Kg (e.g. 350 Rs/Kg)
  totalCost?: number; // Total purchase cost (totalPurchasedKg * ratePerKg)
  amountPaid?: number; // Payment made to supplier
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid';
  paymentNotes?: string;
  availableKg: number;
  totalPurchasedKg: number;
  usedKg: number;
  singleQuiltSpecKg: number; // kg wadding per single quilt
  doubleQuiltSpecKg: number; // kg wadding per double quilt
  gaddaSpecKg?: number; // kg wadding per gadda mattress
  singleQuiltFabricMeters?: number; // fabric meters per single quilt (e.g. 2.5m)
  doubleQuiltFabricMeters?: number; // fabric meters per double quilt (e.g. 4.2m)
  gaddaFabricMeters?: number; // fabric meters per gadda mattress (e.g. 3.5m)
  fabricRatePerMeter?: number; // fabric cost per meter (e.g. 120 Rs/m)
  notes?: string;
}

export interface WaddingStock {
  totalPurchasedKg: number;
  usedKg: number;
  availableKg: number;
  singleQuiltSpecKg: number; // kg per single quilt (default fallback)
  doubleQuiltSpecKg: number; // kg per double quilt (default fallback)
  gaddaSpecKg?: number; // kg per gadda mattress
  items?: WaddingItem[];
}

export type RawMaterialCategory =
  | 'stiffener'
  | 'polybag'
  | 'design_card'
  | 'quilt_bag'
  | 'comforter_bag'
  | 'button'
  | 'zipper'
  | 'ribbon'
  | 'label_tag'
  | 'carton_box'
  | 'clip_pin'
  | 'other';

export interface RawMaterialStockItem {
  id: string;
  name: string;
  category: RawMaterialCategory | string;
  subCategory?: string; // Sub-category (e.g., "Label 1", "Bag 1", "Stiffner 2", "Cards 1")
  customCategoryName?: string; // For user-created custom accessory option
  designCardFor?: string; // e.g. "ZF 1089"
  cardDesigns?: string[]; // Multiple designs for cards (e.g. ["ZF 1089", "ZF 1090"])
  bagType?: 'single_quilt' | 'double_quilt' | 'comforter' | 'general';
  quantityInStock: number;
  unit: string;
  reorderLevel: number;
  costPerUnit: number;
  supplierName?: string;
  supplierAddress?: string;
  lotNumber?: string;
  totalPurchasedQty?: number;
  totalCost?: number;
  amountPaid?: number;
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid';
  paymentNotes?: string;
  notes?: string;
}

export type SupplierCategory =
  | 'fabric'
  | 'wadding'
  | 'packaging_bags'
  | 'stiffener_labels'
  | 'zipper_buttons'
  | 'general';

export interface SupplierBill {
  id: string;
  supplierName: string;
  supplierPhone?: string;
  supplierAddress?: string;
  category: SupplierCategory;
  billNumber: string; // Lot # or Invoice #
  date: string;
  dueDate?: string;
  itemDescription: string;
  quantity?: number;
  unit?: string;
  ratePerUnit?: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  paymentNotes?: string;
  sourceType?: 'fabric_lot' | 'wadding_item' | 'raw_material' | 'manual_bill';
  sourceId?: string;
}

export interface SupplierPayment {
  id: string;
  supplierName: string;
  supplierAddress?: string;
  billId?: string;
  billNumber?: string;
  date: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online/UPI';
  referenceNo?: string;
  notes?: string;
}

export interface SupplierProfile {
  id: string;
  name: string;
  companyName?: string;
  phone?: string;
  city?: string;
  address?: string;
  category: SupplierCategory;
  totalPurchases: number;
  totalPaid: number;
  currentDues: number;
  notes?: string;
  createdAt: string;
}

export interface CuttingRecord {
  id: string;
  date: string;
  lotId: string;
  lotNumber: string;
  designNumber: string;
  productType: string;
  frontMetersPerPiece: number;
  reverseMetersPerPiece: number;
  quantityCut: number;
  totalFrontMetersUsed: number;
  totalReverseMetersUsed: number;
  totalMetersUsed: number;
  waddingItemId?: string;
  waddingLotNumber?: string;
  waddingTypeName?: string;
  waddingKgPerPiece?: number;
  waddingUsedKg?: number;
  notes?: string;
}

export interface CutPieceStockItem {
  id: string;
  designNumber: string;
  productType: string;
  quantityAvailable: number;
}

export interface ProductionRecord {
  id: string;
  date: string;
  productId: string;
  productName: string;
  productCategory: string;
  productSubCategory?: string;
  quantityProduced: number;
  designNumber: string;
  // Raw materials deducted
  waddingUsedKg: number;
  stiffenersUsed: number;
  polybagsUsed: number;
  cardsUsed: number;
  quiltBagsUsed: number;
  comforterBagsUsed: number;
  operatorName?: string;
  notes?: string;
}

export interface FinishedProduct {
  id: string;
  name: string;
  sku?: string;
  category: string;
  subCategory?: string; // e.g. "Bedsheet 3pcs", "Bedsheet 4pcs", "Bedsheet 5pcs"
  designNumber: string;
  costPrice: number; // Manufacturing cost per unit
  sellingPrice: number; // Wholesaler / Retailer price
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
}

export interface Party {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  address: string;
  city: string;
  partyType: string;
  totalInvoiced: number;
  totalPaid: number;
  currentDues: number;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  partyId: string;
  partyName: string;
  date: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI/Online';
  referenceNo?: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  productName: string;
  designNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType?: 'product' | 'fabric_sample_loss' | 'loose_fabric';
  fabricLossId?: string;
  lotNumber?: string;
  meters?: number;
  frontMeters?: number;
  reverseMeters?: number;
  looseFabricCategory?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  partyId: string;
  partyName: string;
  partyAddress: string;
  partyPhone: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
  hasLooseFabric?: boolean;
  totalLooseFabricMeters?: number;
  notes?: string;
  currencyCode?: string;
  currencySymbol?: string;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
