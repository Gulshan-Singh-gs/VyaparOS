import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { health } from './routes/health.js';
import { bills } from './routes/bills.js';
import { voice } from './routes/voice.js';
import { workflows } from './routes/workflows.js';
import { gstExport } from './routes/gst-export.js';
import { authMiddleware } from './middleware/auth.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';

type Bindings = {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GEMINI_API_KEY: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Global CORS
app.use('/*', cors());

// Root
app.get('/', (c) => {
  return c.json({ message: 'VyaparOS API v1' });
});

// Health check (no auth required)
app.route('/api/v1/health', health);

// All protected routes require auth
const protectedApi = new Hono<{ Bindings: Bindings }>();
protectedApi.use('/*', authMiddleware);

// Bills route requires idempotency key for POST /scan
const billsWithIdempotency = new Hono<{ Bindings: Bindings }>();
billsWithIdempotency.use('/scan', idempotencyMiddleware);
billsWithIdempotency.route('/', bills);

protectedApi.route('/bills', billsWithIdempotency);
protectedApi.route('/voice', voice);
protectedApi.route('/workflows', workflows);
protectedApi.route('/gst', gstExport);

app.route('/api/v1', protectedApi);

export default app;
