/**
 * Bill Scanning Route
 *
 * POST /api/v1/bills/scan
 * - Receives bill image (base64 or multipart)
 * - Runs Gemini OCR extraction
 * - Runs anomaly validator
 * - Calculates GST breakdown
 * - Inserts into Neon invoices table with idempotency protection
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { extractKachaBill } from '../services/gemini-multimodal.js';
import { validateBillAnomalies, calculateGSTBreakdown, rupeesToPaisa } from '@vyapar-os/shared';
import { createDb } from '../db/index.js';
import { invoices } from '../db/schema.js';
import type { AuthEnv, AuthVariables } from '../middleware/auth.js';
import type { IdempotencyVariables } from '../middleware/idempotency.js';

type BillsEnv = AuthEnv & {
  GEMINI_API_KEY: string;
};

const bills = new Hono<{
  Bindings: BillsEnv;
  Variables: AuthVariables & IdempotencyVariables;
}>();

const BillScanRequestSchema = z.object({
  imageBase64: z.string().min(1, 'Image data is required'),
  mimeType: z
    .enum(['image/jpeg', 'image/png', 'image/webp'])
    .default('image/jpeg'),
});

bills.post('/scan', async (c) => {
  const body = await c.req.json();
  const parsed = BillScanRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }

  const { imageBase64, mimeType } = parsed.data;
  const merchantId = c.get('merchantId');
  const merchantStateCode = c.get('merchantStateCode');
  const idempotencyKey = c.get('idempotencyKey');

  try {
    // 1. Run Gemini OCR extraction
    const extraction = await extractKachaBill(
      { GEMINI_API_KEY: c.env.GEMINI_API_KEY },
      imageBase64,
      mimeType,
    );

    // 2. Run anomaly validation
    const anomalies = validateBillAnomalies(extraction);

    // 3. Calculate GST breakdown
    const gstBreakdown = calculateGSTBreakdown(extraction, merchantStateCode);

    // 4. Insert into database with idempotency protection
    const db = createDb({ DATABASE_URL: c.env.DATABASE_URL });

    const [invoice] = await db
      .insert(invoices)
      .values({
        merchantId,
        idempotencyKey,
        imageUrl: `data:${mimeType};base64,${imageBase64.substring(0, 50)}...`, // Placeholder; real impl uses Storage
        status: anomalies.length > 0 ? 'NEEDS_REVIEW' : 'VERIFIED',
        paymentMode: extraction.paymentMode,
        taxableAmountPaisa: gstBreakdown.taxableAmountPaisa,
        cgstPaisa: gstBreakdown.cgstPaisa,
        sgstPaisa: gstBreakdown.sgstPaisa,
        igstPaisa: gstBreakdown.igstPaisa,
        grandTotalPaisa: gstBreakdown.grandTotalPaisa,
        rawExtractionJson: extraction,
        anomaliesJson: anomalies,
        invoiceDate: extraction.invoiceDate
          ? new Date(extraction.invoiceDate)
          : new Date(),
      })
      .returning();

    return c.json({
      success: true,
      invoice: {
        id: invoice.id,
        status: invoice.status,
        extraction,
        anomalies,
        gstBreakdown: {
          taxableAmount: gstBreakdown.taxableAmountPaisa / 100,
          cgst: gstBreakdown.cgstPaisa / 100,
          sgst: gstBreakdown.sgstPaisa / 100,
          igst: gstBreakdown.igstPaisa / 100,
          grandTotal: gstBreakdown.grandTotalPaisa / 100,
        },
      },
    }, 201);
  } catch (error) {
    // Handle idempotency violation (unique constraint)
    if (error instanceof Error && error.message.includes('unique')) {
      return c.json(
        { error: 'Duplicate request. Invoice already processed with this idempotency key.' },
        409,
      );
    }

    console.error('Bill scan error:', error);
    return c.json(
      { error: 'Failed to process bill', message: error instanceof Error ? error.message : 'Unknown error' },
      500,
    );
  }
});

export { bills };

