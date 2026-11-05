# VyaparOS Data Model

The database model is hosted on Neon PostgreSQL and managed via Drizzle ORM.

## Relational Domains

### 1. Multi-Tenant Identity
- `merchants`:
  - `id`: UUID (Primary Key)
  - `supabaseUserId`: UUID (Unique)
  - `businessName`: VARCHAR(160)
  - `gstin`: VARCHAR(15)
  - `stateCode`: VARCHAR(2) (e.g., '03' for Punjab)
  - `preferredDialect`: VARCHAR(20) ('hinglish', 'pa', 'hi', 'en')

### 2. Inventory & Stock Movement
- `inventory_items`:
  - `id`: UUID (Primary Key)
  - `merchantId`: UUID (FK -> merchants.id)
  - `sku`: VARCHAR(64)
  - `nameEnglish`: VARCHAR(120)
  - `nameVernacular`: VARCHAR(120)
  - `hsnCode`: VARCHAR(8)
  - `gstRate`: INTEGER (0, 5, 12, 18, 28)
  - `currentStockQty`: NUMERIC(10, 2)
  - `reorderThresholdQty`: NUMERIC(10, 2)
  - `unit`: VARCHAR(16) ('KG', 'BAG', 'LTR', etc.)
  - `supplierName`: VARCHAR(120)
  - `supplierWhatsapp`: VARCHAR(20)

- `inventory_movements`:
  - `id`: UUID (Primary Key)
  - `merchantId`: UUID (FK -> merchants.id)
  - `itemId`: UUID (FK -> inventory_items.id)
  - `movementType`: VARCHAR(24) ('PURCHASE', 'SALE', 'RETURN_IN', 'DAMAGE', etc.)
  - `quantityChange`: NUMERIC(10, 2)
  - `unitCostPaise`: INTEGER
  - `timestamp`: TIMESTAMP

### 3. Invoices & Billing
- `invoices`:
  - `id`: UUID (Primary Key)
  - `merchantId`: UUID (FK -> merchants.id)
  - `idempotencyKey`: VARCHAR(64) (Unique per merchant)
  - `imageUrl`: TEXT
  - `status`: VARCHAR(24) ('DRAFT', 'NEEDS_REVIEW', 'VERIFIED', 'POSTED', 'RECONCILED')
  - `paymentMode`: VARCHAR(24) ('CASH', 'UPI', 'UDHAAR_CREDIT')
  - `taxableAmountPaisa`: INTEGER
  - `cgstPaisa`: INTEGER
  - `sgstPaisa`: INTEGER
  - `igstPaisa`: INTEGER
  - `grandTotalPaisa`: INTEGER
  - `rawExtractionJson`: JSONB
  - `anomaliesJson`: JSONB

### 4. Udhaar Customer Credit
- `parties`:
  - `id`: UUID (Primary Key)
  - `merchantId`: UUID (FK -> merchants.id)
  - `name`: VARCHAR(120)
  - `phone`: VARCHAR(15)
  - `creditLimitPaise`: INTEGER
  - `currentBalancePaise`: INTEGER

- `udhaar_transactions`:
  - `id`: UUID (Primary Key)
  - `merchantId`: UUID (FK -> merchants.id)
  - `customerId`: UUID (FK -> parties.id)
  - `transactionType`: VARCHAR(24) ('CREDIT_SALE', 'PAYMENT_RECEIVED', 'ADJUSTMENT')
  - `amountPaise`: INTEGER
  - `paymentMode`: VARCHAR(24)
  - `timestamp`: TIMESTAMP

### 5. Autonomous Workflows
- `workflow_approvals`:
  - `id`: UUID (Primary Key)
  - `merchantId`: UUID (FK -> merchants.id)
  - `sourceType`: VARCHAR(24) ('VOICE_COMMAND', 'LOW_STOCK_TRIGGER')
  - `intent`: VARCHAR(48)
  - `title`: VARCHAR(200)
  - `payloadJson`: JSONB
  - `status`: VARCHAR(24) ('PENDING', 'APPROVED', 'REJECTED')
  - `createdAt`: TIMESTAMP
  - `resolvedAt`: TIMESTAMP

