import { z } from 'zod';

// 1. Kacha Bill Multimodal Extraction Contract (#18 & #25)
export const ExtractedLineItemSchema = z.object({
  rawTextVernacular: z.string().describe('Original shorthand text as written on the bill'),
  normalizedItemName: z.string().describe('Standardized commodity name in English/Hindi'),
  hsnCode: z.string().regex(/^\d{4,8}$/, 'Valid 4 to 8 digit HSN code'),
  quantity: z.number().positive(),
  unit: z.enum(['KG', 'GM', 'LTR', 'ML', 'PCS', 'BAG', 'BOX', 'DOZEN']),
  unitPrice: z.number().nonnegative(),
  statedLineTotal: z.number().nonnegative(),
  gstRatePercent: z.enum(['0', '5', '12', '18', '28']).transform(Number),
  confidenceScore: z.number().min(0).max(1),
});

export const AnomalyFlagSchema = z.object({
  code: z.enum([
    'ARITHMETIC_MISMATCH',
    'LOW_OCR_CONFIDENCE',
    'MISSING_MANDATORY_FIELD',
    'DUPLICATE_INVOICE_SUSPECTED',
  ]),
  fieldPath: z.string(),
  message: z.string(),
  expectedValue: z.union([z.string(), z.number()]).optional(),
  actualValue: z.union([z.string(), z.number()]).optional(),
});

export const KachaBillExtractionSchema = z.object({
  invoiceNumber: z.string().nullable(),
  invoiceDate: z.string().nullable().describe('ISO 8601 YYYY-MM-DD if legible'),
  customerOrPartyName: z.string().nullable(),
  customerGstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .nullable(),
  isInterState: z.boolean().default(false),
  paymentMode: z.enum(['CASH', 'UPI', 'UDHAAR_CREDIT']),
  lineItems: z.array(ExtractedLineItemSchema).min(1),
  statedGrandTotal: z.number().nonnegative(),
  overallConfidence: z.number().min(0).max(1),
  anomalies: z.array(AnomalyFlagSchema).default([]),
});

// 2. Official GSTR-1 Offline Tool Export Schema (#25)
export const GSTR1B2CSItemSchema = z.object({
  sply_ty: z.enum(['INTRA', 'INTER']),
  pos: z.string().length(2).describe('2-digit State Code, e.g., 03 for Punjab'),
  typ: z.literal('OE'),
  txval: z.number().nonnegative().describe('Total Taxable Value'),
  rt: z.number().describe('GST Rate Percentage'),
  iamt: z.number().nonnegative().describe('IGST Amount'),
  camt: z.number().nonnegative().describe('CGST Amount'),
  samt: z.number().nonnegative().describe('SGST Amount'),
  csamt: z.number().nonnegative().default(0),
});

export const GSTR1PayloadSchema = z.object({
  gstin: z.string().length(15),
  fp: z.string().regex(/^(0[1-9]|1[0-2])\d{4}$/, 'Format MMYYYY, e.g., 112026'),
  version: z.literal('GST3.1.6'),
  hash: z.literal('hash'),
  b2cs: z.array(GSTR1B2CSItemSchema),
});

// 3. BhashaBridge Voice & AutoFlow DAG Contract (#09 & #19)
export const WorkflowActionSchema = z.object({
  intent: z.enum([
    'RECORD_CREDIT_UDHAAR',
    'DEDUCT_INVENTORY',
    'RESTOCK_INVENTORY',
    'GENERATE_SUPPLIER_PO',
    'QUERY_LEDGER_SUMMARY',
  ]),
  spokenTranscript: z.string(),
  detectedLanguage: z.enum(['hi-IN', 'pa-IN', 'en-IN', 'hinglish']),
  entities: z.object({
    partyName: z.string().optional(),
    partyPhone: z.string().optional(),
    itemName: z.string().optional(),
    quantity: z.number().optional(),
    amountInr: z.number().optional(),
  }),
  requiresHumanApproval: z.boolean().default(true),
  spokenResponseVernacular: z.string().describe('Confirmation message in the user dialect'),
});

// 4. Inventory Item & Movement Contracts (#23)
export const InventoryItemSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(1).max(64),
  nameEnglish: z.string().min(1).max(120),
  nameVernacular: z.string().min(1).max(120),
  hsnCode: z.string().regex(/^\d{4,8}$/),
  gstRate: z.number().int().min(0).max(28),
  currentStockQty: z.number(),
  reorderThresholdQty: z.number().nonnegative(),
  unit: z.enum(['KG', 'GM', 'LTR', 'ML', 'PCS', 'BAG', 'BOX', 'DOZEN']),
  unitPricePaise: z.number().int().nonnegative(),
  supplierName: z.string().optional(),
  supplierWhatsapp: z.string().optional(),
  updatedAt: z.string(),
});

export const InventoryMovementSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  movementType: z.enum([
    'PURCHASE',
    'SALE',
    'RETURN_IN',
    'RETURN_OUT',
    'ADJUSTMENT',
    'DAMAGE',
    'TRANSFER',
    'REVERSAL',
  ]),
  quantityChange: z.number(),
  unitCostPaise: z.number().int().nonnegative().optional(),
  referenceType: z.enum(['INVOICE', 'PURCHASE_ORDER', 'MANUAL_AUDIT', 'DAMAGED_LOG']).optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  timestamp: z.string(),
});

// 5. Party (Customer) & Udhaar Ledger Contracts (#24)
export const PartySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  phone: z.string().min(10).max(15),
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'DUAL']),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  creditLimitPaise: z.number().int().nonnegative().default(5000000), // Default 50,000 INR
  currentBalancePaise: z.number().int().default(0), // positive = owes merchant
  city: z.string().optional(),
});

export const UdhaarTransactionSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  transactionType: z.enum(['CREDIT_SALE', 'PAYMENT_RECEIVED', 'ADJUSTMENT', 'REVERSAL']),
  amountPaise: z.number().int().positive(),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE']).optional(),
  referenceInvoiceId: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  timestamp: z.string(),
});

// 6. Supplier & Purchase Order Contracts (#25)
export const PurchaseOrderLineItemSchema = z.object({
  itemName: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
  expectedUnitPricePaise: z.number().int().nonnegative().optional(),
});

export const PurchaseOrderSchema = z.object({
  id: z.string().uuid(),
  supplierName: z.string(),
  supplierWhatsapp: z.string(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'DISPATCHED', 'RECEIVED', 'CANCELLED']),
  items: z.array(PurchaseOrderLineItemSchema).min(1),
  notes: z.string().optional(),
  createdAt: z.string(),
});

// 7. Merchant Settings Contract
export const MerchantSettingsSchema = z.object({
  businessName: z.string().min(1),
  gstin: z.string().length(15),
  stateCode: z.string().length(2),
  preferredLanguage: z.enum(['en', 'hi', 'pa', 'hinglish']),
  offlineSyncEnabled: z.boolean().default(true),
  autoPrintReceipts: z.boolean().default(false),
});

export type ExtractedLineItem = z.infer<typeof ExtractedLineItemSchema>;
export type AnomalyFlag = z.infer<typeof AnomalyFlagSchema>;
export type KachaBillExtraction = z.infer<typeof KachaBillExtractionSchema>;
export type GSTR1B2CSItem = z.infer<typeof GSTR1B2CSItemSchema>;
export type GSTR1Payload = z.infer<typeof GSTR1PayloadSchema>;
export type WorkflowAction = z.infer<typeof WorkflowActionSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryMovementRecord = z.infer<typeof InventoryMovementSchema>;
export type Party = z.infer<typeof PartySchema>;
export type UdhaarTransactionRecord = z.infer<typeof UdhaarTransactionSchema>;
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
export type MerchantSettings = z.infer<typeof MerchantSettingsSchema>;
