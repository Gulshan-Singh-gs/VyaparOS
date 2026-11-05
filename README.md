<div align="center">

# VyaparOS

### A vernacular-first operating system for Indian small businesses

**Bring bills, inventory, customer credit, suppliers, GST preparation, and day-to-day operations together—with financial rules you can trust.**

[![GitHub](https://img.shields.io/badge/GitHub-VyaparOS-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Gulshan-Singh-gs/VyaparOS)
[![Git](https://img.shields.io/badge/Git-version--controlled-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-98.4%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-12.8.1-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/repo)

[Explore the code](https://github.com/Gulshan-Singh-gs/VyaparOS) · [Read the architecture](docs/ARCHITECTURE.md) · [View project status](PROJECT_STATUS.md)

</div>

---

## About

VyaparOS is a mobile-first merchant platform designed around the way small businesses work. Its goal is to turn everyday activity—handwritten bills, stock changes, customer **udhaar** (credit), and supplier purchases—into organized, reviewable business records.

The product is designed with Hindi, Punjabi, English, and Hinglish-speaking merchants in mind, including shops that may have unreliable internet access. Financial correctness, traceability, and merchant approval are core principles: AI can suggest information, but deterministic business logic and people remain in control of financial records.

> **Project status:** The repository includes a working web application, shared business logic, and an API workspace. Native Android packaging and end-to-end offline-sync testing are listed as in progress. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the latest repository status.

## Highlights

- **Merchant workspace:** Dashboard, Bills, Inventory, Udhaar, Suppliers, Voice Assistant, GST Workspace, Analytics, and Settings.
- **Financially safe money handling:** Monetary values use integer paise rather than floating-point arithmetic.
- **Auditable ledgers:** Inventory and customer credit are represented as movements and transactions, not just overwritten balances.
- **AI-assisted, human-reviewed workflows:** Bill extraction and voice-driven actions are proposals; merchant confirmation is required before financial mutations.
- **GST calculations and exports:** Deterministic calculations and export preparation, with clear distinction between preparing data and filing a return.
- **Offline-minded experience:** IndexedDB-backed local capabilities and sync controls are part of the application design.
- **Shared TypeScript domain package:** Business rules and validation are reusable across the web app and API.

## Built with

| Area | Technologies |
| --- | --- |
| Web | React 19, Vite, TypeScript, Tailwind CSS, React Router |
| API | Hono, Cloudflare Workers, TypeScript |
| Shared contracts and rules | TypeScript, Zod |
| Data and identity integrations | Neon PostgreSQL, Drizzle ORM, Supabase Auth |
| Local data | IndexedDB (`idb-keyval`) |
| Monorepo | pnpm workspaces, Turborepo |
| Testing | Vitest |
| Mobile foundation | Capacitor |

## Repository structure

```text
VyaparOS/
├── apps/
│   ├── web/              # Merchant-facing React application
│   └── api/              # Hono API for Cloudflare Workers
├── packages/
│   └── shared/           # Shared schemas, types, and business logic
├── docs/                 # Architecture, data model, and security docs
├── .env.example          # Environment variable reference
├── ARCHITECTURE_DECISIONS.md
├── PROJECT_STATUS.md
├── pnpm-workspace.yaml
└── turbo.json
```

## Getting started

### Prerequisites

- Node.js (a version compatible with the project dependencies)
- [Corepack](https://nodejs.org/api/corepack.html) or pnpm
- Git

The repository pins pnpm `12.8.1` in `package.json`.

### Install dependencies

```bash
git clone https://github.com/Gulshan-Singh-gs/VyaparOS.git
cd VyaparOS
corepack enable
corepack prepare pnpm@12.8.1 --activate
pnpm install
```

### Configure environment

Use `.env.example` as the reference for required integrations. Create local environment files in the locations expected by each app/tooling setup, and provide only the credentials needed for the service you are running.

```bash
cp .env.example .env
```

Configure the database, Supabase, Gemini, and API URL values as needed. Keep secrets such as `SUPABASE_SERVICE_ROLE_KEY`, database credentials, and AI provider keys server-side. **Never commit real credentials or expose privileged keys in browser variables.**

### Run the applications

Start the workspace development tasks with:

```bash
pnpm dev
```

The web application and API can also be started separately:

```bash
pnpm --filter @vyapar-os/web dev
pnpm --filter @vyapar-os/api dev
```

Check the app-specific configuration and environment variables before connecting to external services.

## Useful commands

Run these from the repository root:

| Command | Description |
| --- | --- |
| `pnpm dev` | Start workspace development tasks |
| `pnpm build` | Build workspace packages and apps |
| `pnpm test` | Run workspace tests |
| `pnpm typecheck` | Type-check workspace packages and apps |
| `pnpm lint` | Run configured lint tasks |
| `pnpm --filter @vyapar-os/web dev` | Start the web app only |
| `pnpm --filter @vyapar-os/api dev` | Start the API only |

## Product principles

1. **Financial correctness before convenience.** Use deterministic validation for monetary and tax calculations.
2. **AI proposes; merchants approve.** Extracted or interpreted data must be reviewed before it can create a financial record.
3. **Keep a useful audit trail.** Corrections and financial movements should remain traceable.
4. **Do not silently lose offline work.** Local changes and sync state should be visible to the merchant.
5. **Protect tenant boundaries.** The server must determine a merchant's identity from verified authentication—not trust a client-supplied merchant ID.
6. **Be precise about compliance.** Export preparation is not the same as government filing or a verified filing integration.

More detail is documented in [Architecture Decisions](ARCHITECTURE_DECISIONS.md) and [Security](docs/SECURITY.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Security](docs/SECURITY.md)
- [Architecture decisions](ARCHITECTURE_DECISIONS.md)
- [Project status and roadmap](PROJECT_STATUS.md)
- [Engineering directive](inititate.md)

## Contributing

Contributions, bug reports, and practical feedback are welcome. Before opening a pull request:

1. Check [open issues](https://github.com/Gulshan-Singh-gs/VyaparOS/issues) and describe the change you plan to make.
2. Keep financial calculations deterministic and add tests for edge cases.
3. Avoid including real merchant data, documents, or secrets in commits and fixtures.
4. Run the relevant checks (`pnpm test`, `pnpm typecheck`, and `pnpm build`).
5. Clearly document any integration or setup requirements.

## License

No license file is currently present in this repository. Unless a license is added, standard copyright applies and reuse is not automatically granted.

---

<div align="center">

Built for the everyday work of local businesses. **Financial records stay reviewable, traceable, and merchant-controlled.**

</div>
