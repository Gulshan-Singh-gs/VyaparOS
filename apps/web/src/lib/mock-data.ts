import { InventoryItem, Party, UdhaarTransactionRecord, PurchaseOrder } from '@vyapar-os/shared';

export interface AppInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  status: 'DRAFT' | 'EXTRACTED' | 'NEEDS_REVIEW' | 'VERIFIED' | 'POSTED' | 'RECONCILED';
  paymentMode: 'CASH' | 'UPI' | 'UDHAAR_CREDIT';
  taxableAmountPaisa: number;
  cgstPaisa: number;
  sgstPaisa: number;
  igstPaisa: number;
  grandTotalPaisa: number;
  itemCount: number;
  rawImagePreview?: string;
  anomaliesCount: number;
}

export const INITIAL_INVOICES: AppInvoice[] = [
  {
    id: 'inv_101',
    invoiceNumber: 'INV-2026-001',
    customerName: 'रमेश कुमार (Ramesh Kumar)',
    invoiceDate: '2026-11-05',
    status: 'NEEDS_REVIEW',
    paymentMode: 'UDHAAR_CREDIT',
    taxableAmountPaisa: 210000,
    cgstPaisa: 5250,
    sgstPaisa: 5250,
    igstPaisa: 0,
    grandTotalPaisa: 220500, // ₹2,205.00
    itemCount: 3,
    anomaliesCount: 1,
  },
  {
    id: 'inv_102',
    invoiceNumber: 'INV-2026-002',
    customerName: 'ਹਰਪ੍ਰੀਤ ਸਿੰਘ (Harpreet Singh)',
    invoiceDate: '2026-11-04',
    status: 'POSTED',
    paymentMode: 'UPI',
    taxableAmountPaisa: 450000,
    cgstPaisa: 11250,
    sgstPaisa: 11250,
    igstPaisa: 0,
    grandTotalPaisa: 472500, // ₹4,725.00
    itemCount: 4,
    anomaliesCount: 0,
  },
  {
    id: 'inv_103',
    invoiceNumber: 'INV-2026-003',
    customerName: 'Walk-in Cash Customer',
    invoiceDate: '2026-11-05',
    status: 'POSTED',
    paymentMode: 'CASH',
    taxableAmountPaisa: 125000,
    cgstPaisa: 0,
    sgstPaisa: 0,
    igstPaisa: 0,
    grandTotalPaisa: 125000, // ₹1,250.00
    itemCount: 2,
    anomaliesCount: 0,
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'b1d5c560-6394-4d8e-9082-9626b91129aa',
    sku: 'SKU-RICE-BASMATI',
    nameEnglish: 'Basmati Rice Premium (1121)',
    nameVernacular: 'बासमती चावल / ਬਾਸਮਤੀ ਚੌਲ',
    hsnCode: '10063010',
    gstRate: 5,
    currentStockQty: 12,
    reorderThresholdQty: 25,
    unit: 'BAG',
    unitPricePaise: 185000, // ₹1,850.00 per bag
    supplierName: 'Gupta Rice Mill (Karnal)',
    supplierWhatsapp: '+919876543210',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c2e6d671-7405-5e9f-0193-0737c02230bb',
    sku: 'SKU-SUGAR-M30',
    nameEnglish: 'Refined Sugar M-30',
    nameVernacular: 'सफेद चीनी / ਖੰਡ',
    hsnCode: '17019910',
    gstRate: 5,
    currentStockQty: 48,
    reorderThresholdQty: 20,
    unit: 'KG',
    unitPricePaise: 4400, // ₹44.00 per kg
    supplierName: 'Punjab Sugar Syndicate',
    supplierWhatsapp: '+919812345678',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd3f7e782-8516-6fa0-1204-1848d13341cc',
    sku: 'SKU-MUSTARD-OIL',
    nameEnglish: 'Kachi Ghani Mustard Oil 1L',
    nameVernacular: 'सरसों का तेल / ਸਰ੍ਹੋਂ ਦਾ ਤੇਲ',
    hsnCode: '15149110',
    gstRate: 5,
    currentStockQty: 6,
    reorderThresholdQty: 15,
    unit: 'LTR',
    unitPricePaise: 16500, // ₹165.00
    supplierName: 'Kisan Agro Oils',
    supplierWhatsapp: '+919823456789',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'e4a8f893-9627-70b1-2315-2959e24452dd',
    sku: 'SKU-CHANA-DAL',
    nameEnglish: 'Desi Chana Dal Unpolished',
    nameVernacular: 'चना दाल / ਛੋਲਿਆਂ ਦੀ ਦਾਲ',
    hsnCode: '07132000',
    gstRate: 0,
    currentStockQty: 65,
    reorderThresholdQty: 20,
    unit: 'KG',
    unitPricePaise: 8200, // ₹82.00
    supplierName: 'Gupta Traders',
    supplierWhatsapp: '+919876543210',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_PARTIES: Party[] = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    name: 'रमेश कुमार (Ramesh Kirana)',
    phone: '9872112233',
    type: 'CUSTOMER',
    creditLimitPaise: 2500000, // ₹25,000
    currentBalancePaise: 450000, // ₹4,500 owed
    city: 'Ludhiana',
  },
  {
    id: 'p2222222-2222-2222-2222-222222222222',
    name: 'ਸ. ਹਰਪ੍ਰੀਤ ਸਿੰਘ (Harpreet Transport)',
    phone: '9814556677',
    type: 'CUSTOMER',
    creditLimitPaise: 5000000, // ₹50,000
    currentBalancePaise: 1280000, // ₹12,800 owed
    city: 'Jalandhar',
  },
  {
    id: 'p3333333-3333-3333-3333-333333333333',
    name: 'विक्रम ट्रेडर्स (Vikram Traders)',
    phone: '9888990011',
    type: 'CUSTOMER',
    creditLimitPaise: 3000000, // ₹30,000
    currentBalancePaise: 185000, // ₹1,850 owed
    city: 'Amritsar',
  },
];

export const INITIAL_UDHAAR_TXS: UdhaarTransactionRecord[] = [
  {
    id: 'u1111111-1111-1111-1111-111111111111',
    customerId: 'p1111111-1111-1111-1111-111111111111',
    transactionType: 'CREDIT_SALE',
    amountPaise: 350000, // ₹3,500
    referenceInvoiceId: 'inv_101',
    notes: '2 Bag Chana Dal + 10 KG Sugar',
    dueDate: '2026-11-15',
    timestamp: '2026-11-01T10:30:00Z',
  },
  {
    id: 'u2222222-2222-2222-2222-222222222222',
    customerId: 'p1111111-1111-1111-1111-111111111111',
    transactionType: 'CREDIT_SALE',
    amountPaise: 200000, // ₹2,000
    notes: 'Rice supply on credit',
    dueDate: '2026-11-12',
    timestamp: '2026-11-03T14:15:00Z',
  },
  {
    id: 'u3333333-3333-3333-3333-333333333333',
    customerId: 'p1111111-1111-1111-1111-111111111111',
    transactionType: 'PAYMENT_RECEIVED',
    amountPaise: 100000, // ₹1,000 paid back
    paymentMode: 'UPI',
    notes: 'Google Pay transaction #GP98124',
    timestamp: '2026-11-04T18:00:00Z',
  },
  {
    id: 'u4444444-4444-4444-4444-444444444444',
    customerId: 'p2222222-2222-2222-2222-222222222222',
    transactionType: 'CREDIT_SALE',
    amountPaise: 1280000, // ₹12,800
    notes: 'Bulk mustard oil + flour',
    dueDate: '2026-10-25', // Overdue!
    timestamp: '2026-10-18T11:00:00Z',
  },
];

export const INITIAL_SUPPLIERS = [
  {
    id: 'sup_1',
    name: 'Gupta Rice Mill (Karnal)',
    contactPerson: 'Sh. Ram Gupta',
    whatsapp: '+919876543210',
    commodities: ['Basmati Rice', 'Chana Dal', 'Wheat Flour'],
    city: 'Karnal, Haryana',
    rating: '5.0',
  },
  {
    id: 'sup_2',
    name: 'Punjab Sugar Syndicate',
    contactPerson: 'S. Gurmukh Singh',
    whatsapp: '+919812345678',
    commodities: ['Sugar M-30', 'Jaggery (Gud)'],
    city: 'Dhuri, Punjab',
    rating: '4.8',
  },
  {
    id: 'sup_3',
    name: 'Kisan Agro Oils',
    contactPerson: 'Anil Agarwal',
    whatsapp: '+919823456789',
    commodities: ['Mustard Oil', 'Refined Sunflower Oil'],
    city: 'Bathinda, Punjab',
    rating: '4.9',
  },
];

