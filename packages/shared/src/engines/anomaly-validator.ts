/**
 * Anomaly Validator Engine
 *
 * Inspects KachaBillExtraction line items and flags:
 * - ARITHMETIC_MISMATCH: if qty * unitPrice != statedLineTotal (paisa precision)
 * - LOW_OCR_CONFIDENCE: if any item has confidenceScore < 0.78
 * - Grand total mismatch: if sum of line totals != statedGrandTotal
 */
import type { KachaBillExtraction, AnomalyFlag } from '../schemas/index.js';
import { rupeesToPaisa } from './gst-calculator.js';

const OCR_CONFIDENCE_THRESHOLD = 0.78;

/**
 * Validate a KachaBillExtraction and return an array of anomaly flags.
 */
export function validateBillAnomalies(extraction: KachaBillExtraction): AnomalyFlag[] {
  const anomalies: AnomalyFlag[] = [];

  let computedGrandTotalPaisa = 0;

  for (let i = 0; i < extraction.lineItems.length; i++) {
    const item = extraction.lineItems[i];
    const fieldPrefix = `lineItems[${i}]`;

    // Check arithmetic: qty * unitPrice == statedLineTotal (at paisa precision)
    const expectedPaisa = Math.round(item.quantity * item.unitPrice * 100);
    const actualPaisa = Math.round(item.statedLineTotal * 100);

    if (expectedPaisa !== actualPaisa) {
      anomalies.push({
        code: 'ARITHMETIC_MISMATCH',
        fieldPath: `${fieldPrefix}.statedLineTotal`,
        message: `Line total mismatch: expected ${expectedPaisa / 100} (qty ${item.quantity} × price ${item.unitPrice}), got ${item.statedLineTotal}`,
        expectedValue: expectedPaisa / 100,
        actualValue: item.statedLineTotal,
      });
    }

    // Check OCR confidence
    if (item.confidenceScore < OCR_CONFIDENCE_THRESHOLD) {
      anomalies.push({
        code: 'LOW_OCR_CONFIDENCE',
        fieldPath: `${fieldPrefix}.confidenceScore`,
        message: `OCR confidence ${item.confidenceScore} is below threshold ${OCR_CONFIDENCE_THRESHOLD}`,
        expectedValue: OCR_CONFIDENCE_THRESHOLD,
        actualValue: item.confidenceScore,
      });
    }

    computedGrandTotalPaisa += rupeesToPaisa(item.statedLineTotal);
  }

  // Check grand total
  const statedGrandTotalPaisa = rupeesToPaisa(extraction.statedGrandTotal);
  if (computedGrandTotalPaisa !== statedGrandTotalPaisa) {
    anomalies.push({
      code: 'ARITHMETIC_MISMATCH',
      fieldPath: 'statedGrandTotal',
      message: `Grand total mismatch: sum of line totals = ${computedGrandTotalPaisa / 100}, stated grand total = ${extraction.statedGrandTotal}`,
      expectedValue: computedGrandTotalPaisa / 100,
      actualValue: extraction.statedGrandTotal,
    });
  }

  return anomalies;
}

