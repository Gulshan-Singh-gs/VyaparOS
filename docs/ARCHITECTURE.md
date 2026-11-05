# VyaparOS System Architecture

VyaparOS is a vernacular-first, offline-capable merchant operating system built for small Indian businesses and shopkeepers (vyaparis).

```
                      ┌──────────────────────────────────────────┐
                      │          React 19 + Vite PWA             │
                      │  (Dashboard, Bills, Inventory, Udhaar,   │
                      │   Suppliers, Voice, GST, Analytics, etc) │
                      └─────────────────────┬────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
         ┌─────────────────────┐                         ┌────────────────────┐
         │ Offline IndexedDB   │                         │  Hono API Service  │
         │ Outbox Queue        │                         │ Cloudflare Workers │
         │ (Dexie / IDB-KeyVal)│                         └─────────┬──────────┘
         └──────────┬──────────┘                                   │
                    │ (Sync Coordinator on Reconnect)               │
                    └───────────────────────────────────────────────┘
                                            │
                               ┌────────────┴────────────┐
                               ▼                         ▼
                    ┌─────────────────────┐   ┌────────────────────┐
                    │  Neon PostgreSQL    │   │ Google Gemini SDK  │
                    │  Authoritative DB   │   │ Server-side AI     │
                    │  (Drizzle ORM)      │   │ Multimodal & Voice │
                    └─────────────────────┘   └────────────────────┘
```

## Architectural Layers

1. **Shared Domain Engine (`@vyapar-os/shared`)**:
   - Zero-float integer paise financial representation.
   - Deterministic GST calculation (intra-state CGST+SGST, inter-state IGST, odd-paisa floor allocation).
   - Anomaly auditing engine.
   - Append-only inventory movements and Udhaar customer credit calculations.
   - Zod runtime validation schemas for all domain entities.

2. **Frontend Presentation & PWA (`@vyapar-os/web`)**:
   - React 19, TypeScript, Tailwind CSS.
   - 9 Modular screens per Section 11 of Directive:
     - Dashboard, Bills, Inventory, Udhaar, Suppliers, Voice Assistant (BhashaBridge), GST Workspace, Analytics, Settings.
   - AutoFlow Autonomous Command Center.
   - Split-View Verification Drawer.
   - Accessible WCAG 2.1 AA UI and Schema.org semantic metadata.

3. **Backend Service (`@vyapar-os/api`)**:
   - Cloudflare Workers runtime powered by Hono.
   - Supabase JWT authentication with server-derived merchant tenant isolation.
   - Idempotency middleware preventing duplicate financial mutations.
   - Server-side Gemini AI integration for OCR bill extraction and audio transcription.

4. **Authoritative Database (`Neon PostgreSQL`)**:
   - Strict foreign keys, multi-tenant scoped indexes, and Drizzle ORM schemas.

