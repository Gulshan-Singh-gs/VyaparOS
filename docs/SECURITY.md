# VyaparOS Security Threat Model & Mitigations

VyaparOS utilizes STRIDE-based threat modelling to safeguard merchant finances, tax credentials, and private customer records.

## 1. Threat Matrix & Mitigations

| Threat Category | Potential Attack Vector | VyaparOS Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Forged JWT tokens or spoofed merchant IDs | Supabase JWT verified server-side with signature, audience, and expiration checks. Tenant ID is resolved from server database, never accepted from client headers. |
| **Tampering** | Overwriting inventory or Udhaar balances via race conditions | Balances are computed from append-only ledgers. Financial mutations are guarded by unique idempotency keys. |
| **Repudiation** | Denying an approved financial mutation or purchase order | Every verified bill and approved workflow requires human confirmation and is logged with actor ID and timestamp in audit tables. |
| **Information Disclosure** | Cross-tenant data leakage or exposed API credentials | Gemini API keys and DB connection strings are kept strictly on server-side Cloudflare Worker bindings. All queries enforce `where: eq(table.merchantId, ctx.merchantId)`. |
| **Denial of Service** | API flooding or oversized bill image uploads | Client-side image compression down to webp/jpeg before upload; size limits on request payloads; rate-limiting middleware. |
| **Elevation of Privilege** | Normal user triggering administrative GST exports | Role-based tenant membership checked during JWT resolution before executing sensitive return exports. |

## 2. Invariant Rules

1. **No Client-Side Secrets**: Never expose `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `DATABASE_URL` in frontend code or bundles.
2. **Deterministic Financial Verification**: AI outputs are validated by Zod and anomaly engines before being presented for human review.

