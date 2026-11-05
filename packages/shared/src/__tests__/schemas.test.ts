import { describe, it, expect } from 'vitest';
import {
  ExtractedLineItemSchema,
  AnomalyFlagSchema,
  KachaBillExtractionSchema,
  GSTR1B2CSItemSchema,
  GSTR1PayloadSchema,
  WorkflowActionSchema,
} from '../schemas/index.js';

// ──────────────────────────────────────────────────
// Helper: a valid line item factory
// ──────────────────────────────────────────────────
function validLineItem(overrides = {}) {
  return {
    rawTextVernacular: 'चीनी 5kg',
    normalizedItemName: 'Sugar',
    hsnCode: '17019910',
    quantity: 5,
    unit: 'KG' as const,
    unitPrice: 42,
    statedLineTotal: 210,
    gstRatePercent: '5' as const,
    confidenceScore: 0.92,
    ...overrides,
  };
}

function validBillExtraction(overrides = {}) {
  return {
    invoiceNumber: 'INV-001',
    invoiceDate: '2026-11-03',
    customerOrPartyName: 'Raju Kirana',
    customerGstin: '03AABCU9603R1ZM',
    isInterState: false,
    paymentMode: 'CASH' as const,
    lineItems: [validLineItem()],
    statedGrandTotal: 220.5,
    overallConfidence: 0.88,
    anomalies: [],
    ...overrides,
  };
}

// ──────────────────────────────────────────────────
// ExtractedLineItemSchema
// ──────────────────────────────────────────────────
describe('ExtractedLineItemSchema', () => {
  it('parses a valid line item', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gstRatePercent).toBe(5); // transformed from '5' → 5
    }
  });

  it('transforms gstRatePercent string enum to number', () => {
    const result = ExtractedLineItemSchema.parse(validLineItem({ gstRatePercent: '28' }));
    expect(result.gstRatePercent).toBe(28);
  });

  it('rejects invalid HSN code (too short)', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ hsnCode: '12' }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid HSN code (too long / 9 digits)', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ hsnCode: '123456789' }));
    expect(result.success).toBe(false);
  });

  it('rejects HSN code with letters', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ hsnCode: '1234ABCD' }));
    expect(result.success).toBe(false);
  });

  it('accepts 4-digit HSN code', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ hsnCode: '1701' }));
    expect(result.success).toBe(true);
  });

  it('rejects negative quantity', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ quantity: -1 }));
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ quantity: 0 }));
    expect(result.success).toBe(false);
  });

  it('rejects negative unitPrice', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ unitPrice: -10 }));
    expect(result.success).toBe(false);
  });

  it('allows zero unitPrice', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ unitPrice: 0 }));
    expect(result.success).toBe(true);
  });

  it('rejects confidence > 1', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ confidenceScore: 1.5 }));
    expect(result.success).toBe(false);
  });

  it('rejects confidence < 0', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ confidenceScore: -0.1 }));
    expect(result.success).toBe(false);
  });

  it('allows confidence exactly 0 and 1', () => {
    expect(ExtractedLineItemSchema.safeParse(validLineItem({ confidenceScore: 0 })).success).toBe(true);
    expect(ExtractedLineItemSchema.safeParse(validLineItem({ confidenceScore: 1 })).success).toBe(true);
  });

  it('rejects invalid unit enum', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ unit: 'GALLON' }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid gstRatePercent enum', () => {
    const result = ExtractedLineItemSchema.safeParse(validLineItem({ gstRatePercent: '15' }));
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────
// AnomalyFlagSchema
// ──────────────────────────────────────────────────
describe('AnomalyFlagSchema', () => {
  it('parses a valid anomaly flag', () => {
    const result = AnomalyFlagSchema.safeParse({
      code: 'ARITHMETIC_MISMATCH',
      fieldPath: 'lineItems[0].statedLineTotal',
      message: 'Line total does not match qty * price',
      expectedValue: 210,
      actualValue: 200,
    });
    expect(result.success).toBe(true);
  });

  it('allows optional expectedValue/actualValue', () => {
    const result = AnomalyFlagSchema.safeParse({
      code: 'LOW_OCR_CONFIDENCE',
      fieldPath: 'lineItems[1]',
      message: 'OCR confidence below threshold',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown anomaly code', () => {
    const result = AnomalyFlagSchema.safeParse({
      code: 'UNKNOWN_ERROR',
      fieldPath: 'test',
      message: 'test',
    });
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────
// KachaBillExtractionSchema
// ──────────────────────────────────────────────────
describe('KachaBillExtractionSchema', () => {
  it('parses a fully valid bill extraction', () => {
    const result = KachaBillExtractionSchema.safeParse(validBillExtraction());
    expect(result.success).toBe(true);
  });

  it('defaults isInterState to false', () => {
    const input = validBillExtraction();
    delete (input as any).isInterState;
    const result = KachaBillExtractionSchema.parse(input);
    expect(result.isInterState).toBe(false);
  });

  it('defaults anomalies to empty array', () => {
    const input = validBillExtraction();
    delete (input as any).anomalies;
    const result = KachaBillExtractionSchema.parse(input);
    expect(result.anomalies).toEqual([]);
  });

  it('accepts null invoiceNumber, invoiceDate, customerOrPartyName, customerGstin', () => {
    const result = KachaBillExtractionSchema.safeParse(
      validBillExtraction({
        invoiceNumber: null,
        invoiceDate: null,
        customerOrPartyName: null,
        customerGstin: null,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects empty lineItems array', () => {
    const result = KachaBillExtractionSchema.safeParse(
      validBillExtraction({ lineItems: [] }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects invalid paymentMode', () => {
    const result = KachaBillExtractionSchema.safeParse(
      validBillExtraction({ paymentMode: 'BITCOIN' }),
    );
    expect(result.success).toBe(false);
  });

  it('validates GSTIN format - valid', () => {
    const result = KachaBillExtractionSchema.safeParse(
      validBillExtraction({ customerGstin: '03AABCU9603R1ZM' }),
    );
    expect(result.success).toBe(true);
  });

  it('validates GSTIN format - invalid', () => {
    const result = KachaBillExtractionSchema.safeParse(
      validBillExtraction({ customerGstin: 'INVALID_GSTIN' }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects negative grandTotal', () => {
    const result = KachaBillExtractionSchema.safeParse(
      validBillExtraction({ statedGrandTotal: -100 }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects overall confidence > 1', () => {
    const result = KachaBillExtractionSchema.safeParse(
      validBillExtraction({ overallConfidence: 2 }),
    );
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────
// GSTR1B2CSItemSchema
// ──────────────────────────────────────────────────
describe('GSTR1B2CSItemSchema', () => {
  const validB2CS = {
    sply_ty: 'INTRA' as const,
    pos: '03',
    typ: 'OE' as const,
    txval: 10000,
    rt: 5,
    iamt: 0,
    camt: 250,
    samt: 250,
    csamt: 0,
  };

  it('parses a valid B2CS item', () => {
    const result = GSTR1B2CSItemSchema.safeParse(validB2CS);
    expect(result.success).toBe(true);
  });

  it('defaults csamt to 0', () => {
    const input = { ...validB2CS };
    delete (input as any).csamt;
    const result = GSTR1B2CSItemSchema.parse(input);
    expect(result.csamt).toBe(0);
  });

  it('rejects non-OE typ', () => {
    const result = GSTR1B2CSItemSchema.safeParse({ ...validB2CS, typ: 'XX' });
    expect(result.success).toBe(false);
  });

  it('rejects pos longer than 2 chars', () => {
    const result = GSTR1B2CSItemSchema.safeParse({ ...validB2CS, pos: '033' });
    expect(result.success).toBe(false);
  });

  it('rejects negative txval', () => {
    const result = GSTR1B2CSItemSchema.safeParse({ ...validB2CS, txval: -100 });
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────
// GSTR1PayloadSchema
// ──────────────────────────────────────────────────
describe('GSTR1PayloadSchema', () => {
  const validPayload = {
    gstin: '03AABCU9603R1ZM',
    fp: '112026',
    version: 'GST3.1.6' as const,
    hash: 'hash' as const,
    b2cs: [
      {
        sply_ty: 'INTRA' as const,
        pos: '03',
        typ: 'OE' as const,
        txval: 10000,
        rt: 5,
        iamt: 0,
        camt: 250,
        samt: 250,
        csamt: 0,
      },
    ],
  };

  it('parses a valid GSTR1 payload', () => {
    const result = GSTR1PayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects invalid fp format (wrong month)', () => {
    const result = GSTR1PayloadSchema.safeParse({ ...validPayload, fp: '132026' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid fp format (too short)', () => {
    const result = GSTR1PayloadSchema.safeParse({ ...validPayload, fp: '1120' });
    expect(result.success).toBe(false);
  });

  it('accepts fp 012026 (January)', () => {
    const result = GSTR1PayloadSchema.safeParse({ ...validPayload, fp: '012026' });
    expect(result.success).toBe(true);
  });

  it('accepts fp 122026 (December)', () => {
    const result = GSTR1PayloadSchema.safeParse({ ...validPayload, fp: '122026' });
    expect(result.success).toBe(true);
  });

  it('rejects fp 002026 (month 00)', () => {
    const result = GSTR1PayloadSchema.safeParse({ ...validPayload, fp: '002026' });
    expect(result.success).toBe(false);
  });

  it('rejects gstin with wrong length', () => {
    const result = GSTR1PayloadSchema.safeParse({ ...validPayload, gstin: '03AABCU960' });
    expect(result.success).toBe(false);
  });

  it('rejects wrong version', () => {
    const result = GSTR1PayloadSchema.safeParse({ ...validPayload, version: 'GST2.0' });
    expect(result.success).toBe(false);
  });

  it('rejects wrong hash', () => {
    const result = GSTR1PayloadSchema.safeParse({ ...validPayload, hash: 'wrong' });
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────
// WorkflowActionSchema
// ──────────────────────────────────────────────────
describe('WorkflowActionSchema', () => {
  const validAction = {
    intent: 'RECORD_CREDIT_UDHAAR' as const,
    spokenTranscript: 'Raju ka 500 rupay udhaar likh do',
    detectedLanguage: 'hinglish' as const,
    entities: {
      partyName: 'Raju',
      amountInr: 500,
    },
    requiresHumanApproval: true,
    spokenResponseVernacular: 'Raju ka ₹500 udhaar note kar diya hai',
  };

  it('parses a valid workflow action', () => {
    const result = WorkflowActionSchema.safeParse(validAction);
    expect(result.success).toBe(true);
  });

  it('defaults requiresHumanApproval to true', () => {
    const input = { ...validAction };
    delete (input as any).requiresHumanApproval;
    const result = WorkflowActionSchema.parse(input);
    expect(result.requiresHumanApproval).toBe(true);
  });

  it('allows all entity fields to be optional', () => {
    const result = WorkflowActionSchema.safeParse({
      ...validAction,
      entities: {},
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid intent', () => {
    const result = WorkflowActionSchema.safeParse({
      ...validAction,
      intent: 'INVALID_INTENT',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid detectedLanguage', () => {
    const result = WorkflowActionSchema.safeParse({
      ...validAction,
      detectedLanguage: 'fr-FR',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid intents', () => {
    const intents = [
      'RECORD_CREDIT_UDHAAR',
      'DEDUCT_INVENTORY',
      'RESTOCK_INVENTORY',
      'GENERATE_SUPPLIER_PO',
      'QUERY_LEDGER_SUMMARY',
    ];
    for (const intent of intents) {
      const result = WorkflowActionSchema.safeParse({ ...validAction, intent });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid languages', () => {
    const langs = ['hi-IN', 'pa-IN', 'en-IN', 'hinglish'];
    for (const detectedLanguage of langs) {
      const result = WorkflowActionSchema.safeParse({ ...validAction, detectedLanguage });
      expect(result.success).toBe(true);
    }
  });

  it('rejects missing spokenTranscript', () => {
    const input = { ...validAction };
    delete (input as any).spokenTranscript;
    const result = WorkflowActionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects missing spokenResponseVernacular', () => {
    const input = { ...validAction };
    delete (input as any).spokenResponseVernacular;
    const result = WorkflowActionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

