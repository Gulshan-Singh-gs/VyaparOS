/**
 * GST Calculator Engine
 *
 * Accepts a KachaBillExtraction and merchant state code.
 * Uses integer-paisa arithmetic to prevent floating-point errors.
 * Outputs a compliant GSTR1Payload object.
 */
import type { KachaBillExtraction, GSTR1Payload, GSTR1B2CSItem } from '../schemas/index.js';

/** Convert rupees (decimal) to paisa (integer) */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paisa (integer) to rupees (decimal, 2dp) */
export function paisaToRupees(paisa: number): number {
  return paisa / 100;
}

export interface GSTBreakdown {
  taxableAmountPaisa: number;
  cgstPaisa: number;
  sgstPaisa: number;
  igstPaisa: number;
  grandTotalPaisa: number;
  /** Aggregated by GST rate slab for GSTR-1 */
  slabAggregates: Map<number, SlabAggregate>;
}

export interface SlabAggregate {
  rate: number;
  taxableAmountPaisa: number;
  cgstPaisa: number;
  sgstPaisa: number;
  igstPaisa: number;
}

/**
 * Calculate GST breakdown from a KachaBillExtraction.
 * All arithmetic is done in paisa (integer) to prevent floating-point errors.
 */
export function calculateGSTBreakdown(
  extraction: KachaBillExtraction,
  merchantStateCode: string,
): GSTBreakdown {
  const isInterState = extraction.isInterState;
  const slabAggregates = new Map<number, SlabAggregate>();

  let totalTaxablePaisa = 0;
  let totalCgstPaisa = 0;
  let totalSgstPaisa = 0;
  let totalIgstPaisa = 0;

  for (const item of extraction.lineItems) {
    const gstRate = item.gstRatePercent; // Already transformed to number by Zod
    const lineTotalPaisa = rupeesToPaisa(item.statedLineTotal);

    // Taxable value is the line total (pre-tax) — the statedLineTotal
    // is treated as the taxable value for GST computation
    const taxablePaisa = lineTotalPaisa;

    let cgstPaisa = 0;
    let sgstPaisa = 0;
    let igstPaisa = 0;

    if (isInterState) {
      // IGST = full rate
      igstPaisa = Math.round((taxablePaisa * gstRate) / 100);
    } else {
      // CGST + SGST = rate/2 each
      // Use floor for CGST and subtract from total for SGST to handle odd paisa
      const totalTaxPaisa = Math.round((taxablePaisa * gstRate) / 100);
      cgstPaisa = Math.floor(totalTaxPaisa / 2);
      sgstPaisa = totalTaxPaisa - cgstPaisa; // Remainder goes to SGST
    }

    totalTaxablePaisa += taxablePaisa;
    totalCgstPaisa += cgstPaisa;
    totalSgstPaisa += sgstPaisa;
    totalIgstPaisa += igstPaisa;

    // Aggregate by slab
    const existing = slabAggregates.get(gstRate);
    if (existing) {
      existing.taxableAmountPaisa += taxablePaisa;
      existing.cgstPaisa += cgstPaisa;
      existing.sgstPaisa += sgstPaisa;
      existing.igstPaisa += igstPaisa;
    } else {
      slabAggregates.set(gstRate, {
        rate: gstRate,
        taxableAmountPaisa: taxablePaisa,
        cgstPaisa,
        sgstPaisa,
        igstPaisa,
      });
    }
  }

  return {
    taxableAmountPaisa: totalTaxablePaisa,
    cgstPaisa: totalCgstPaisa,
    sgstPaisa: totalSgstPaisa,
    igstPaisa: totalIgstPaisa,
    grandTotalPaisa: totalTaxablePaisa + totalCgstPaisa + totalSgstPaisa + totalIgstPaisa,
    slabAggregates,
  };
}

/**
 * Generate a compliant GSTR-1 Payload from a KachaBillExtraction.
 */
export function generateGSTR1Payload(
  extraction: KachaBillExtraction,
  merchantGstin: string,
  merchantStateCode: string,
  filingPeriod: string, // MMYYYY format, e.g. '112026'
): GSTR1Payload {
  const breakdown = calculateGSTBreakdown(extraction, merchantStateCode);
  const isInterState = extraction.isInterState;

  const b2cs: GSTR1B2CSItem[] = [];

  for (const [rate, slab] of breakdown.slabAggregates) {
    b2cs.push({
      sply_ty: isInterState ? 'INTER' : 'INTRA',
      pos: merchantStateCode,
      typ: 'OE',
      txval: paisaToRupees(slab.taxableAmountPaisa),
      rt: rate,
      iamt: paisaToRupees(slab.igstPaisa),
      camt: paisaToRupees(slab.cgstPaisa),
      samt: paisaToRupees(slab.sgstPaisa),
      csamt: 0,
    });
  }

  return {
    gstin: merchantGstin,
    fp: filingPeriod,
    version: 'GST3.1.6',
    hash: 'hash',
    b2cs,
  };
}

