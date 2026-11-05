/**
 * Inventory Movement Ledger Engine for VyaparOS
 * 
 * Stock is never stored as an untraceable mutable counter.
 * All stock mutations are calculated from append-only movement ledgers.
 */

export type InventoryMovementType = 
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'TRANSFER'
  | 'REVERSAL';

export interface InventoryMovement {
  id: string;
  itemId: string;
  movementType: InventoryMovementType;
  quantityChange: number; // positive for addition, negative for deduction
  unitCostPaise?: number;
  referenceType?: 'INVOICE' | 'PURCHASE_ORDER' | 'MANUAL_AUDIT' | 'DAMAGED_LOG';
  referenceId?: string;
  notes?: string;
  timestamp: string;
}

export interface InventoryItemState {
  id: string;
  sku: string;
  nameEnglish: string;
  nameVernacular: string;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  isLowStock: boolean;
  hsnCode: string;
  gstRate: number;
  unitPricePaise: number;
  supplierName?: string;
  supplierWhatsapp?: string;
}

/**
 * Calculate net stock level from an array of immutable movements
 */
export function calculateStockLevel(movements: InventoryMovement[]): number {
  return movements.reduce((acc, mov) => acc + mov.quantityChange, 0);
}

/**
 * Determine if an item has fallen below reorder threshold
 */
export function checkReorderNeeded(currentStock: number, threshold: number): boolean {
  return currentStock <= threshold;
}

/**
 * Validate and create an inventory movement
 */
export function createInventoryMovement(params: {
  id: string;
  itemId: string;
  movementType: InventoryMovementType;
  quantity: number; // unsigned magnitude
  unitCostPaise?: number;
  referenceType?: 'INVOICE' | 'PURCHASE_ORDER' | 'MANUAL_AUDIT' | 'DAMAGED_LOG';
  referenceId?: string;
  notes?: string;
  timestamp?: string;
  allowNegativeStock?: boolean;
  currentStock?: number;
}): InventoryMovement {
  const {
    id,
    itemId,
    movementType,
    quantity,
    unitCostPaise,
    referenceType,
    referenceId,
    notes,
    timestamp = new Date().toISOString(),
    allowNegativeStock = false,
    currentStock = 0,
  } = params;

  if (quantity <= 0) {
    throw new Error('Movement quantity must be strictly positive');
  }

  let quantityChange = 0;

  switch (movementType) {
    case 'PURCHASE':
    case 'RETURN_IN':
      quantityChange = quantity;
      break;
    case 'SALE':
    case 'RETURN_OUT':
    case 'DAMAGE':
      quantityChange = -quantity;
      break;
    case 'ADJUSTMENT':
    case 'TRANSFER':
    case 'REVERSAL':
      // Can be either positive or negative as passed in notes/logic, but for unsigned magnitude:
      quantityChange = quantity;
      break;
    default:
      throw new Error(`Unsupported movement type: ${movementType}`);
  }

  if (!allowNegativeStock && quantityChange < 0 && (currentStock + quantityChange) < 0) {
    throw new Error(
      `Insufficient stock: current stock is ${currentStock}, attempted deduction of ${quantity}`
    );
  }

  return {
    id,
    itemId,
    movementType,
    quantityChange,
    unitCostPaise,
    referenceType,
    referenceId,
    notes,
    timestamp,
  };
}

