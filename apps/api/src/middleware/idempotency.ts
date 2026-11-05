/**
 * Idempotency Middleware
 *
 * Prevents duplicate invoice/ledger writes by checking a client-provided
 * idempotency key (Idempotency-Key header) against the database.
 */
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export type IdempotencyVariables = {
  idempotencyKey: string;
};

/**
 * Extracts and validates the Idempotency-Key header.
 * The actual dedup check happens at the database level via unique index.
 */
export const idempotencyMiddleware = createMiddleware<{
  Variables: IdempotencyVariables;
}>(async (c, next) => {
  const idempotencyKey = c.req.header('Idempotency-Key');

  if (!idempotencyKey) {
    throw new HTTPException(400, {
      message: 'Missing required Idempotency-Key header',
    });
  }

  if (idempotencyKey.length > 64) {
    throw new HTTPException(400, {
      message: 'Idempotency-Key must be 64 characters or fewer',
    });
  }

  c.set('idempotencyKey', idempotencyKey);
  await next();
});

