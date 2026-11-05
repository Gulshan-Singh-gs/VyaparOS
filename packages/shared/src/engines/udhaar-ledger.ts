/**
 * Udhaar (Customer Credit) Ledger Engine for VyaparOS
 * 
 * Invariant: Never overwrite customer balances directly.
 * Balances are strictly calculated from ledger transactions or verified through double-entry audit.
 */

export type UdhaarTransactionType = 
  | 'CREDIT_SALE'
  | 'PAYMENT_RECEIVED'
  | 'ADJUSTMENT'
  | 'REVERSAL';

export interface UdhaarTransaction {
  id: string;
  customerId: string;
  transactionType: UdhaarTransactionType;
  amountPaise: number; // positive for credit given (merchant receivable increases), positive for payment received (settles balance)
  paymentMode?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  referenceInvoiceId?: string;
  notes?: string;
  dueDate?: string; // ISO 8601 YYYY-MM-DD
  timestamp: string;
}

export interface CustomerUdhaarSummary {
  customerId: string;
  customerName: string;
  phone: string;
  totalReceivablePaise: number; // net outstanding balance merchant is owed
  totalCreditGivenPaise: number;
  totalPaymentsCollectedPaise: number;
  lastPaymentDate?: string;
  isOverdue: boolean;
  agingBucket: 'CURRENT' | '1_15_DAYS' | '16_30_DAYS' | 'OVER_30_DAYS';
}

/**
 * Compute the net outstanding credit balance for a customer from ledger records
 * Positive value = customer owes merchant
 */
export function calculateUdhaarBalance(transactions: UdhaarTransaction[]): number {
  let netReceivablePaise = 0;

  for (const tx of transactions) {
    switch (tx.transactionType) {
      case 'CREDIT_SALE':
        netReceivablePaise += tx.amountPaise;
        break;
      case 'PAYMENT_RECEIVED':
        netReceivablePaise -= tx.amountPaise;
        break;
      case 'ADJUSTMENT':
        // Positive or negative based on sign
        netReceivablePaise += tx.amountPaise;
        break;
      case 'REVERSAL':
        netReceivablePaise -= tx.amountPaise;
        break;
    }
  }

  return netReceivablePaise;
}

/**
 * Determine customer credit aging category
 */
export function calculateAgingBucket(
  dueDate?: string,
  nowIso = new Date().toISOString()
): 'CURRENT' | '1_15_DAYS' | '16_30_DAYS' | 'OVER_30_DAYS' {
  if (!dueDate) return 'CURRENT';
  
  const due = new Date(dueDate).getTime();
  const now = new Date(nowIso).getTime();
  
  if (now <= due) return 'CURRENT';
  
  const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  
  if (daysOverdue <= 15) return '1_15_DAYS';
  if (daysOverdue <= 30) return '16_30_DAYS';
  return 'OVER_30_DAYS';
}

/**
 * Allocate payment against oldest outstanding credit sales (FIFO order)
 */
export function allocatePaymentFifo(
  paymentAmountPaise: number,
  unsettledInvoices: Array<{ id: string; remainingPaise: number }>
): Array<{ invoiceId: string; allocatedPaise: number }> {
  let unallocated = paymentAmountPaise;
  const allocations: Array<{ invoiceId: string; allocatedPaise: number }> = [];

  for (const inv of unsettledInvoices) {
    if (unallocated <= 0) break;
    const toAllocate = Math.min(unallocated, inv.remainingPaise);
    allocations.push({ invoiceId: inv.id, allocatedPaise: toAllocate });
    unallocated -= toAllocate;
  }

  return allocations;
}

