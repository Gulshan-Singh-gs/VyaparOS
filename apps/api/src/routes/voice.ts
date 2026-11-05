/**
 * Voice Command Route
 *
 * POST /api/v1/voice/command
 * - Receives audio (base64)
 * - Parses via Gemini multimodal
 * - Creates workflow approval record
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { parseVoiceCommand } from '../services/gemini-multimodal.js';
import { createDb } from '../db/index.js';
import { workflowApprovals } from '../db/schema.js';
import type { AuthEnv, AuthVariables } from '../middleware/auth.js';

type VoiceEnv = AuthEnv & {
  GEMINI_API_KEY: string;
};

const voice = new Hono<{
  Bindings: VoiceEnv;
  Variables: AuthVariables;
}>();

const VoiceCommandRequestSchema = z.object({
  audioBase64: z.string().min(1, 'Audio data is required'),
  mimeType: z
    .enum(['audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg'])
    .default('audio/webm'),
});

voice.post('/command', async (c) => {
  const body = await c.req.json();
  const parsed = VoiceCommandRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }

  const { audioBase64, mimeType } = parsed.data;
  const merchantId = c.get('merchantId');

  try {
    // 1. Parse voice command via Gemini
    const action = await parseVoiceCommand(
      { GEMINI_API_KEY: c.env.GEMINI_API_KEY },
      audioBase64,
      mimeType,
    );

    // 2. Create workflow approval record
    const db = createDb({ DATABASE_URL: c.env.DATABASE_URL });

    const [approval] = await db
      .insert(workflowApprovals)
      .values({
        merchantId,
        sourceType: 'VOICE_COMMAND',
        intent: action.intent,
        title: `Voice: ${action.spokenTranscript.substring(0, 180)}`,
        payloadJson: action,
        status: action.requiresHumanApproval ? 'PENDING' : 'APPROVED',
      })
      .returning();

    return c.json({
      success: true,
      approval: {
        id: approval.id,
        status: approval.status,
        action,
      },
    }, 201);
  } catch (error) {
    console.error('Voice command error:', error);
    return c.json(
      { error: 'Failed to process voice command', message: error instanceof Error ? error.message : 'Unknown error' },
      500,
    );
  }
});

export { voice };

