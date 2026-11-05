import { describe, it, expect } from 'vitest';
import app from '../index.js';

describe('API Integration - Health & Unauthenticated Routes', () => {
  it('GET / should return greeting', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: 'VyaparOS API v1' });
  });

  it('GET /api/v1/health should return ok status', async () => {
    const res = await app.request('/api/v1/health');
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string; service: string; version: string };
    expect(json.status).toBe('ok');
    expect(json.service).toBe('vyapar-os-api');
    expect(json.version).toBe('0.1.0');
  });

  it('GET /api/v1/workflows without Authorization header should reject with 401', async () => {
    const res = await app.request('/api/v1/workflows');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/bills/scan without Idempotency-Key should reject with 400 or 401', async () => {
    const res = await app.request('/api/v1/bills/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: 'test' }),
    });
    // Protected by auth first
    expect([400, 401]).toContain(res.status);
  });
});
