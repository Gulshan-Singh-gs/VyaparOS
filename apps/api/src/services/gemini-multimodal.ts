/**
 * Gemini Multimodal Service
 *
 * Uses Google Gen AI SDK (REST-compatible with Cloudflare Workers)
 * calling gemini-2.5-flash with Structured Outputs for:
 * 1. Kacha Bill OCR extraction
 * 2. Voice command parsing
 */

import {
  KachaBillExtractionSchema,
  WorkflowActionSchema,
  type KachaBillExtraction,
  type WorkflowAction,
} from '@vyapar-os/shared';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiServiceEnv {
  GEMINI_API_KEY: string;
}

/**
 * Call Gemini API using REST fetch (Cloudflare Workers compatible).
 */
async function callGemini(
  apiKey: string,
  model: string,
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
  responseSchema: Record<string, unknown>,
): Promise<unknown> {
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return JSON.parse(text);
}

/**
 * JSON Schema representation of KachaBillExtraction for Gemini Structured Output.
 */
const KACHA_BILL_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    invoiceNumber: { type: 'STRING', nullable: true },
    invoiceDate: { type: 'STRING', nullable: true, description: 'ISO 8601 YYYY-MM-DD' },
    customerOrPartyName: { type: 'STRING', nullable: true },
    customerGstin: { type: 'STRING', nullable: true },
    isInterState: { type: 'BOOLEAN' },
    paymentMode: { type: 'STRING', enum: ['CASH', 'UPI', 'UDHAAR_CREDIT'] },
    lineItems: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          rawTextVernacular: { type: 'STRING' },
          normalizedItemName: { type: 'STRING' },
          hsnCode: { type: 'STRING' },
          quantity: { type: 'NUMBER' },
          unit: { type: 'STRING', enum: ['KG', 'GM', 'LTR', 'ML', 'PCS', 'BAG', 'BOX', 'DOZEN'] },
          unitPrice: { type: 'NUMBER' },
          statedLineTotal: { type: 'NUMBER' },
          gstRatePercent: { type: 'STRING', enum: ['0', '5', '12', '18', '28'] },
          confidenceScore: { type: 'NUMBER' },
        },
        required: [
          'rawTextVernacular',
          'normalizedItemName',
          'hsnCode',
          'quantity',
          'unit',
          'unitPrice',
          'statedLineTotal',
          'gstRatePercent',
          'confidenceScore',
        ],
      },
    },
    statedGrandTotal: { type: 'NUMBER' },
    overallConfidence: { type: 'NUMBER' },
    anomalies: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          code: {
            type: 'STRING',
            enum: [
              'ARITHMETIC_MISMATCH',
              'LOW_OCR_CONFIDENCE',
              'MISSING_MANDATORY_FIELD',
              'DUPLICATE_INVOICE_SUSPECTED',
            ],
          },
          fieldPath: { type: 'STRING' },
          message: { type: 'STRING' },
          expectedValue: { type: 'STRING', nullable: true },
          actualValue: { type: 'STRING', nullable: true },
        },
        required: ['code', 'fieldPath', 'message'],
      },
    },
  },
  required: [
    'invoiceNumber',
    'invoiceDate',
    'customerOrPartyName',
    'customerGstin',
    'isInterState',
    'paymentMode',
    'lineItems',
    'statedGrandTotal',
    'overallConfidence',
  ],
};

const KACHA_BILL_SYSTEM_PROMPT = `You are an expert Indian regional accountant and OCR specialist.
You are reading a photograph of a handwritten "Kacha Bill" (कच्चा बिल / ਕੱਚਾ ਬਿੱਲ).

These bills are commonly written in:
- Devanagari (Hindi)
- Gurmukhi (Punjabi)
- Romanized Hinglish shorthand
- Mixed scripts with abbreviations

Your task is to accurately extract ALL line items from the bill including:
1. The raw vernacular text exactly as written
2. A normalized English/Hindi commodity name
3. The correct HSN code (4-8 digits)
4. Quantity, unit, unit price, and line total
5. The applicable GST rate (0%, 5%, 12%, 18%, or 28%)
6. Your confidence score (0 to 1) for each line item

Pay special attention to:
- Regional abbreviations (e.g., "ch" = चीनी/sugar, "dal" = दाल/lentils)
- Mixed notation (e.g., "5kg @ 42" meaning 5 KG at ₹42 each)
- Handwritten numbers that may be ambiguous
- Payment mode indicators (नकद/cash, UPI, उधार/credit)

If any field is illegible, set it to null and lower the confidence score accordingly.
Set overallConfidence based on image quality and legibility.`;

/**
 * Extract structured data from a Kacha Bill image using Gemini Vision.
 */
export async function extractKachaBill(
  env: GeminiServiceEnv,
  imageBase64: string,
  mimeType: string,
): Promise<KachaBillExtraction> {
  const rawResult = await callGemini(
    env.GEMINI_API_KEY,
    'gemini-2.5-flash',
    [
      { text: KACHA_BILL_SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ],
    KACHA_BILL_RESPONSE_SCHEMA,
  );

  // Validate through Zod for strict runtime type safety
  return KachaBillExtractionSchema.parse(rawResult);
}

const VOICE_COMMAND_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    intent: {
      type: 'STRING',
      enum: [
        'RECORD_CREDIT_UDHAAR',
        'DEDUCT_INVENTORY',
        'RESTOCK_INVENTORY',
        'GENERATE_SUPPLIER_PO',
        'QUERY_LEDGER_SUMMARY',
      ],
    },
    spokenTranscript: { type: 'STRING' },
    detectedLanguage: { type: 'STRING', enum: ['hi-IN', 'pa-IN', 'en-IN', 'hinglish'] },
    entities: {
      type: 'OBJECT',
      properties: {
        partyName: { type: 'STRING', nullable: true },
        partyPhone: { type: 'STRING', nullable: true },
        itemName: { type: 'STRING', nullable: true },
        quantity: { type: 'NUMBER', nullable: true },
        amountInr: { type: 'NUMBER', nullable: true },
      },
    },
    requiresHumanApproval: { type: 'BOOLEAN' },
    spokenResponseVernacular: { type: 'STRING' },
  },
  required: [
    'intent',
    'spokenTranscript',
    'detectedLanguage',
    'entities',
    'requiresHumanApproval',
    'spokenResponseVernacular',
  ],
};

const VOICE_COMMAND_SYSTEM_PROMPT = `You are BhashaBridge — a voice-activated business assistant for Indian micro-merchants.

You understand spoken commands in:
- Hindi (hi-IN)
- Punjabi (pa-IN)
- Indian English (en-IN)
- Hinglish (mixed Hindi-English)

Parse the audio command and identify the business intent:
1. RECORD_CREDIT_UDHAAR — Record a credit/udhaar (उधार) transaction
2. DEDUCT_INVENTORY — Deduct items from stock
3. RESTOCK_INVENTORY — Add items to stock
4. GENERATE_SUPPLIER_PO — Create a purchase order for a supplier
5. QUERY_LEDGER_SUMMARY — Query account summaries

Extract entities: party name, phone number, item name, quantity, amount (in INR).

Always respond with:
- requiresHumanApproval: true for financial transactions
- spokenResponseVernacular: A confirmation message in the SAME language/dialect the user spoke`;

/**
 * Parse a voice command audio clip using Gemini multimodal.
 */
export async function parseVoiceCommand(
  env: GeminiServiceEnv,
  audioBase64: string,
  mimeType: string,
): Promise<WorkflowAction> {
  const rawResult = await callGemini(
    env.GEMINI_API_KEY,
    'gemini-2.5-flash',
    [
      { text: VOICE_COMMAND_SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      },
    ],
    VOICE_COMMAND_RESPONSE_SCHEMA,
  );

  return WorkflowActionSchema.parse(rawResult);
}

