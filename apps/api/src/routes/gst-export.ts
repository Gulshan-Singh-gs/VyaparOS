/**
 * GST Export Route
 *
 * GET /api/v1/gst/export?fp=112026
 * Returns a downloadable GSTR-1 JSON file for the specified filing period.
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createDb } from '../db/index.js';
import { invoices } from '../db/schema.js';
import {
  generateGSTR1Payload,
  KachaBillExtractionSchema,
  type KachaBillExtraction,
} from '@vyapar-os/shared';
import type { AuthEnv, AuthVariables } from '../middleware/auth.js';

const gstExport = new Hono<{
  Bindings: AuthEnv;
  Variables: AuthVariables;
}>();

const FpQuerySchema = z.object({
  fp: z.string().regex(/^(0[1-9]|1[0-2])\d{4}$/, 'Format MMYYYY, e.g., 112026'),
});

gstExport.get('/export', async (c) => {
  const query = FpQuerySchema.safeParse({ fp: c.req.query('fp') });

  if (!query.success) {
    return c.json({ error: 'Invalid filing period', details: query.error.flatten() }, 400);
  }

  const { fp } = query.data;
  const merchantId = c.get('merchantId');
  const merchantGstin = c.get('merchantGstin');
  const merchantStateCode = c.get('merchantStateCode');

  const db = createDb({ DATABASE_URL: c.env.DATABASE_URL });

  // Parse filing period to date range
  const month = parseInt(fp.substring(0, 2), 10);
  const year = parseInt(fp.substring(2), 10);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

  // Fetch all verified invoices for the period
  const periodInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.merchantId, merchantId),
        eq(invoices.status, 'VERIFIED'),
      ),
    );

  // Filter by date range (in application layer since Neon HTTP may not support all operators)
  const filteredInvoices = periodInvoices.filter((inv) => {
    const invDate = new Date(inv.invoiceDate);
    return invDate >= startDate && invDate <= endDate;
  });

  if (filteredInvoices.length === 0) {
    return c.json({
      message: 'No verified invoices found for this filing period',
      fp,
      invoiceCount: 0,
    });
  }

  // Aggregate all invoices into a single GSTR-1 payload
  // For simplicity, we aggregate the b2cs entries across all invoices
  const allB2CSEntries: Array<{
    sply_ty: 'INTRA' | 'INTER';
    pos: string;
    typ: 'OE';
    txval: number;
    rt: number;
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
  }> = [];

  for (const inv of filteredInvoices) {
    try {
      const extraction = KachaBillExtractionSchema.parse(inv.rawExtractionJson);
      const payload = generateGSTR1Payload(
        extraction,
        merchantGstin,
        merchantStateCode,
        fp,
      );
      allB2CSEntries.push(...payload.b2cs);
    } catch {
      // Skip invoices with invalid extraction data
      continue;
    }
  }

  // Aggregate b2cs by (sply_ty, pos, rt) — merge same-rate entries
  const aggregated = new Map<string, typeof allB2CSEntries[0]>();
  for (const entry of allB2CSEntries) {
    const key = `${entry.sply_ty}_${entry.pos}_${entry.rt}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.txval += entry.txval;
      existing.iamt += entry.iamt;
      existing.camt += entry.camt;
      existing.samt += entry.samt;
      existing.csamt += entry.csamt;
    } else {
      aggregated.set(key, { ...entry });
    }
  }

  // Round to 2 decimal places
  const b2cs = Array.from(aggregated.values()).map((e) => ({
    ...e,
    txval: Math.round(e.txval * 100) / 100,
    iamt: Math.round(e.iamt * 100) / 100,
    camt: Math.round(e.camt * 100) / 100,
    samt: Math.round(e.samt * 100) / 100,
    csamt: Math.round(e.csamt * 100) / 100,
  }));

  const gstr1 = {
    gstin: merchantGstin,
    fp,
    version: 'GST3.1.6' as const,
    hash: 'hash' as const,
    b2cs,
  };

  // Return as downloadable JSON
  c.header('Content-Type', 'application/json');
  c.header('Content-Disposition', `attachment; filename="GSTR1_${merchantGstin}_${fp}.json"`);

  return c.json(gstr1);
});

export { gstExport };

