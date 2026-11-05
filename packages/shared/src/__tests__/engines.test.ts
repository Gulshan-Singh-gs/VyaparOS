import { describe, it, expect } from 'vitest';
import {
  rupeesToPaisa,
  paisaToRupees,
  calculateGSTBreakdown,
  generateGSTR1Payload,
} from '../engines/gst-calculator.js';
import { validateBillAnomalies } from '../engines/anomaly-validator.js';
import {
  processStockDeductions,
  type InventoryState,
  type DeductionItem,
} from '../engines/workflow-dag.js';
import {
  rupeesToPaise,
  paiseToRupees,
  formatRupees,
  addMoney,
  subtractMoney,
  calculatePercentagePaise,
} from '../engines/money.js';
import {
  calculateStockLevel,
  checkReorderNeeded,
  createInventoryMovement,
  type InventoryMovement,
} from '../engines/inventory-ledger.js';
import {
  calculateUdhaarBalance,
  calculateAgingBucket,
  allocatePaymentFifo,
  type UdhaarTransaction,
} from '../engines/udhaar-ledger.js';
import type { KachaBillExtraction } from '../schemas/index.js';

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────
function makeExtraction(overrides: Partial<KachaBillExtraction> = {}): KachaBillExtraction {
  return {
    invoiceNumber: 'INV-001',
    invoiceDate: '2026-11-03',
    customerOrPartyName: 'Raju Kirana',
    customerGstin: null,
    isInterState: false,
    paymentMode: 'CASH',
    lineItems: [
      {
        rawTextVernacular: 'चीनी 5kg',
        normalizedItemName: 'Sugar',
        hsnCode: '17019910',
        quantity: 5,
        unit: 'KG',
        unitPrice: 42,
        statedLineTotal: 210,
        gstRatePercent: 5, // Already transformed by Zod
        confidenceScore: 0.92,
      },
    ],
    statedGrandTotal: 210,
    overallConfidence: 0.88,
    anomalies: [],
    ...overrides,
  };
}

// ──────────────────────────────────────────────────
// GST Calculator Tests
// ──────────────────────────────────────────────────
describe('GST Calculator Engine', () => {
  describe('rupeesToPaisa / paisaToRupees', () => {
    it('converts rupees to paisa correctly', () => {
      expect(rupeesToPaisa(100)).toBe(10000);
      expect(rupeesToPaisa(0.01)).toBe(1);
      expect(rupeesToPaisa(0)).toBe(0);
    });

    it('handles fractional paisa via rounding', () => {
      // 33.335 rupees → should round to 3334 paisa
      expect(rupeesToPaisa(33.335)).toBe(3334);
      // 33.334 rupees → should round to 3333 paisa
      expect(rupeesToPaisa(33.334)).toBe(3333);
    });

    it('converts paisa to rupees correctly', () => {
      expect(paisaToRupees(10000)).toBe(100);
      expect(paisaToRupees(1)).toBe(0.01);
      expect(paisaToRupees(0)).toBe(0);
    });
  });

  describe('calculateGSTBreakdown — Intra-state (CGST + SGST)', () => {
    it('calculates correct breakdown for a single 5% item', () => {
      const extraction = makeExtraction();
      const breakdown = calculateGSTBreakdown(extraction, '03');

      // 210 rupees taxable = 21000 paisa
      expect(breakdown.taxableAmountPaisa).toBe(21000);
      // 5% of 21000 = 1050 paisa total tax
      // CGST = floor(1050 / 2) = 525
      // SGST = 1050 - 525 = 525
      expect(breakdown.cgstPaisa).toBe(525);
      expect(breakdown.sgstPaisa).toBe(525);
      expect(breakdown.igstPaisa).toBe(0);
      expect(breakdown.grandTotalPaisa).toBe(21000 + 525 + 525);
    });

    it('handles odd paisa split (CGST gets floor, SGST gets remainder)', () => {
      // 3 rupees at 5% = 300 paisa taxable
      // 5% of 300 = 15 paisa total tax
      // CGST = floor(15/2) = 7, SGST = 15 - 7 = 8
      const extraction = makeExtraction({
        lineItems: [
          {
            rawTextVernacular: 'test',
            normalizedItemName: 'Test',
            hsnCode: '1234',
            quantity: 1,
            unit: 'PCS',
            unitPrice: 3,
            statedLineTotal: 3,
            gstRatePercent: 5,
            confidenceScore: 0.9,
          },
        ],
        statedGrandTotal: 3,
      });

      const breakdown = calculateGSTBreakdown(extraction, '03');
      expect(breakdown.cgstPaisa).toBe(7);
      expect(breakdown.sgstPaisa).toBe(8);
      expect(breakdown.igstPaisa).toBe(0);
    });

    it('aggregates multiple items in same slab', () => {
      const extraction = makeExtraction({
        lineItems: [
          {
            rawTextVernacular: 'चीनी',
            normalizedItemName: 'Sugar',
            hsnCode: '17019910',
            quantity: 5,
            unit: 'KG',
            unitPrice: 42,
            statedLineTotal: 210,
            gstRatePercent: 5,
            confidenceScore: 0.92,
          },
          {
            rawTextVernacular: 'चावल',
            normalizedItemName: 'Rice',
            hsnCode: '10063010',
            quantity: 10,
            unit: 'KG',
            unitPrice: 60,
            statedLineTotal: 600,
            gstRatePercent: 5,
            confidenceScore: 0.95,
          },
        ],
        statedGrandTotal: 810,
      });

      const breakdown = calculateGSTBreakdown(extraction, '03');
      // Total taxable at 5%: 210 + 600 = 810 rupees = 81000 paisa
      expect(breakdown.taxableAmountPaisa).toBe(81000);

      const slab5 = breakdown.slabAggregates.get(5);
      expect(slab5).toBeDefined();
      expect(slab5!.taxableAmountPaisa).toBe(81000);
    });

    it('handles multiple GST rate slabs', () => {
      const extraction = makeExtraction({
        lineItems: [
          {
            rawTextVernacular: 'चीनी',
            normalizedItemName: 'Sugar',
            hsnCode: '17019910',
            quantity: 5,
            unit: 'KG',
            unitPrice: 42,
            statedLineTotal: 210,
            gstRatePercent: 5,
            confidenceScore: 0.92,
          },
          {
            rawTextVernacular: 'साबुन',
            normalizedItemName: 'Soap',
            hsnCode: '34011110',
            quantity: 3,
            unit: 'PCS',
            unitPrice: 50,
            statedLineTotal: 150,
            gstRatePercent: 18,
            confidenceScore: 0.89,
          },
        ],
        statedGrandTotal: 360,
      });

      const breakdown = calculateGSTBreakdown(extraction, '03');
      expect(breakdown.slabAggregates.size).toBe(2);
      expect(breakdown.slabAggregates.has(5)).toBe(true);
      expect(breakdown.slabAggregates.has(18)).toBe(true);
    });

    it('handles 0% GST rate (no tax)', () => {
      const extraction = makeExtraction({
        lineItems: [
          {
            rawTextVernacular: 'आटा',
            normalizedItemName: 'Wheat Flour',
            hsnCode: '11010000',
            quantity: 10,
            unit: 'KG',
            unitPrice: 30,
            statedLineTotal: 300,
            gstRatePercent: 0,
            confidenceScore: 0.95,
          },
        ],
        statedGrandTotal: 300,
      });

      const breakdown = calculateGSTBreakdown(extraction, '03');
      expect(breakdown.cgstPaisa).toBe(0);
      expect(breakdown.sgstPaisa).toBe(0);
      expect(breakdown.igstPaisa).toBe(0);
      expect(breakdown.grandTotalPaisa).toBe(30000);
    });
  });

  describe('calculateGSTBreakdown — Inter-state (IGST)', () => {
    it('applies IGST instead of CGST/SGST for inter-state', () => {
      const extraction = makeExtraction({ isInterState: true });
      const breakdown = calculateGSTBreakdown(extraction, '03');

      expect(breakdown.cgstPaisa).toBe(0);
      expect(breakdown.sgstPaisa).toBe(0);
      // 5% of 21000 = 1050
      expect(breakdown.igstPaisa).toBe(1050);
      expect(breakdown.grandTotalPaisa).toBe(21000 + 1050);
    });
  });

  describe('generateGSTR1Payload', () => {
    it('produces a valid GSTR-1 payload', () => {
      const extraction = makeExtraction();
      const payload = generateGSTR1Payload(extraction, '03AABCU9603R1ZM', '03', '112026');

      expect(payload.gstin).toBe('03AABCU9603R1ZM');
      expect(payload.fp).toBe('112026');
      expect(payload.version).toBe('GST3.1.6');
      expect(payload.hash).toBe('hash');
      expect(payload.b2cs.length).toBe(1);

      const b2cs = payload.b2cs[0];
      expect(b2cs.sply_ty).toBe('INTRA');
      expect(b2cs.pos).toBe('03');
      expect(b2cs.typ).toBe('OE');
      expect(b2cs.txval).toBe(210); // rupees
      expect(b2cs.rt).toBe(5);
      expect(b2cs.camt).toBe(5.25); // 525 paisa = 5.25 rupees
      expect(b2cs.samt).toBe(5.25);
      expect(b2cs.iamt).toBe(0);
    });

    it('produces INTER supply type for inter-state', () => {
      const extraction = makeExtraction({ isInterState: true });
      const payload = generateGSTR1Payload(extraction, '03AABCU9603R1ZM', '03', '112026');

      expect(payload.b2cs[0].sply_ty).toBe('INTER');
      expect(payload.b2cs[0].iamt).toBe(10.5); // 5% of 210
      expect(payload.b2cs[0].camt).toBe(0);
      expect(payload.b2cs[0].samt).toBe(0);
    });
  });
});

// ──────────────────────────────────────────────────
// Anomaly Validator Tests
// ──────────────────────────────────────────────────
describe('Anomaly Validator Engine', () => {
  it('returns no anomalies for a clean bill', () => {
    const extraction = makeExtraction();
    const anomalies = validateBillAnomalies(extraction);
    expect(anomalies).toEqual([]);
  });

  it('flags ARITHMETIC_MISMATCH when qty * price != statedLineTotal', () => {
    const extraction = makeExtraction({
      lineItems: [
        {
          rawTextVernacular: 'चीनी',
          normalizedItemName: 'Sugar',
          hsnCode: '17019910',
          quantity: 5,
          unit: 'KG',
          unitPrice: 42,
          statedLineTotal: 200, // Should be 210 (5 * 42)
          gstRatePercent: 5,
          confidenceScore: 0.92,
        },
      ],
      statedGrandTotal: 200,
    });

    const anomalies = validateBillAnomalies(extraction);
    const mismatch = anomalies.find(
      (a) => a.code === 'ARITHMETIC_MISMATCH' && a.fieldPath.includes('lineItems'),
    );
    expect(mismatch).toBeDefined();
    expect(mismatch!.expectedValue).toBe(210);
    expect(mismatch!.actualValue).toBe(200);
  });

  it('flags LOW_OCR_CONFIDENCE when confidence < 0.78', () => {
    const extraction = makeExtraction({
      lineItems: [
        {
          rawTextVernacular: 'चीनी',
          normalizedItemName: 'Sugar',
          hsnCode: '17019910',
          quantity: 5,
          unit: 'KG',
          unitPrice: 42,
          statedLineTotal: 210,
          gstRatePercent: 5,
          confidenceScore: 0.65, // Below 0.78
        },
      ],
      statedGrandTotal: 210,
    });

    const anomalies = validateBillAnomalies(extraction);
    const lowConf = anomalies.find((a) => a.code === 'LOW_OCR_CONFIDENCE');
    expect(lowConf).toBeDefined();
    expect(lowConf!.actualValue).toBe(0.65);
  });

  it('does NOT flag confidence exactly at 0.78', () => {
    const extraction = makeExtraction({
      lineItems: [
        {
          rawTextVernacular: 'test',
          normalizedItemName: 'Test',
          hsnCode: '1234',
          quantity: 1,
          unit: 'PCS',
          unitPrice: 100,
          statedLineTotal: 100,
          gstRatePercent: 5,
          confidenceScore: 0.78, // Exactly at threshold
        },
      ],
      statedGrandTotal: 100,
    });

    const anomalies = validateBillAnomalies(extraction);
    expect(anomalies.find((a) => a.code === 'LOW_OCR_CONFIDENCE')).toBeUndefined();
  });

  it('flags grand total mismatch', () => {
    const extraction = makeExtraction({
      lineItems: [
        {
          rawTextVernacular: 'चीनी',
          normalizedItemName: 'Sugar',
          hsnCode: '17019910',
          quantity: 5,
          unit: 'KG',
          unitPrice: 42,
          statedLineTotal: 210,
          gstRatePercent: 5,
          confidenceScore: 0.92,
        },
      ],
      statedGrandTotal: 250, // Should be 210
    });

    const anomalies = validateBillAnomalies(extraction);
    const grandTotalMismatch = anomalies.find(
      (a) => a.code === 'ARITHMETIC_MISMATCH' && a.fieldPath === 'statedGrandTotal',
    );
    expect(grandTotalMismatch).toBeDefined();
    expect(grandTotalMismatch!.expectedValue).toBe(210);
    expect(grandTotalMismatch!.actualValue).toBe(250);
  });

  it('handles multiple anomalies simultaneously', () => {
    const extraction = makeExtraction({
      lineItems: [
        {
          rawTextVernacular: 'चीनी',
          normalizedItemName: 'Sugar',
          hsnCode: '17019910',
          quantity: 5,
          unit: 'KG',
          unitPrice: 42,
          statedLineTotal: 200, // Wrong (should be 210) → ARITHMETIC_MISMATCH
          gstRatePercent: 5,
          confidenceScore: 0.5, // LOW_OCR_CONFIDENCE
        },
      ],
      statedGrandTotal: 999, // Wrong → another ARITHMETIC_MISMATCH
    });

    const anomalies = validateBillAnomalies(extraction);
    expect(anomalies.length).toBe(3);
    expect(anomalies.filter((a) => a.code === 'ARITHMETIC_MISMATCH').length).toBe(2);
    expect(anomalies.filter((a) => a.code === 'LOW_OCR_CONFIDENCE').length).toBe(1);
  });

  it('handles floating-point edge: 1.1 * 9.09 = 9.999 (rounds correctly)', () => {
    const extraction = makeExtraction({
      lineItems: [
        {
          rawTextVernacular: 'test',
          normalizedItemName: 'Test',
          hsnCode: '1234',
          quantity: 1.1,
          unit: 'KG',
          unitPrice: 9.09,
          statedLineTotal: 9.999, // 1.1 * 9.09 = 9.999 exactly
          gstRatePercent: 0,
          confidenceScore: 0.9,
        },
      ],
      statedGrandTotal: 9.999,
    });

    const anomalies = validateBillAnomalies(extraction);
    // Math.round(1.1 * 9.09 * 100) = Math.round(999.9) = 1000
    // Math.round(9.999 * 100) = Math.round(999.9) = 1000
    // Should match
    expect(anomalies.filter((a) => a.fieldPath.includes('lineItems')).length).toBe(0);
  });
});

// ──────────────────────────────────────────────────
// Workflow DAG Tests
// ──────────────────────────────────────────────────
describe('Workflow DAG Engine', () => {
  const baseInventory: InventoryState[] = [
    {
      itemName: 'Sugar',
      sku: 'SKU-SUGAR-001',
      currentStockQty: 50,
      reorderThresholdQty: 10,
      unit: 'KG',
      supplierName: 'Gupta Traders',
      supplierWhatsapp: '+919876543210',
    },
    {
      itemName: 'Rice',
      sku: 'SKU-RICE-001',
      currentStockQty: 25,
      reorderThresholdQty: 15,
      unit: 'KG',
      supplierName: 'Sharma Rice Mill',
    },
    {
      itemName: 'Soap',
      sku: 'SKU-SOAP-001',
      currentStockQty: 12,
      reorderThresholdQty: 5,
      unit: 'PCS',
    },
  ];

  it('deducts stock without triggering reorder when above threshold', () => {
    const items: DeductionItem[] = [
      { normalizedItemName: 'Sugar', quantity: 5, unit: 'KG' },
    ];

    const result = processStockDeductions(baseInventory, items);

    expect(result.deductionLog.length).toBe(1);
    expect(result.deductionLog[0].previousQty).toBe(50);
    expect(result.deductionLog[0].newQty).toBe(45);
    expect(result.workflowApprovals.length).toBe(0);
    expect(result.unmatchedItems.length).toBe(0);
  });

  it('triggers LOW_STOCK_TRIGGER when stock drops to threshold', () => {
    const items: DeductionItem[] = [
      { normalizedItemName: 'Sugar', quantity: 40, unit: 'KG' }, // 50 - 40 = 10 = threshold
    ];

    const result = processStockDeductions(baseInventory, items);

    expect(result.workflowApprovals.length).toBe(1);
    const approval = result.workflowApprovals[0];
    expect(approval.sourceType).toBe('LOW_STOCK_TRIGGER');
    expect(approval.intent).toBe('GENERATE_SUPPLIER_PO');
    expect(approval.payload.remainingQty).toBe(10);
    expect(approval.payload.supplierName).toBe('Gupta Traders');
    expect(approval.payload.supplierWhatsapp).toBe('+919876543210');
  });

  it('triggers LOW_STOCK_TRIGGER when stock drops below threshold', () => {
    const items: DeductionItem[] = [
      { normalizedItemName: 'Sugar', quantity: 45, unit: 'KG' }, // 50 - 45 = 5 < 10
    ];

    const result = processStockDeductions(baseInventory, items);
    expect(result.workflowApprovals.length).toBe(1);
    expect(result.workflowApprovals[0].payload.remainingQty).toBe(5);
  });

  it('handles multiple items with mixed reorder triggers', () => {
    const items: DeductionItem[] = [
      { normalizedItemName: 'Sugar', quantity: 5, unit: 'KG' },   // 50→45 (above 10)
      { normalizedItemName: 'Rice', quantity: 15, unit: 'KG' },   // 25→10 (at 15 threshold → triggers)
      { normalizedItemName: 'Soap', quantity: 2, unit: 'PCS' },   // 12→10 (above 5)
    ];

    const result = processStockDeductions(baseInventory, items);
    expect(result.deductionLog.length).toBe(3);
    expect(result.workflowApprovals.length).toBe(1);
    expect(result.workflowApprovals[0].payload.itemName).toBe('Rice');
  });

  it('reports unmatched items (not in inventory)', () => {
    const items: DeductionItem[] = [
      { normalizedItemName: 'Ghost Pepper Sauce', quantity: 1, unit: 'PCS' },
    ];

    const result = processStockDeductions(baseInventory, items);
    expect(result.unmatchedItems.length).toBe(1);
    expect(result.unmatchedItems[0]).toBe('Ghost Pepper Sauce');
    expect(result.deductionLog.length).toBe(0);
  });

  it('does not mutate the original inventory array', () => {
    const inventoryCopy = baseInventory.map((i) => ({ ...i }));
    const items: DeductionItem[] = [
      { normalizedItemName: 'Sugar', quantity: 30, unit: 'KG' },
    ];

    processStockDeductions(inventoryCopy, items);
    // The original should be unchanged
    expect(baseInventory[0].currentStockQty).toBe(50);
  });

  it('handles case-insensitive item name matching', () => {
    const items: DeductionItem[] = [
      { normalizedItemName: 'sugar', quantity: 5, unit: 'KG' },
      { normalizedItemName: 'RICE', quantity: 3, unit: 'KG' },
    ];

    const result = processStockDeductions(baseInventory, items);
    expect(result.deductionLog.length).toBe(2);
    expect(result.unmatchedItems.length).toBe(0);
  });

  it('suggests reasonable reorder quantities', () => {
    const items: DeductionItem[] = [
      { normalizedItemName: 'Sugar', quantity: 48, unit: 'KG' }, // 50 → 2, threshold 10
    ];

    const result = processStockDeductions(baseInventory, items);
    const approval = result.workflowApprovals[0];
    // suggestedReorderQty = max(10 * 2 - 2, 10) = max(18, 10) = 18
    expect(approval.payload.suggestedReorderQty).toBe(18);
  });

  it('handles stock going negative (oversold)', () => {
    const items: DeductionItem[] = [
      { normalizedItemName: 'Sugar', quantity: 60, unit: 'KG' }, // 50 → -10
    ];

    const result = processStockDeductions(baseInventory, items);
    expect(result.deductionLog[0].newQty).toBe(-10);
    expect(result.workflowApprovals.length).toBe(1);
    expect(result.workflowApprovals[0].payload.remainingQty).toBe(-10);
  });
});

// ──────────────────────────────────────────────────
// Money Representation & Math Tests
// ──────────────────────────────────────────────────
describe('Money Representation Engine', () => {
  it('converts decimal rupees and string inputs to integer paise without float errors', () => {
    expect(rupeesToPaise(100)).toBe(10000);
    expect(rupeesToPaise(49.99)).toBe(4999);
    expect(rupeesToPaise('₹ 1,82,400.50')).toBe(18240050);
    expect(rupeesToPaise(0.001)).toBe(0);
  });

  it('converts integer paise back to decimal rupees', () => {
    expect(paiseToRupees(10000)).toBe(100);
    expect(paiseToRupees(4999)).toBe(49.99);
    expect(paiseToRupees(0)).toBe(0);
  });

  it('formats rupees with Indian numbering grouping (Lakhs & Crores)', () => {
    expect(formatRupees(18240000)).toBe('₹1,82,400.00');
    expect(formatRupees(1000000000)).toBe('₹1,00,00,000.00'); // 1 Crore
    expect(formatRupees(50000, false)).toBe('₹500');
    expect(formatRupees(-25000)).toBe('-₹250.00');
  });

  it('performs safe addition and subtraction of monetary paise', () => {
    expect(addMoney(1000, 2500, 5000)).toBe(8500);
    expect(subtractMoney(10000, 3500)).toBe(6500);
    expect(calculatePercentagePaise(10000, 18)).toBe(1800);
  });
});

// ──────────────────────────────────────────────────
// Inventory Ledger Engine Tests
// ──────────────────────────────────────────────────
describe('Inventory Ledger Engine', () => {
  it('calculates current stock balance from immutable movements', () => {
    const movements: InventoryMovement[] = [
      {
        id: 'mov_1',
        itemId: 'item_1',
        movementType: 'PURCHASE',
        quantityChange: 100,
        timestamp: '2026-11-01T10:00:00Z',
      },
      {
        id: 'mov_2',
        itemId: 'item_1',
        movementType: 'SALE',
        quantityChange: -35,
        timestamp: '2026-11-02T11:00:00Z',
      },
      {
        id: 'mov_3',
        itemId: 'item_1',
        movementType: 'DAMAGE',
        quantityChange: -5,
        timestamp: '2026-11-03T12:00:00Z',
      },
      {
        id: 'mov_4',
        itemId: 'item_1',
        movementType: 'RETURN_IN',
        quantityChange: 2,
        timestamp: '2026-11-04T09:00:00Z',
      },
    ];

    expect(calculateStockLevel(movements)).toBe(62);
  });

  it('detects when reorder threshold is triggered', () => {
    expect(checkReorderNeeded(5, 10)).toBe(true);
    expect(checkReorderNeeded(10, 10)).toBe(true);
    expect(checkReorderNeeded(11, 10)).toBe(false);
  });

  it('creates validated movements and enforces positive magnitudes', () => {
    const mov = createInventoryMovement({
      id: 'mov_5',
      itemId: 'item_1',
      movementType: 'PURCHASE',
      quantity: 50,
      unitCostPaise: 4000,
    });
    expect(mov.quantityChange).toBe(50);

    const saleMov = createInventoryMovement({
      id: 'mov_6',
      itemId: 'item_1',
      movementType: 'SALE',
      quantity: 20,
      currentStock: 50,
    });
    expect(saleMov.quantityChange).toBe(-20);

    expect(() =>
      createInventoryMovement({
        id: 'mov_err',
        itemId: 'item_1',
        movementType: 'SALE',
        quantity: -10,
      }),
    ).toThrow('Movement quantity must be strictly positive');
  });

  it('rejects overselling if negative stock is disallowed', () => {
    expect(() =>
      createInventoryMovement({
        id: 'mov_oversell',
        itemId: 'item_1',
        movementType: 'SALE',
        quantity: 25,
        currentStock: 20,
        allowNegativeStock: false,
      }),
    ).toThrow('Insufficient stock');
  });
});

// ──────────────────────────────────────────────────
// Udhaar Ledger Engine Tests
// ──────────────────────────────────────────────────
describe('Udhaar Ledger Engine', () => {
  it('calculates net customer credit balance from transactions', () => {
    const txs: UdhaarTransaction[] = [
      {
        id: 'tx_1',
        customerId: 'cust_1',
        transactionType: 'CREDIT_SALE',
        amountPaise: 50000, // +₹500
        timestamp: '2026-11-01T10:00:00Z',
      },
      {
        id: 'tx_2',
        customerId: 'cust_1',
        transactionType: 'PAYMENT_RECEIVED',
        amountPaise: 20000, // -₹200
        paymentMode: 'UPI',
        timestamp: '2026-11-02T10:00:00Z',
      },
      {
        id: 'tx_3',
        customerId: 'cust_1',
        transactionType: 'CREDIT_SALE',
        amountPaise: 15000, // +₹150
        timestamp: '2026-11-03T10:00:00Z',
      },
    ];

    expect(calculateUdhaarBalance(txs)).toBe(45000); // ₹450 owed
  });

  it('evaluates aging bucket correctly based on due date', () => {
    const now = '2026-11-05T00:00:00Z';
    expect(calculateAgingBucket('2026-11-10T00:00:00Z', now)).toBe('CURRENT');
    expect(calculateAgingBucket('2026-10-30T00:00:00Z', now)).toBe('1_15_DAYS'); // 6 days overdue
    expect(calculateAgingBucket('2026-10-15T00:00:00Z', now)).toBe('16_30_DAYS'); // 21 days overdue
    expect(calculateAgingBucket('2026-09-01T00:00:00Z', now)).toBe('OVER_30_DAYS'); // >30 days
  });

  it('allocates FIFO payments across outstanding invoices', () => {
    const invoices = [
      { id: 'inv_1', remainingPaise: 30000 },
      { id: 'inv_2', remainingPaise: 40000 },
      { id: 'inv_3', remainingPaise: 20000 },
    ];

    // Pay 500 INR (50,000 paise)
    const allocations = allocatePaymentFifo(50000, invoices);
    expect(allocations).toEqual([
      { invoiceId: 'inv_1', allocatedPaise: 30000 },
      { invoiceId: 'inv_2', allocatedPaise: 20000 },
    ]);
  });
});


