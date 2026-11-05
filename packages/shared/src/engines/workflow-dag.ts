/**
 * Workflow DAG Engine
 *
 * Accepts current inventory state and an invoice's extracted line items.
 * Deducts stock and emits GENERATE_SUPPLIER_PO workflow approval objects
 * whenever currentStockQty - deductedQty <= reorderThresholdQty.
 */

export interface InventoryState {
  itemName: string;
  sku: string;
  currentStockQty: number;
  reorderThresholdQty: number;
  unit: string;
  supplierName?: string;
  supplierWhatsapp?: string;
}

export interface DeductionItem {
  normalizedItemName: string;
  quantity: number;
  unit: string;
}

export interface WorkflowApprovalEmit {
  sourceType: 'LOW_STOCK_TRIGGER';
  intent: 'GENERATE_SUPPLIER_PO';
  title: string;
  payload: {
    itemName: string;
    sku: string;
    currentStockQty: number;
    deductedQty: number;
    remainingQty: number;
    reorderThresholdQty: number;
    suggestedReorderQty: number;
    unit: string;
    supplierName?: string;
    supplierWhatsapp?: string;
  };
}

export interface StockDeductionResult {
  updatedInventory: InventoryState[];
  workflowApprovals: WorkflowApprovalEmit[];
  deductionLog: Array<{
    itemName: string;
    deducted: number;
    previousQty: number;
    newQty: number;
  }>;
  unmatchedItems: string[];
}

/**
 * Normalize item name for matching: lowercase, trim whitespace.
 */
function normalizeItemName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Process an invoice's line items against inventory.
 * Returns updated inventory, workflow approvals for low stock, and deduction log.
 */
export function processStockDeductions(
  inventory: InventoryState[],
  lineItems: DeductionItem[],
): StockDeductionResult {
  // Deep clone inventory to avoid mutations
  const updatedInventory = inventory.map((item) => ({ ...item }));
  const workflowApprovals: WorkflowApprovalEmit[] = [];
  const deductionLog: StockDeductionResult['deductionLog'] = [];
  const unmatchedItems: string[] = [];

  // Build a lookup by normalized name
  const inventoryMap = new Map<string, InventoryState>();
  for (const item of updatedInventory) {
    inventoryMap.set(normalizeItemName(item.itemName), item);
  }

  for (const lineItem of lineItems) {
    const normalizedName = normalizeItemName(lineItem.normalizedItemName);
    const inventoryItem = inventoryMap.get(normalizedName);

    if (!inventoryItem) {
      unmatchedItems.push(lineItem.normalizedItemName);
      continue;
    }

    const previousQty = inventoryItem.currentStockQty;
    const deductedQty = lineItem.quantity;
    const newQty = previousQty - deductedQty;

    // Update inventory
    inventoryItem.currentStockQty = newQty;

    deductionLog.push({
      itemName: inventoryItem.itemName,
      deducted: deductedQty,
      previousQty,
      newQty,
    });

    // Check if stock has dropped to or below reorder threshold
    if (newQty <= inventoryItem.reorderThresholdQty) {
      // Suggest reorder qty: enough to bring stock back to 2x threshold
      const suggestedReorderQty = Math.max(
        inventoryItem.reorderThresholdQty * 2 - newQty,
        inventoryItem.reorderThresholdQty,
      );

      workflowApprovals.push({
        sourceType: 'LOW_STOCK_TRIGGER',
        intent: 'GENERATE_SUPPLIER_PO',
        title: `Low stock alert: ${inventoryItem.itemName} (${newQty} ${inventoryItem.unit} remaining)`,
        payload: {
          itemName: inventoryItem.itemName,
          sku: inventoryItem.sku,
          currentStockQty: previousQty,
          deductedQty,
          remainingQty: newQty,
          reorderThresholdQty: inventoryItem.reorderThresholdQty,
          suggestedReorderQty,
          unit: inventoryItem.unit,
          supplierName: inventoryItem.supplierName,
          supplierWhatsapp: inventoryItem.supplierWhatsapp,
        },
      });
    }
  }

  return {
    updatedInventory,
    workflowApprovals,
    deductionLog,
    unmatchedItems,
  };
}

