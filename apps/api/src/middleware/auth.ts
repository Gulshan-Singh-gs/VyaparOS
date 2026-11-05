/**
 * Supabase JWT Verification & Tenant Isolation Middleware
 *
 * Verifies the Bearer JWT from Supabase Auth, extracts the user ID,
 * and resolves the merchantId for tenant-scoped database queries.
 */
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { merchants } from '../db/schema.js';
import { createDb } from '../db/index.js';

export type AuthEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
};

export type AuthVariables = {
  supabaseUserId: string;
  merchantId: string;
  merchantStateCode: string;
  merchantGstin: string;
};

export const authMiddleware = createMiddleware<{
  Bindings: AuthEnv;
  Variables: AuthVariables;
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
    });
  }

  const token = authHeader.slice(7);

  // Create Supabase client with service role to verify the JWT
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new HTTPException(401, {
      message: 'Invalid or expired token',
    });
  }

  // Resolve merchant from supabase user ID
  const db = createDb({ DATABASE_URL: c.env.DATABASE_URL });
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.supabaseUserId, user.id))
    .limit(1);

  if (!merchant) {
    throw new HTTPException(403, {
      message: 'No merchant account found for this user. Please complete onboarding.',
    });
  }

  c.set('supabaseUserId', user.id);
  c.set('merchantId', merchant.id);
  c.set('merchantStateCode', merchant.stateCode);
  c.set('merchantGstin', merchant.gstin);

  await next();
});

