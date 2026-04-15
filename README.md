# Retail Pricing Feed Management

Single-page web application for uploading, searching, and editing pricing feeds for a retail chain with 3000+ stores across multiple countries.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, TanStack Query, Fuse.js |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 16 |
| Auth | JWT with RBAC (admin, editor, viewer) |
| Runtime | Docker Compose |

## Quick Start

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| Health check | http://localhost:4000/health |

## Demo Credentials

| Username | Password | Role | Permissions |
|---|---|---|---|
| admin | Password123! | admin | Upload, search, edit |
| editor | Password123! | editor | Upload, search, edit |
| viewer | Password123! | viewer | Search only |

## Functional Coverage

- Upload CSV pricing feeds (file picker or paste) with schema: `Store ID, SKU, Product Name, Price, Date`
- Batch upsert with idempotency on `(store_id, sku, price_date)`
- Search with exact ID filters, partial product name match, price range, date range
- Client-side fuzzy search within loaded results
- Server-side pagination with total count
- Edit/save with optimistic locking (version-based conflict detection)
- Full audit trail for every pricing edit

## Architecture

```
backend/src/
├── config/          # Environment, DB pool
├── middleware/       # Auth, error handler, rate limiter
├── modules/
│   ├── auth/        # Login (validator → service → routes)
│   ├── upload/      # CSV ingest (validator → service → routes)
│   └── pricing/     # Search/edit (validator → repository → service → routes)
├── types/           # Shared interfaces
├── app.ts           # Express bootstrap
└── index.ts         # Server entry

frontend/src/
├── api/             # HTTP client, auth API, pricing API
├── hooks/           # useAuth, usePricingSearch
├── components/      # LoginView, UploadPanel, SearchPanel,
│                    # ResultsTable, Pagination, EditDrawer, StatusMessage
├── types/           # Shared interfaces
├── App.tsx          # Root composition shell
└── main.tsx         # React entry
```

## Documentation

| Document | Path |
|---|---|
| Context Diagram | [docs/context-diagram.md](docs/context-diagram.md) |
| Solution Architecture | [docs/solution-architecture.md](docs/solution-architecture.md) |
| Design Decisions (ADRs) | [docs/design-decisions.md](docs/design-decisions.md) |
| Non-Functional Requirements | [docs/non-functional-requirements.md](docs/non-functional-requirements.md) |
| Assumptions | [docs/assumptions.md](docs/assumptions.md) |
| Known Limitations | [docs/limitations.md](docs/limitations.md) |
| API Reference | [docs/api-reference.md](docs/api-reference.md) |

## Sample Data

Use `sample-data/pricing-feed-sample.csv` for initial upload testing.
