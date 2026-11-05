# MASTER ENGINEERING DIRECTIVE
# VYAPAROS — Vernacular-First Merchant Operating System

**Role:** Act as a Principal Software Architect, Senior Full-Stack Engineer, FinTech Systems Engineer, Database Architect, AI/ML Engineer, Application Security Engineer and QA Lead.

**Mission:** Design and build VyaparOS from scratch into a reliable, offline-capable, production-grade merchant operating system for small Indian businesses.

Do not build a superficial AI dashboard. Build a real application with deterministic financial logic, auditable business records, reliable synchronisation and AI-assisted merchant workflows.

You are authorised to make routine architectural decisions autonomously. However, never invent financial rules, fabricate credentials, silently bypass security requirements or claim functionality that has not been implemented and tested.

---

# 1. PRODUCT VISION

VyaparOS is a vernacular-first merchant operating system designed for Indian small businesses.

Its purpose is to convert everyday merchant activity into structured business operations.

The product must support:

- Handwritten Kacha Bill digitisation.
- Inventory and commodity management.
- Udhaar and customer credit tracking.
- Supplier and purchase-order management.
- Voice-controlled business operations.
- GST calculations and versioned return exports.
- Offline-first record creation and synchronisation.
- Merchant analytics and operational intelligence.

The application should work particularly well for merchants who communicate in:

- Punjabi.
- Hindi.
- English.
- Hinglish.
- Mixed Punjabi-English speech.

The interface must remain usable by people who are not technically sophisticated.

## Non-negotiable product principles

1. Financial correctness takes priority over AI convenience.
2. AI proposes data; deterministic systems validate it.
3. Human approval is required before posting uncertain financial operations.
4. Offline operations must not silently disappear.
5. Every financial mutation must be traceable.
6. Every merchant must have strict tenant isolation.
7. Never fabricate GST compliance or claim government integration without verification.
8. No paid service may become an undocumented mandatory dependency.
9. Preserve original documents and user-provided evidence.
10. Never represent an unverified extraction as a verified financial record.

---

# 2. TECHNOLOGY STACK

Use a pnpm monorepo with Turborepo.

## Frontend

- React.
- Vite.
- TypeScript with strict mode.
- Tailwind CSS.
- Accessible component primitives.
- Zustand for application state.
- TanStack Query for server state.
- Zod for runtime validation.
- IndexedDB through a maintained abstraction such as Dexie.
- Workbox or vite-plugin-pwa.
- Capacitor for Android packaging.
- Web Workers for computationally expensive client-side operations.

## Backend

- Cloudflare Workers.
- Hono.
- TypeScript.
- Drizzle ORM.
- Neon PostgreSQL.
- Neon serverless driver or Cloudflare Hyperdrive, selected according to transaction requirements.
- Supabase Auth for identity management.
- Private object storage using signed access URLs.

## AI

- Official Google Gen AI SDK.
- Configurable model identifiers.
- Gemini multimodal document extraction.
- Audio transcription and structured voice interpretation.
- Zod validation of every AI-generated response.
- Deterministic validation after extraction.

Do not hardcode an obsolete model identifier. Read the model from server-side configuration and validate its availability.

## Development and testing

- pnpm.
- Turborepo.
- Vitest.
- Playwright.
- TypeScript compiler.
- ESLint.
- Prettier.
- GitHub Actions.
- Drizzle migrations.

Use maintained, compatible package versions. Pin dependencies through the lockfile.

---

# 3. MONOREPO ARCHITECTURE

Create the following architecture:

```text
vyapar-os/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── bill-capture/
│   │   │   │   ├── inventory/
│   │   │   │   ├── udhaar/
│   │   │   │   ├── suppliers/
│   │   │   │   ├── voice/
│   │   │   │   ├── gst/
│   │   │   │   └── analytics/
│   │   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   ├── workers/
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   └── capacitor.config.ts
│   │
│   └── api/
│       ├── src/
│       │   ├── index.ts
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── db/
│       │   ├── security/
│       │   └── observability/
│       └── wrangler.toml
│
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── constants/
│   │
│   ├── core-engine/
│   │   ├── src/
│   │   │   ├── money/
│   │   │   ├── gst/
│   │   │   ├── invoices/
│   │   │   ├── inventory/
│   │   │   ├── credit/
│   │   │   ├── ledger/
│   │   │   ├── reconciliation/
│   │   │   └── workflows/
│   │
│   ├── ai-engine/
│   │   ├── src/
│   │   │   ├── document-extraction/
│   │   │   ├── speech/
│   │   │   ├── normalization/
│   │   │   └── validation/
│   │
│   ├── db/
│   │   ├── src/
│   │   ├── schema/
│   │   └── migrations/
│   │
│   ├── sync-engine/
│   ├── storage/
│   ├── security/
│   └── testing/
│
├── supabase/
│   └── config.toml
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── DATA_MODEL.md
│   ├── GST_RULES.md
│   ├── OFFLINE_SYNC.md
│   ├── AI_EVALUATION.md
│   └── DEPLOYMENT.md
│
├── .github/
│   └── workflows/
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── PROJECT_STATUS.md
└── ARCHITECTURE_DECISIONS.md
```

Keep domain logic independent of React, Cloudflare and external AI providers.

The core accounting engine must be executable locally and testable without network access.

---

# 4. FINANCIAL DOMAIN ENGINE

This is the most important component of the application.

Build the financial engine before building the dashboard.

## 4.1 Money representation

Never use JavaScript floating-point arithmetic for financial calculations.

Use integer paise for monetary values, with validated conversion at input boundaries.

Support decimal quantities using a deliberate precision strategy. Do not assume all inventory quantities are whole numbers.

Implement:

- Money parsing.
- Money formatting.
- Decimal quantity arithmetic.
- Tax rounding.
- Invoice reconciliation.
- Payment reconciliation.
- Ledger balancing.

Reject malformed and out-of-range financial inputs.

## 4.2 Invoice engine

Implement an invoice lifecycle:

```text
DRAFT
  ↓
EXTRACTED
  ↓
NEEDS_REVIEW
  ↓
VERIFIED
  ↓
POSTED
  ↓
RECONCILED
```

Rejected or cancelled invoices must have explicit transitions.

Posted invoices must not be silently overwritten.

Corrections must use appropriate reversal or adjustment transactions.

Implement:

- Invoice creation.
- Invoice editing before posting.
- Invoice line items.
- Taxable amounts.
- Discounts.
- Tax calculations.
- Payment status.
- Party references.
- Invoice numbering.
- Duplicate detection.
- Audit history.

Every invoice must have a merchant-scoped idempotency key.

## 4.3 GST engine

Implement GST calculations as deterministic pure TypeScript functions.

Do not allow an LLM to determine the final tax amount.

The calculation engine must consider:

- Supplier registration details.
- Place of supply.
- Customer registration details.
- Transaction classification.
- Intra-state versus inter-state supply.
- Taxable value.
- Discounts and adjustments.
- Applicable GST rates.
- CGST, SGST and IGST allocation.
- Applicable cess.
- Rounding policy.
- Reverse-charge handling where applicable.
- Composition-scheme restrictions where applicable.
- Exempt and zero-rated transactions.

Never infer a legally significant tax classification from an AI-generated boolean.

If the required facts are unavailable, return an explicit `REQUIRES_REVIEW` result.

### GST export architecture

Separate internal accounting records from external GST export formats.

Create a versioned serializer:

```text
gst/
├── calculator.ts
├── classification.ts
├── validation.ts
├── reconciliation.ts
├── export/
│   ├── index.ts
│   ├── version-registry.ts
│   ├── gstr1/
│   └── tests/
└── types.ts
```

Support GSTR-1 categories only after verifying the applicable official format.

Do not claim a complete GSTR-1 implementation when only B2CS is supported.

Never hardcode an assumed GST offline-tool version as permanently current.

The export process must:

1. Validate merchant registration information.
2. Validate the return period.
3. Validate transaction classifications.
4. Reconcile tax amounts.
5. Validate the target export format.
6. Produce a downloadable file.
7. Preserve the export version and generation history.

Include representative fixtures and regression tests.

Document that the export is an offline preparation artifact unless an actual authorised filing integration is implemented.

---

# 5. INVENTORY, UDHAR AND ACCOUNTING LEDGERS

## 5.1 Inventory architecture

Do not store stock as a mutable number without a transaction history.

Create an `inventory_movements` ledger.

Supported movement types:

- PURCHASE.
- SALE.
- RETURN_IN.
- RETURN_OUT.
- ADJUSTMENT.
- DAMAGE.
- TRANSFER.
- REVERSAL.

Maintain stock balances transactionally.

Use database transactions and concurrency protection when posting movements.

Implement merchant-scoped SKU uniqueness.

Define the negative-stock policy explicitly.

## 5.2 Udhaar management

Implement a customer credit ledger.

Supported operations:

- Credit sale.
- Partial payment.
- Full payment.
- Credit adjustment.
- Reversal.
- Outstanding balance calculation.
- Due-date tracking.
- Payment reminders.

Never directly overwrite a customer's balance.

Calculate balances from ledger transactions or a transactionally maintained balance with reconciliation support.

## 5.3 Supplier management

Implement:

- Supplier profiles.
- Supplier contact details.
- Purchase history.
- Purchase orders.
- Payment tracking.
- Outstanding balances.
- Restock recommendations.

WhatsApp links must only open a user-reviewed message. Never silently transmit purchase orders.

---

# 6. AI MULTIMODAL EXTRACTION

Create a provider-independent AI service layer.

The initial provider may be Google Gemini.

All model calls must remain server-side.

## 6.1 Handwritten bill extraction

Create:

```text
ai-engine/document-extraction/
├── extract-bill.ts
├── prompts/
├── normalization.ts
├── confidence.ts
├── provenance.ts
└── validators.ts
```

Support:

- Devanagari handwriting.
- Gurmukhi handwriting.
- Romanized Punjabi.
- Hinglish shorthand.
- Mixed-language documents.

Extract:

- Invoice date.
- Invoice number.
- Merchant and customer details.
- Item names.
- Raw handwritten text.
- Normalised item names.
- Quantities.
- Units.
- Unit prices.
- Line totals.
- Tax information where visible.
- Stated grand total.

Every extracted field should retain provenance.

Store:

- Original value.
- Normalised value.
- Model-generated confidence indicator.
- Source image reference.
- Model identifier.
- Extraction timestamp.
- User correction history.

Never invent missing HSN codes, GST rates, dates or party information.

Unknown values must remain unknown.

## 6.2 Deterministic post-extraction validation

After model extraction:

1. Validate the response with Zod.
2. Validate arithmetic.
3. Validate item quantities.
4. Validate monetary precision.
5. Validate tax consistency.
6. Detect duplicates.
7. Identify missing information.
8. Produce an anomaly report.

The AI extraction must never directly create a posted invoice.

## 6.3 Voice assistant: BhashaBridge

Implement voice commands for:

- Recording customer credit.
- Recording payments.
- Checking outstanding balances.
- Checking inventory.
- Recording purchases.
- Recording sales.
- Creating purchase-order drafts.
- Querying ledger summaries.

The voice pipeline:

```text
Microphone input
      ↓
Speech processing
      ↓
Language detection
      ↓
Intent extraction
      ↓
Entity extraction
      ↓
Zod validation
      ↓
Business-rule validation
      ↓
Confirmation interface
      ↓
Approved execution
```

Support Punjabi, Hindi, English and Hinglish.

Handle negation, corrections, ambiguous quantities, similar party names and currency expressions.

The application must repeat important financial details before execution.

Example:

Merchant: "Ramesh nu 500 da udhaar pa de."

Assistant: "Ramesh de account vich ₹500 credit sale record karni hai. Confirm?"

No mutation occurs until the merchant confirms.

Recording must have a visible microphone state and appropriate user consent.

---

# 7. OFFLINE-FIRST ARCHITECTURE

The application must remain useful without internet access.

Implement a durable IndexedDB storage layer.

Required components:

```text
sync-engine/
├── outbox.ts
├── retry-policy.ts
├── conflict-resolution.ts
├── sync-coordinator.ts
├── idempotency.ts
├── connectivity.ts
└── tests/
```

Requirements:

- Persist locally created records.
- Queue pending operations.
- Generate unique idempotency keys.
- Retry failed synchronisation.
- Use exponential backoff with jitter.
- Prevent duplicate transaction execution.
- Detect conflicting edits.
- Preserve unsynchronised records.
- Display synchronisation status.
- Support manual retry.
- Handle expired sessions.
- Reconcile offline operations against server state.

Never rely exclusively on browser Background Sync.

Use foreground synchronisation as a reliable fallback.

## Conflict handling

For financial records, never use blind last-write-wins.

Use explicit conflict detection and require review where concurrent changes could alter financial meaning.

Do not silently discard local transactions.

## Local data protection

Protect locally stored business data.

Define:

- Device access assumptions.
- Local encryption strategy where appropriate.
- Session expiration behaviour.
- Shared-device protections.
- Local logout cleanup.
- Backup and recovery expectations.

---

# 8. DATABASE ARCHITECTURE

Use Neon PostgreSQL as the single authoritative business database.

Use Supabase Auth only for identity.

Do not create competing business-data copies in Supabase.

Create the following relational domains:

```text
merchants
merchant_memberships
merchant_settings

parties
party_contacts

inventory_items
inventory_movements

invoices
invoice_line_items
invoice_adjustments

payments
payment_allocations

ledger_accounts
ledger_entries

suppliers
purchase_orders
purchase_order_items

workflow_approvals
workflow_executions

document_assets
ai_extraction_records

idempotency_records
audit_logs
sync_operations
outbox_events
```

Use:

- UUID primary keys.
- Foreign keys.
- Appropriate unique constraints.
- Merchant-scoped indexes.
- Check constraints.
- Explicit timestamps.
- Transactional writes.
- Database migrations.
- Appropriate decimal/numeric precision for non-currency quantities.

Every merchant-owned record must be associated with a merchant.

## Tenant isolation

Implement authenticated identity resolution.

The API must:

1. Verify the Supabase JWT.
2. Validate signature, issuer, audience and expiration.
3. Resolve the authenticated user to merchant membership.
4. Derive the merchant ID server-side.
5. Enforce tenant-scoped repository operations.
6. Prevent cross-tenant references.
7. Test unauthorised access.

Never trust a client-supplied merchant ID.

Use least-privilege database roles.

Do not expose privileged database credentials to the browser.

## Audit logs

Record important operations:

- Invoice creation and posting.
- Invoice corrections.
- Inventory movements.
- Credit and payment entries.
- Workflow approvals.
- User permission changes.
- GST exports.

Audit entries must record the actor, tenant, operation, timestamp and relevant entity reference.

Normal application roles must not be able to silently rewrite audit history.

---

# 9. API ARCHITECTURE

Build versioned REST endpoints using Hono.

Suggested routes:

```text
GET    /api/v1/health
GET    /api/v1/version

POST   /api/v1/bills/extract
POST   /api/v1/bills
GET    /api/v1/bills
GET    /api/v1/bills/:id
PATCH  /api/v1/bills/:id
POST   /api/v1/bills/:id/post

GET    /api/v1/inventory
POST   /api/v1/inventory
POST   /api/v1/inventory/movements

GET    /api/v1/parties
POST   /api/v1/parties

GET    /api/v1/udhaar
POST   /api/v1/udhaar/transactions

GET    /api/v1/suppliers
POST   /api/v1/suppliers

POST   /api/v1/voice/interpret
POST   /api/v1/workflows
GET    /api/v1/workflows
POST   /api/v1/workflows/:id/approve
POST   /api/v1/workflows/:id/reject

GET    /api/v1/gst/summary
POST   /api/v1/gst/export

POST   /api/v1/sync/push
GET    /api/v1/sync/pull
```

Apply:

- Authentication.
- Tenant isolation.
- Zod request validation.
- Response validation.
- Rate limiting.
- Request size limits.
- Idempotency protection.
- Structured error handling.
- Request correlation IDs.

Financial mutations must use appropriate database transactions.

Approval endpoints must enforce legal state transitions and prevent duplicate execution.

Never trust the frontend to enforce authorisation.

---

# 10. APPLICATION SECURITY

Use STRIDE-based threat modelling.

Address:

- Authentication bypass.
- Broken access control.
- Cross-tenant data leakage.
- SQL injection.
- XSS.
- CSRF where applicable.
- SSRF.
- File upload abuse.
- Malicious document inputs.
- Prompt injection.
- API flooding.
- Replay attacks.
- Duplicate transaction execution.
- Privilege escalation.
- Session theft.
- Secret exposure.

Additional requirements:

- Keep Gemini API keys server-side.
- Keep Neon credentials server-side.
- Never expose Supabase secret/service-role keys.
- Restrict upload MIME types and file sizes.
- Validate actual file contents, not only extensions.
- Use private storage and signed URLs.
- Configure CORS explicitly.
- Avoid logging credentials, tokens and sensitive document contents.
- Implement secret rotation procedures.
- Add security regression tests.

Create `docs/SECURITY.md` documenting the threat model and mitigation status.

---

# 11. FRONTEND EXPERIENCE

Create a polished, mobile-first application.

It should look like a professional merchant operating system, not a generic admin template.

## Main navigation

1. Dashboard.
2. Bills.
3. Inventory.
4. Udhaar.
5. Suppliers.
6. Voice Assistant.
7. GST Workspace.
8. Analytics.
9. Settings.

## Dashboard

Display:

- Today's sales.
- Outstanding customer credit.
- Inventory alerts.
- Pending bill reviews.
- Recent transactions.
- Synchronisation status.
- Pending approvals.

All figures must originate from actual application data.

Never use hardcoded financial values in production views.

## Capture Studio

Implement:

- Camera capture.
- Image cropping.
- Rotation.
- Perspective correction.
- Image quality feedback.
- Compression.
- Original image preservation.
- Extraction progress.
- Retry handling.

## Split-view verification

Display the original document next to editable extracted data.

Highlight:

- Low-confidence fields.
- Arithmetic discrepancies.
- Missing information.
- Invalid GST data.
- Suspected duplicates.

Every correction must be traceable.

## BhashaBridge interface

Build a clear push-to-talk interaction with:

- Recording state.
- Transcription preview.
- Parsed intent.
- Extracted entities.
- Confirmation summary.
- Cancel and edit controls.
- Execution result.

## Inventory interface

Support:

- Search.
- Filters.
- Item creation.
- Stock adjustment.
- Movement history.
- Low-stock indicators.
- Supplier association.

## Udhaar interface

Support:

- Customer accounts.
- Outstanding balances.
- Transaction history.
- Partial payments.
- Due dates.
- Printable statements.

## GST workspace

Support:

- Tax summaries.
- Transaction classification.
- Validation warnings.
- Return-period selection.
- Export preparation.
- Export history.

Clearly distinguish prepared data from officially filed returns.

---

# 12. DOCUMENT STORAGE AND IMAGE PROCESSING

Implement private document storage.

Preserve original evidence.

Generate optimised working copies rather than destructively replacing originals.

Implement:

- Image resizing.
- Adaptive compression.
- Rotation correction.
- Crop correction.
- Upload progress.
- Retry.
- Signed URL access.
- Retention policies.

Never assume all handwritten documents can be compressed below a fixed size without quality loss.

Set upload limits based on device capability and server constraints.

---

# 13. TESTING STRATEGY

Testing is mandatory.

Do not advance phases simply because code compiles.

## Unit tests

Test:

- Money arithmetic.
- Tax calculations.
- Tax rounding.
- Invoice reconciliation.
- Inventory movements.
- Negative stock.
- Credit balances.
- Payment allocation.
- Workflow state transitions.
- Idempotency.
- Zod contracts.
- Offline queue behaviour.

## Financial test cases

Include:

- Odd-paisa rounding.
- Fractional quantities.
- Discounts.
- Tax-inclusive pricing.
- Tax-exclusive pricing.
- Inter-state supplies.
- Intra-state supplies.
- Invalid tax rates.
- Missing place-of-supply data.
- Duplicate invoices.
- Reversed transactions.
- Partial payments.

## Security tests

Include:

- Cross-tenant reads.
- Cross-tenant writes.
- Forged JWTs.
- Expired tokens.
- Unauthorised approvals.
- Duplicate approval requests.
- Malicious file uploads.
- Oversized payloads.
- Rate-limit enforcement.
- Invalid workflow transitions.

## Integration tests

Test the complete flow:

```text
Capture bill
    ↓
Upload document
    ↓
AI extraction
    ↓
Schema validation
    ↓
Arithmetic validation
    ↓
Human correction
    ↓
Invoice posting
    ↓
Inventory movement
    ↓
Ledger entry
    ↓
Dashboard update
```

## Offline tests

Test:

- Creating records without internet.
- Reloading the application offline.
- Reconnecting.
- Retrying failed requests.
- Duplicate prevention.
- Conflicting edits.
- Expired authentication.
- Partial synchronisation failure.

## End-to-end tests

Use Playwright to test the primary merchant workflows.

Use realistic test fixtures, not invented production data.

---

# 14. GITHUB ACTIONS AND AUTOMATION

Create a production-quality CI/CD pipeline.

Implement:

- Dependency caching.
- pnpm installation.
- Workspace-aware build execution.
- Type checking.
- Linting.
- Unit tests.
- Integration tests.
- Security scanning.
- Build verification.
- Deployment gating.

Use path filters and concurrency controls where appropriate.

Never expose deployment secrets to untrusted pull requests.

Separate development, staging and production configurations.

GitHub Actions may perform development and deployment automation, but it must never become a substitute for runtime application services.

Do not assume GitHub Actions provides an unlimited free backend.

---

# 15. ENVIRONMENT AND SECRET MANAGEMENT

Create a root `.env.example` containing placeholders only.

Example:

```ini
# Public frontend configuration
VITE_API_BASE_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server-only configuration
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=

# Application configuration
APP_ENV=
APP_ORIGIN=
STORAGE_BUCKET=
```

Rules:

- `VITE_*` variables must contain only intentionally public values.
- Never put `DATABASE_URL` in frontend configuration.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend configuration.
- Never expose `GEMINI_API_KEY` in frontend configuration.
- Use Cloudflare Worker secrets for production credentials.
- Use local development secrets outside version control.
- Verify secret exposure during builds.

Add `.gitignore` rules for all local secrets and generated credentials.

---

# 16. DEVELOPMENT PHASES

Execute these phases sequentially.

Each phase must have a written completion report and test results.

## PHASE 0 — Repository reconnaissance and architecture

Tasks:

1. Inspect the current repository.
2. Check the runtime and package-manager versions.
3. Create the monorepo.
4. Establish workspace configuration.
5. Define package boundaries.
6. Create architecture documentation.
7. Define financial domain invariants.
8. Define the security threat model.
9. Define the data model.
10. Document unresolved regulatory assumptions.

Deliverables:

- Working monorepo.
- `ARCHITECTURE.md`.
- `DATA_MODEL.md`.
- `SECURITY.md`.
- `ARCHITECTURE_DECISIONS.md`.

Do not begin complex UI development yet.

## PHASE 1 — Shared contracts and financial foundation

Implement:

- Zod contracts.
- Money utilities.
- Decimal quantity handling.
- Invoice domain model.
- GST calculation engine.
- Inventory movement engine.
- Credit ledger.
- Payment allocation.
- Reconciliation.
- Workflow state machine.

Write comprehensive tests.

No AI integration is required in this phase.

Completion criterion: financial domain logic must operate independently of external services.

## PHASE 2 — Database and transaction infrastructure

Implement:

- Drizzle schemas.
- Database migrations.
- Tenant membership model.
- Ledger tables.
- Inventory movement tables.
- Invoice relationships.
- Idempotency records.
- Audit history.
- Transactional outbox.

Test concurrency and rollback behaviour.

## PHASE 3 — Secure backend

Implement:

- Hono API.
- Supabase JWT verification.
- Tenant resolution.
- Repository layer.
- Request validation.
- Rate limiting.
- Financial mutation routes.
- Workflow approval routes.
- Structured errors.
- Observability.

Test cross-tenant isolation.

## PHASE 4 — Offline-first PWA

Implement:

- PWA installation.
- IndexedDB persistence.
- Offline outbox.
- Retry system.
- Conflict detection.
- Synchronisation status.
- Image capture and processing.

Demonstrate offline invoice creation and successful reconciliation after reconnection.

## PHASE 5 — AI extraction and voice assistant

Implement:

- Gemini provider integration.
- Structured bill extraction.
- Punjabi/Hindi/Hinglish processing.
- Provenance tracking.
- Confidence evaluation.
- Deterministic validation.
- Human approval interface.

Test against manually labelled sample documents and voice transcripts.

Do not fabricate accuracy metrics.

## PHASE 6 — Complete merchant experience

Implement:

- Dashboard.
- Bills.
- Inventory.
- Udhaar.
- Suppliers.
- Voice assistant.
- GST workspace.
- Analytics.
- Settings.

Connect every production view to real backend data.

## PHASE 7 — Android packaging

Implement:

- Capacitor Android project.
- Camera integration.
- Microphone integration.
- File handling.
- Network state.
- Permissions.
- Offline behaviour.
- Android navigation.
- Release build configuration.

Do not request unnecessary permissions.

Verify the release APK or AAB independently from the development build.

## PHASE 8 — Production hardening

Complete:

- Security review.
- Dependency audit.
- Performance profiling.
- Database backup verification.
- Restore testing.
- Migration testing.
- Accessibility review.
- Mobile testing.
- Offline recovery testing.
- Production deployment verification.

Only mark the application production-ready when the relevant acceptance criteria are demonstrated.

---

# 17. PERFORMANCE REQUIREMENTS

Optimise for budget Android devices and inconsistent mobile networks.

Priorities:

- Small initial JavaScript bundle.
- Lazy-loaded feature modules.
- Efficient image processing.
- IndexedDB batching.
- Minimal unnecessary API requests.
- Database indexes.
- Connection pooling.
- Bounded AI payloads.
- Responsive loading states.
- Efficient list rendering.

Measure performance on actual target devices.

Do not invent performance benchmarks.

Report real measurements, including P50 and P95 where meaningful.

---

# 18. AGENT EXECUTION RULES

You must operate as an autonomous engineering agent.

Follow these rules:

1. Inspect existing code before modifying it.
2. Never overwrite working functionality without understanding its dependencies.
3. Maintain a clear implementation plan.
4. Work in small, verifiable milestones.
5. Run tests after meaningful changes.
6. Fix errors rather than suppressing them.
7. Never disable TypeScript strictness to hide defects.
8. Never use `any` as a substitute for proper domain modelling.
9. Never fabricate API responses or financial calculations.
10. Never insert fake production dashboard values.
11. Never hardcode secrets.
12. Never silently skip migrations.
13. Never bypass financial validation.
14. Never automatically post uncertain AI extractions.
15. Never mark an incomplete phase as complete.
16. Document architectural changes.
17. Maintain backwards compatibility where practical.
18. Keep dependencies and infrastructure cost-conscious.
19. Prefer maintained packages and official SDKs.
20. Record unresolved limitations explicitly.

If credentials are unavailable, implement the integration boundary and provide a clearly labelled local test mode. Do not pretend the external service has been connected.

## Required project tracking files

Maintain `PROJECT_STATUS.md` with:

- Current phase.
- Completed tasks.
- In-progress tasks.
- Blocked tasks.
- Failed tests.
- Outstanding risks.
- Next implementation steps.

Maintain `ARCHITECTURE_DECISIONS.md` with:

- Architectural decision.
- Reasoning.
- Alternatives considered.
- Consequences.
- Date.

---

# 19. DEFINITION OF DONE

The project is not complete merely because the homepage renders.

The final implementation must demonstrate:

- [ ] Monorepo installs successfully.
- [ ] All packages type-check.
- [ ] Financial engine tests pass.
- [ ] GST calculations pass documented regression cases.
- [ ] GST export validates against the selected official format.
- [ ] Invoice lifecycle works.
- [ ] Inventory movements are auditable.
- [ ] Udhaar and payments reconcile.
- [ ] Duplicate operations are prevented.
- [ ] Tenant isolation tests pass.
- [ ] Database migrations work from a clean environment.
- [ ] AI extraction validates against strict contracts.
- [ ] Human approval is enforced for financial mutations.
- [ ] Offline records survive reloads.
- [ ] Synchronisation does not duplicate transactions.
- [ ] PWA builds and installs.
- [ ] Android build succeeds.
- [ ] Secrets are not exposed in frontend bundles.
- [ ] Security checks pass.
- [ ] Documentation reflects actual implementation.
- [ ] Production deployment has been verified.

Produce a final engineering report containing:

1. Implemented architecture.
2. Features completed.
3. Features not implemented.
4. Test results.
5. Security findings.
6. Performance measurements.
7. Known limitations.
8. Deployment instructions.
9. Required external credentials.
10. Remaining production risks.

---

# FINAL DIRECTIVE

Build VyaparOS as a genuine merchant operating system.

The core must be a reliable financial and operational engine. AI is an intelligent interface layered on top of that engine, never a substitute for accounting rules, authorisation or transaction integrity.

Start with Phase 0.

Inspect the workspace, establish the architecture, document the risks, and proceed phase by phase.

Do not sacrifice correctness for speed. Do not sacrifice security for convenience. Do not claim completion without evidence.