# Architecture Decision Records (ADRs)

## ADR-001: Integer Paise for Monetary Representation
- **Date:** 2026-11-03
- **Decision:** Store and compute all monetary values as integer paise (1 INR = 100 paise).
- **Reasoning:** JavaScript IEEE-754 floating-point arithmetic introduces rounding inaccuracies (e.g., `0.1 + 0.2 !== 0.3`) which violate financial audit requirements.
- **Alternatives Considered:** BigNumber.js / decimal.js. Rejected to avoid bundle size bloat and serialization friction across IndexedDB and Hono/PostgreSQL.
- **Consequences:** All inputs must be converted to paise at boundaries; displays must be formatted using `formatRupees`.

---

## ADR-002: Append-Only Double Entry Ledgers for Stock and Credit
- **Date:** 2026-11-04
- **Decision:** Inventory balances and Udhaar customer balances are never updated via mutable in-place overwrites. Instead, they are computed from append-only movement and transaction ledgers.
- **Reasoning:** In-place mutable counters destroy audit trails, make concurrent updates prone to race conditions, and prevent offline sync conflict resolution.
- **Alternatives Considered:** Mutable counter columns with audit triggers.
- **Consequences:** Calculating balances requires aggregating movement transactions or maintaining a materialized balance alongside transactional verification.

---

## ADR-003: Human-in-the-Loop Gate for All AI and Multimodal Extractions
- **Date:** 2026-11-05
- **Decision:** AI models (Gemini OCR, BhashaBridge voice interpretation) are strictly proposal engines. Under no circumstance may an AI extraction directly post a financial transaction without explicit merchant review and approval.
- **Reasoning:** Section 1.1 Non-negotiable principles: "Financial correctness takes priority over AI convenience. AI proposes data; deterministic systems validate it."
- **Alternatives Considered:** Auto-posting high confidence extractions (>0.95). Rejected due to the legal and financial liability of incorrect GST or ledger records.
- **Consequences:** All bill scans flow to `NEEDS_REVIEW` and open in the Split-View Verification Drawer; voice commands require merchant confirmation dialog before mutation.

---

## ADR-004: Decoupled Multi-Tenant Isolation Derived Exclusively Server-Side
- **Date:** 2026-11-05
- **Decision:** Client requests never dictate the `merchantId`. Instead, the authenticated Supabase JWT is verified on the backend, and the tenant identity is derived from the verified user session.
- **Reasoning:** Prevents horizontal privilege escalation and cross-tenant data leakage.
- **Alternatives Considered:** Client-provided `X-Merchant-ID` header. Rejected as inherently insecure.
- **Consequences:** All database queries must enforce tenant filters based on the server-derived `merchantId`.

---

## ADR-005: 9-Screen Modular Architecture with Offline-First IndexedDB Outbox
- **Date:** 2026-11-05
- **Decision:** Build 9 dedicated merchant views (Dashboard, Bills, Inventory, Udhaar, Suppliers, Voice, GST, Analytics, Settings) backed by an offline IndexedDB outbox.
- **Reasoning:** Meets the requirements of Section 11 of the Master Directive, providing Indian shopkeepers with an end-to-end vernacular operating system operable even in low-connectivity rural markets.
- **Alternatives Considered:** Single monolithic dashboard with modal dialogs. Rejected due to poor mobile ergonomics on budget devices.
- **Consequences:** Clean separation of concerns with shared domain engines in `@vyapar-os/shared`.

