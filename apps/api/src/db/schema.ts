import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// 1. Multi-Tenant Merchants Table
export const merchants = pgTable('merchants', {
  id: uuid('id').defaultRandom().primaryKey(),
  supabaseUserId: uuid('supabase_user_id').notNull().unique(),
  businessName: varchar('business_name', { length: 160 }).notNull(),
  gstin: varchar('gstin', { length: 15 }).notNull(),
  stateCode: varchar('state_code', { length: 2 }).default('03').notNull(), // 03 = Punjab
  preferredDialect: varchar('preferred_dialect', { length: 20 }).default('hinglish').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Inventory & Commodity Catalog
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id')
    .references(() => merchants.id, { onDelete: 'cascade' })
    .notNull(),
  sku: varchar('sku', { length: 64 }).notNull(),
  nameEnglish: varchar('name_english', { length: 120 }).notNull(),
  nameVernacular: varchar('name_vernacular', { length: 120 }).notNull(),
  hsnCode: varchar('hsn_code', { length: 8 }).notNull(),
  gstRate: integer('gst_rate').notNull(), // 0, 5, 12, 18, 28
  currentStockQty: numeric('current_stock_qty', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  reorderThresholdQty: numeric('reorder_threshold_qty', { precision: 10, scale: 2 })
    .default('10')
    .notNull(),
  unit: varchar('unit', { length: 16 }).default('KG').notNull(),
  supplierName: varchar('supplier_name', { length: 120 }),
  supplierWhatsapp: varchar('supplier_whatsapp', { length: 20 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Kacha Bills & GSTR-1 Ledger (#18 & #25)
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    merchantId: uuid('merchant_id')
      .references(() => merchants.id, { onDelete: 'cascade' })
      .notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 64 }).notNull(),
    imageUrl: text('image_url').notNull(),
    status: varchar('status', { length: 24 }).default('NEEDS_REVIEW').notNull(), // NEEDS_REVIEW | VERIFIED | EXPORTED
    paymentMode: varchar('payment_mode', { length: 24 }).default('CASH').notNull(),
    taxableAmountPaisa: integer('taxable_amount_paisa').notNull(),
    cgstPaisa: integer('cgst_paisa').default(0).notNull(),
    sgstPaisa: integer('sgst_paisa').default(0).notNull(),
    igstPaisa: integer('igst_paisa').default(0).notNull(),
    grandTotalPaisa: integer('grand_total_paisa').notNull(),
    rawExtractionJson: jsonb('raw_extraction_json').notNull(),
    anomaliesJson: jsonb('anomalies_json').default('[]').notNull(),
    invoiceDate: timestamp('invoice_date').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    merchantIdempotencyIdx: uniqueIndex('merchant_idempotency_idx').on(
      table.merchantId,
      table.idempotencyKey,
    ),
  }),
);

// 4. AutoFlow Approval Queue & Audit Trail (#19)
export const workflowApprovals = pgTable('workflow_approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id')
    .references(() => merchants.id, { onDelete: 'cascade' })
    .notNull(),
  sourceType: varchar('source_type', { length: 24 }).notNull(), // VOICE_COMMAND | LOW_STOCK_TRIGGER | ANOMALY_ALERT
  intent: varchar('intent', { length: 48 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  payloadJson: jsonb('payload_json').notNull(),
  status: varchar('status', { length: 24 }).default('PENDING').notNull(), // PENDING | APPROVED | REJECTED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

