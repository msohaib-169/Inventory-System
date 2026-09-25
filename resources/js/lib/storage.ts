import {
  FabricLot,
  FabricDesign,
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

export const defaultPackagingHierarchy: Record<string, string[]> = {
  'Label': ['Label 1', 'Label 2', 'Label 3', 'Woven Brand Label', 'Wash Care Label', 'Hang Tag'],
  'Bags': ['Bag 1', 'Bag 2', 'Bag 3', 'Polybag', 'Single Quilt Bag', 'Double Quilt Bag', 'Comforter Bag'],
  'Stiffner': ['Stiffner 1', 'Stiffner 2', 'Stiffner 3', 'Heavy Stiffner', 'Soft Stiffner'],
  'Cards': ['Cards 1', 'Card 2', 'Card 3', 'Insert Card', 'Photo Inlay Card'],
  'Buttons': ['Buttons 1', 'Button 2', 'Pearl Buttons 18mm', 'Clear Duvet Buttons'],
  'Zippers': ['Zipper #3', 'Zipper #5', 'Quilt Heavy Nylon Zipper', 'Invisible Zipper'],
  'Ribbon': ['Satin Ribbon', 'Elastic Ribbon', 'Twill Tape'],
  'Carton Box': ['Master Export Carton', 'Single Pack Box', 'Duvet Storage Box'],
};

export const defaultProductHierarchy: Record<string, string[]> = {
  'Bedsheet': ['Bedsheet 3pcs', 'Bedsheet 4pcs', 'Bedsheet 5pcs', 'Single Bedsheet', 'King Bedsheet Set'],
  'Comforter': ['Single Comforter', 'Double Comforter', 'Comforter 4pcs Set', 'Comforter 6pcs Set', 'Comforter 8pcs Set'],
  'Single Quilt': ['Single Quilt Standard', 'Single Quilt Heavy', 'Single Quilt Light (Summer)'],
  'Double Quilt': ['Double Quilt King', 'Double Quilt Standard', 'Double Quilt Velvet Touch'],
  'Pillow Pair': ['Pillow Pair Standard', 'Pillow Pair Quilted', 'Pillow Pair Fluffy'],
  'Gadda Mattress': ['Single Gadda', 'Double Gadda', 'Folding Travel Mattress'],
  'Cushion Cover': ['Cushion 16x16', 'Cushion 18x18', 'Embroidered Cushion Set'],
  'Fitted Sheet': ['Fitted Sheet Single', 'Fitted Sheet King', 'Fitted Sheet Queen'],
  'Runner': ['Bed Runner Set', 'Table Runner'],
};

// Initial Seed Data
const defaultLots: FabricLot[] = [
  {
    id: 'lot-1',
    lotNumber: 'LOT-2026-101',
    supplierName: 'Sunrise Textile Mills',
    dateReceived: '2026-07-15',
    notes: 'Premium 100% Cotton 300 Thread Count Batch',
    designs: [
      { id: 'd-1', designNumber: 'DS-101', designName: 'Royal Floral Red', frontMeters: 450, reverseMeters: 450 },
      { id: 'd-2', designNumber: 'DS-102', designName: 'Damask Gold Classic', frontMeters: 600, reverseMeters: 550 },
      { id: 'd-3', designNumber: 'DS-103', designName: 'Ocean Wave Blue', frontMeters: 380, reverseMeters: 380 },
    ],
  },
  {
    id: 'lot-2',
    lotNumber: 'LOT-2026-102',
    supplierName: 'Apex Weaving Mills',
    dateReceived: '2026-07-22',
    notes: 'Soft Brushed Microfiber Velvet Finish',
    designs: [
      { id: 'd-4', designNumber: 'DS-201', designName: 'Velvet Geometry Charcoal', frontMeters: 800, reverseMeters: 800, fabricType: 'bedsheet_set' },
      { id: 'd-5', designNumber: 'DS-202', designName: 'Satin Stripe Ivory', frontMeters: 500, reverseMeters: 500, fabricType: 'bedsheet_set' },
      { id: 'd-6', designNumber: 'DS-203', designName: 'Heavy Wadding Cover Fabric (Single Roll)', frontMeters: 0, reverseMeters: 0, fabricType: 'single_roll', totalMeters: 400 },
    ],
  },
];

const defaultFabricLosses: FabricLossRecord[] = [
  {
    id: 'floss-1',
    date: '2026-07-28',
    lotId: 'lot-1',
    lotNumber: 'LOT-2026-101',
    designNumber: 'DS-101',
    designName: 'Royal Floral Red',
    category: 'Given to Customer (Sample / Loss)',
    partyName: 'Al-Rahman Wholesalers',
    metersLost: 15,
    notes: 'Sample cuts (15 Meters) issued to customer for quality approval',
  },
  {
    id: 'floss-2',
    date: '2026-08-02',
    lotId: 'lot-2',
    lotNumber: 'LOT-2026-102',
    designNumber: 'DS-201',
    designName: 'Velvet Geometry Charcoal',
    category: 'Cutting Scrap & Waste',
    metersLost: 8,
    notes: 'Roll edge defect damage during cutting process',
  },
];

const defaultWadding: WaddingStock = {
  totalPurchasedKg: 1000,
  usedKg: 184,
  availableKg: 816,
  singleQuiltSpecKg: 0.8,
  doubleQuiltSpecKg: 1.4,
  items: [
    {
      id: 'wad-1',
      type: 'Siliconized Polyester Fiber',
      gsm: 200,
      supplierName: 'National Fiber Mills Ltd',
      lotNumber: 'WAD-LOT-2026-A1',
      ratePerKg: 350, // Rs. 350 / Kg
      availableKg: 400,
      totalPurchasedKg: 500,
      usedKg: 100,
      singleQuiltSpecKg: 0.8,
      doubleQuiltSpecKg: 1.4,
      singleQuiltFabricMeters: 2.5,
      doubleQuiltFabricMeters: 4.2,
      fabricRatePerMeter: 120, // Rs. 120 / Meter
      notes: 'Standard 200 GSM siliconized fiber roll for winter quilts',
    },
    {
      id: 'wad-2',
      type: 'Microfiber Soft Wadding',
      gsm: 300,
      supplierName: 'Al-Madina Textile Supplies',
      lotNumber: 'WAD-LOT-2026-B2',
      ratePerKg: 480, // Rs. 480 / Kg
      availableKg: 250,
      totalPurchasedKg: 300,
      usedKg: 50,
      singleQuiltSpecKg: 1.1,
      doubleQuiltSpecKg: 1.8,
      singleQuiltFabricMeters: 2.6,
      doubleQuiltFabricMeters: 4.5,
      fabricRatePerMeter: 160,
      notes: 'Ultra soft 300 GSM microfiber filling for comforter sets',
    },
    {
      id: 'wad-3',
      type: 'Thermal Bonded Roll Fiber',
      gsm: 150,
      supplierName: 'Sunrise Non-Woven Co.',
      lotNumber: 'WAD-LOT-2026-C3',
      ratePerKg: 280, // Rs. 280 / Kg
      availableKg: 166,
      totalPurchasedKg: 200,
      usedKg: 34,
      singleQuiltSpecKg: 0.6,
      doubleQuiltSpecKg: 1.1,
      singleQuiltFabricMeters: 2.4,
      doubleQuiltFabricMeters: 4.0,
      fabricRatePerMeter: 110,
      notes: '150 GSM lightweight thermal bonded fiber for summer blankets',
    },
  ],
};

const defaultRawMaterials: RawMaterialStockItem[] = [
  { id: 'rm-1', name: 'Standard Bedsheet Stiffener', category: 'Stiffner', subCategory: 'Stiffner 1', quantityInStock: 1850, unit: 'pcs', reorderLevel: 300, costPerUnit: 0.25 },
  { id: 'rm-2', name: 'Transparent Polybag (Bedsheet/Quilt)', category: 'Bags', subCategory: 'Polybag', quantityInStock: 2400, unit: 'pcs', reorderLevel: 500, costPerUnit: 0.15 },
  { id: 'rm-3', name: 'Bedsheet Design Card - ZF 1089', category: 'Cards', subCategory: 'Cards 1', designCardFor: 'ZF 1089', cardDesigns: ['ZF 1089', 'ZF 1089-A'], quantityInStock: 750, unit: 'pcs', reorderLevel: 150, costPerUnit: 0.35 },
  { id: 'rm-4', name: 'Bedsheet Design Card - DS-102', category: 'Cards', subCategory: 'Card 2', designCardFor: 'DS-102', cardDesigns: ['DS-102'], quantityInStock: 600, unit: 'pcs', reorderLevel: 150, costPerUnit: 0.35 },
  { id: 'rm-5', name: 'Single Quilt Zipper Bag', category: 'Bags', subCategory: 'Bag 1', bagType: 'single_quilt', quantityInStock: 480, unit: 'pcs', reorderLevel: 100, costPerUnit: 1.20 },
  { id: 'rm-6', name: 'Double Quilt Zipper Bag', category: 'Bags', subCategory: 'Bag 2', bagType: 'double_quilt', quantityInStock: 520, unit: 'pcs', reorderLevel: 100, costPerUnit: 1.80 },
  { id: 'rm-7', name: 'Premium Heavy Comforter Bag', category: 'Bags', subCategory: 'Bag 3', bagType: 'comforter', quantityInStock: 310, unit: 'pcs', reorderLevel: 50, costPerUnit: 2.50 },
  { id: 'rm-8', name: 'White Pearl Duvet Buttons (18mm)', category: 'Buttons', subCategory: 'Buttons 1', quantityInStock: 5000, unit: 'pcs', reorderLevel: 1000, costPerUnit: 0.05 },
  { id: 'rm-9', name: 'Heavy Duty Nylon Quilt Zipper 36"', category: 'Zippers', subCategory: 'Zipper #5', quantityInStock: 1200, unit: 'pcs', reorderLevel: 250, costPerUnit: 0.45 },
  { id: 'rm-10', name: 'Satin Packaging Ribbon (Gold & Red)', category: 'Ribbon', subCategory: 'Ribbon 1', quantityInStock: 800, unit: 'meters', reorderLevel: 150, costPerUnit: 0.20 },
  { id: 'rm-11', name: 'Zartab Satin Woven Brand Label', category: 'Label', subCategory: 'Label 1', quantityInStock: 3500, unit: 'pcs', reorderLevel: 500, costPerUnit: 0.10 },
  { id: 'rm-12', name: 'Master Corrugated Export Carton Box (10 Sets)', category: 'Carton Box', subCategory: 'Box 1', quantityInStock: 250, unit: 'pcs', reorderLevel: 50, costPerUnit: 3.50 },
];

const defaultCuttingRecords: CuttingRecord[] = [
  {
    id: 'cut-1',
    date: '2026-07-28',
    lotId: 'lot-1',
    lotNumber: 'LOT-2026-101',
    designNumber: 'DS-101',
    productType: 'Double Quilt',
    frontMetersPerPiece: 2.5,
    reverseMetersPerPiece: 2.5,
    quantityCut: 40,
    totalFrontMetersUsed: 100,
    totalReverseMetersUsed: 100,
    totalMetersUsed: 200,
    notes: 'Initial cutting batch for double quilt DS-101',
  },
  {
    id: 'cut-2',
    date: '2026-07-29',
    lotId: 'lot-1',
    lotNumber: 'LOT-2026-101',
    designNumber: 'DS-102',
    productType: 'Bedsheet',
    frontMetersPerPiece: 2.8,
    reverseMetersPerPiece: 0,
    quantityCut: 50,
    totalFrontMetersUsed: 140,
    totalReverseMetersUsed: 0,
    totalMetersUsed: 140,
    notes: 'Bedsheet single side print cutting',
  },
  {
    id: 'cut-3',
    date: '2026-07-30',
    lotId: 'lot-2',
    lotNumber: 'LOT-2026-102',
    designNumber: 'DS-201',
    productType: 'Single Quilt',
    frontMetersPerPiece: 1.8,
    reverseMetersPerPiece: 1.8,
    quantityCut: 60,
    totalFrontMetersUsed: 108,
    totalReverseMetersUsed: 108,
    totalMetersUsed: 216,
    notes: 'Single quilt high density velvet cutting',
  },
];

const defaultCutPieceStock: CutPieceStockItem[] = [
  { id: 'cps-1', designNumber: 'DS-101', productType: 'Double Quilt', quantityAvailable: 15 },
  { id: 'cps-2', designNumber: 'DS-102', productType: 'Bedsheet', quantityAvailable: 20 },
  { id: 'cps-3', designNumber: 'DS-201', productType: 'Single Quilt', quantityAvailable: 25 },
];

const defaultProductionRecords: ProductionRecord[] = [
  {
    id: 'prod-1',
    date: '2026-07-29',
    productId: 'p-2',
    productName: 'Royal Double Quilt (DS-101)',
    productCategory: 'Double Quilt',
    quantityProduced: 25,
    designNumber: 'DS-101',
    waddingUsedKg: 35, // 25 * 1.4 kg
    stiffenersUsed: 0,
    polybagsUsed: 25,
    cardsUsed: 0,
    quiltBagsUsed: 25,
    comforterBagsUsed: 0,
    operatorName: 'Ahmad Stitching Team',
    notes: 'Double quilt stitching and zipper packing done',
  },
  {
    id: 'prod-2',
    date: '2026-07-30',
    productId: 'p-3',
    productName: 'Classic Bedsheet Double (DS-102)',
    productCategory: 'Bedsheet',
    quantityProduced: 30,
    designNumber: 'DS-102',
    waddingUsedKg: 0,
    stiffenersUsed: 30,
    polybagsUsed: 30,
    cardsUsed: 30,
    quiltBagsUsed: 0,
    comforterBagsUsed: 0,
    operatorName: 'Bilal Finishing Dept',
    notes: '30 bedsheet sets with stiffener & cards packed',
  },
  {
    id: 'prod-3',
    date: '2026-07-31',
    productId: 'p-1',
    productName: 'Single Quilt (DS-201)',
    productCategory: 'Single Quilt',
    quantityProduced: 35,
    designNumber: 'DS-201',
    waddingUsedKg: 28, // 35 * 0.8 kg
    stiffenersUsed: 0,
    polybagsUsed: 35,
    cardsUsed: 0,
    quiltBagsUsed: 35,
    comforterBagsUsed: 0,
    operatorName: 'Ahmad Stitching Team',
    notes: 'Single quilt production run',
  },
];

const defaultProducts: FinishedProduct[] = [
  { id: 'p-1', name: 'Single Quilt Velvet', sku: 'SQ-DS201', category: 'Single Quilt', subCategory: 'Single Quilt Standard', designNumber: 'DS-201', costPrice: 18.5, sellingPrice: 28.0, stockQuantity: 65, reorderLevel: 15, unit: 'pcs', stockStatements: [{ id: 'ps-1', date: '2026-07-26', type: 'production', quantity: 65, note: 'Initial production stock', reference: 'Opening Balance' }] },
  { id: 'p-2', name: 'Royal Double Quilt', sku: 'DQ-DS101', category: 'Double Quilt', subCategory: 'Double Quilt King', designNumber: 'DS-101', costPrice: 28.0, sellingPrice: 45.0, stockQuantity: 42, reorderLevel: 10, unit: 'pcs', stockStatements: [{ id: 'ps-2', date: '2026-07-26', type: 'production', quantity: 42, note: 'Initial production stock', reference: 'Opening Balance' }] },
  { id: 'p-3', name: 'Classic Bedsheet Double Set', sku: 'BS-ZF1089', category: 'Bedsheet', subCategory: 'Bedsheet 3pcs', designNumber: 'ZF 1089', costPrice: 12.0, sellingPrice: 22.0, stockQuantity: 95, reorderLevel: 20, unit: 'pcs', stockStatements: [{ id: 'ps-3', date: '2026-07-26', type: 'production', quantity: 95, note: 'Initial production stock', reference: 'Opening Balance' }] },
  { id: 'p-4', name: 'Deluxe Comforter 6-Piece Set', sku: 'CS-DS201', category: 'Comforter Set', subCategory: 'Comforter 6pcs', designNumber: 'DS-201', costPrice: 45.0, sellingPrice: 75.0, stockQuantity: 28, reorderLevel: 8, unit: 'pcs', stockStatements: [{ id: 'ps-4', date: '2026-07-26', type: 'production', quantity: 28, note: 'Initial production stock', reference: 'Opening Balance' }] },
  { id: 'p-5', name: 'Luxury Pillow Pair', sku: 'PP-101', category: 'Pillow Pair', designNumber: '', costPrice: 4.5, sellingPrice: 9.0, stockQuantity: 150, reorderLevel: 30, unit: 'pairs', stockStatements: [{ id: 'ps-5', date: '2026-07-26', type: 'production', quantity: 150, note: 'Initial production stock', reference: 'Opening Balance' }] },
];

const defaultParties: Party[] = [
  {
    id: 'party-1',
    name: 'Al-Madina Home Textile Hub',
    companyName: 'Al-Madina Traders',
    phone: '+92 300 1234567',
    address: 'Cloth Market Gate #3',
    city: 'Faisalabad',
    partyType: 'Wholesaler',
    totalInvoiced: 4250.0,
    totalPaid: 2800.0,
    currentDues: 1450.0,
    createdAt: '2026-06-01',
  },
  {
    id: 'party-2',
    name: 'Royal Comfort Bedding Store',
    companyName: 'Royal Comfort Pvt Ltd',
    phone: '+92 321 9876543',
    address: 'Main Boulevard Gulberg',
    city: 'Lahore',
    partyType: 'Dealer',
    totalInvoiced: 3120.0,
    totalPaid: 2300.0,
    currentDues: 820.0,
    createdAt: '2026-06-10',
  },
  {
    id: 'party-3',
    name: 'Grand Palace Linen Center',
    companyName: 'Grand Palace Emporium',
    phone: '+92 333 4567890',
    address: 'Tariq Road Commerce Center',
    city: 'Karachi',
    partyType: 'Retailer',
    totalInvoiced: 5600.0,
    totalPaid: 3500.0,
    currentDues: 2100.0,
    createdAt: '2026-06-15',
  },
];

const defaultPayments: PaymentTransaction[] = [
  {
    id: 'pay-1',
    partyId: 'party-1',
    partyName: 'Al-Madina Home Textile Hub',
    date: '2026-07-20',
    amount: 1500.0,
    paymentMethod: 'Bank Transfer',
    referenceNo: 'MBL-889021',
    notes: 'Advance payment for double quilt order',
  },
  {
    id: 'pay-2',
    partyId: 'party-2',
    partyName: 'Royal Comfort Bedding Store',
    date: '2026-07-25',
    amount: 1000.0,
    paymentMethod: 'Cash',
    referenceNo: 'REC-0921',
    notes: 'Partial payment against invoice INV-1002',
  },
];

const defaultInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    partyId: 'party-1',
    partyName: 'Al-Madina Home Textile Hub',
    partyAddress: 'Cloth Market Gate #3, Faisalabad',
    partyPhone: '+92 300 1234567',
    date: '2026-07-26',
    dueDate: '2026-08-10',
    items: [
      { id: 'ii-1', productId: 'p-2', productName: 'Royal Double Quilt', designNumber: 'DS-101', quantity: 20, unitPrice: 45.0, totalPrice: 900.0 },
      { id: 'ii-2', productId: 'p-3', productName: 'Classic Bedsheet Double Set', designNumber: 'DS-102', quantity: 30, unitPrice: 22.0, totalPrice: 660.0 },
    ],
    subtotal: 1560.0,
    taxRatePercent: 0,
    taxAmount: 0,
    discountAmount: 60.0,
    grandTotal: 1500.0,
    amountPaid: 1500.0,
    balanceDue: 0.0,
    status: 'Paid',
    notes: 'Delivery completed via Express Cargo',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    partyId: 'party-2',
    partyName: 'Royal Comfort Bedding Store',
    partyAddress: 'Main Boulevard Gulberg, Lahore',
    partyPhone: '+92 321 9876543',
    date: '2026-07-28',
    dueDate: '2026-08-15',
    items: [
      { id: 'ii-3', productId: 'p-1', productName: 'Single Quilt Velvet', designNumber: 'DS-201', quantity: 25, unitPrice: 28.0, totalPrice: 700.0 },
      { id: 'ii-4', productId: 'p-4', productName: 'Deluxe Comforter 6-Piece Set', designNumber: 'DS-201', quantity: 10, unitPrice: 75.0, totalPrice: 750.0 },
    ],
    subtotal: 1450.0,
    taxRatePercent: 0,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 1450.0,
    amountPaid: 630.0,
    balanceDue: 820.0,
    status: 'Partially Paid',
    notes: 'Balance due in 15 days',
  },
];

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
  getLots: (): FabricLot[] => getItem(STORAGE_KEYS.LOTS, defaultLots),
  saveLots: (lots: FabricLot[]) => setItem(STORAGE_KEYS.LOTS, lots),

  getFabricLosses: (): FabricLossRecord[] => getItem(STORAGE_KEYS.FABRIC_LOSSES, defaultFabricLosses),
  saveFabricLosses: (records: FabricLossRecord[]) => setItem(STORAGE_KEYS.FABRIC_LOSSES, records),

  getWadding: (): WaddingStock => {
    const data = getItem(STORAGE_KEYS.WADDING, defaultWadding);
    if (!data || !Array.isArray(data.items)) {
      return { ...defaultWadding };
    }
    return data;
  },
  saveWadding: (wadding: WaddingStock) => setItem(STORAGE_KEYS.WADDING, wadding),

  getRawMaterials: (): RawMaterialStockItem[] => getItem(STORAGE_KEYS.RAW_MATERIALS, defaultRawMaterials),
  saveRawMaterials: (items: RawMaterialStockItem[]) => setItem(STORAGE_KEYS.RAW_MATERIALS, items),

  getCuttingRecords: (): CuttingRecord[] => getItem(STORAGE_KEYS.CUTTING, defaultCuttingRecords),
  saveCuttingRecords: (records: CuttingRecord[]) => setItem(STORAGE_KEYS.CUTTING, records),

  getCutPiecesStock: (): CutPieceStockItem[] => getItem(STORAGE_KEYS.CUT_PIECES, defaultCutPieceStock),
  saveCutPiecesStock: (items: CutPieceStockItem[]) => setItem(STORAGE_KEYS.CUT_PIECES, items),

  getProductionRecords: (): ProductionRecord[] => getItem(STORAGE_KEYS.PRODUCTION, defaultProductionRecords),
  saveProductionRecords: (records: ProductionRecord[]) => setItem(STORAGE_KEYS.PRODUCTION, records),

  getProducts: (): FinishedProduct[] => getItem(STORAGE_KEYS.PRODUCTS, defaultProducts),
  saveProducts: (products: FinishedProduct[]) => setItem(STORAGE_KEYS.PRODUCTS, products),

  getParties: (): Party[] => getItem(STORAGE_KEYS.PARTIES, defaultParties),
  saveParties: (parties: Party[]) => setItem(STORAGE_KEYS.PARTIES, parties),

  getPayments: (): PaymentTransaction[] => getItem(STORAGE_KEYS.PAYMENTS, defaultPayments),
  savePayments: (payments: PaymentTransaction[]) => setItem(STORAGE_KEYS.PAYMENTS, payments),

  getInvoices: (): Invoice[] => getItem(STORAGE_KEYS.INVOICES, defaultInvoices),
  saveInvoices: (invoices: Invoice[]) => setItem(STORAGE_KEYS.INVOICES, invoices),

  getSuppliers: (): SupplierProfile[] => getItem(STORAGE_KEYS.SUPPLIERS, []),
  saveSuppliers: (suppliers: SupplierProfile[]) => setItem(STORAGE_KEYS.SUPPLIERS, suppliers),

  getSupplierBills: (): SupplierBill[] => getItem(STORAGE_KEYS.SUPPLIER_BILLS, []),
  saveSupplierBills: (bills: SupplierBill[]) => setItem(STORAGE_KEYS.SUPPLIER_BILLS, bills),

  getSupplierPayments: (): SupplierPayment[] => getItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, []),
  saveSupplierPayments: (payments: SupplierPayment[]) => setItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, payments),

  getPackagingHierarchy: (): Record<string, string[]> => getItem(STORAGE_KEYS.PACKAGING_HIERARCHY, defaultPackagingHierarchy),
  savePackagingHierarchy: (hierarchy: Record<string, string[]>) => setItem(STORAGE_KEYS.PACKAGING_HIERARCHY, hierarchy),

  getProductHierarchy: (): Record<string, string[]> => getItem(STORAGE_KEYS.PRODUCT_HIERARCHY, defaultProductHierarchy),
  saveProductHierarchy: (hierarchy: Record<string, string[]>) => setItem(STORAGE_KEYS.PRODUCT_HIERARCHY, hierarchy),

  clearAllData: () => {
    setItem(STORAGE_KEYS.LOTS, []);
    setItem(STORAGE_KEYS.WADDING, {
      totalPurchasedKg: 0,
      usedKg: 0,
      availableKg: 0,
      singleQuiltSpecKg: 0.8,
      doubleQuiltSpecKg: 1.4,
      items: [],
    });
    setItem(STORAGE_KEYS.RAW_MATERIALS, []);
    setItem(STORAGE_KEYS.CUTTING, []);
    setItem(STORAGE_KEYS.CUT_PIECES, []);
    setItem(STORAGE_KEYS.PRODUCTION, []);
    setItem(STORAGE_KEYS.PRODUCTS, []);
    setItem(STORAGE_KEYS.PARTIES, []);
    setItem(STORAGE_KEYS.PAYMENTS, []);
    setItem(STORAGE_KEYS.INVOICES, []);
    setItem(STORAGE_KEYS.SUPPLIERS, []);
    setItem(STORAGE_KEYS.SUPPLIER_BILLS, []);
    setItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, []);
  },

  resetToDefault: () => {
    setItem(STORAGE_KEYS.LOTS, defaultLots);
    setItem(STORAGE_KEYS.WADDING, defaultWadding);
    setItem(STORAGE_KEYS.RAW_MATERIALS, defaultRawMaterials);
    setItem(STORAGE_KEYS.CUTTING, defaultCuttingRecords);
    setItem(STORAGE_KEYS.CUT_PIECES, defaultCutPieceStock);
    setItem(STORAGE_KEYS.PRODUCTION, defaultProductionRecords);
    setItem(STORAGE_KEYS.PRODUCTS, defaultProducts);
    setItem(STORAGE_KEYS.PARTIES, defaultParties);
    setItem(STORAGE_KEYS.PAYMENTS, defaultPayments);
    setItem(STORAGE_KEYS.INVOICES, defaultInvoices);
    setItem(STORAGE_KEYS.SUPPLIERS, []);
    setItem(STORAGE_KEYS.SUPPLIER_BILLS, []);
    setItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, []);
  },
};
