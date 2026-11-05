import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

export type DatabaseEnv = {
  DATABASE_URL: string;
};

/**
 * Create a Drizzle ORM instance connected to Neon Serverless Postgres.
 * Uses HTTP driver optimized for Cloudflare Workers (no persistent connections).
 */
export function createDb(env: DatabaseEnv) {
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

