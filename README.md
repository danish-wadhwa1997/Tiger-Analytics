# Retail Pricing Feed Management (Case Study)

Single-page web application for uploading, searching, and editing pricing feeds for a retail chain.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Auth: JWT with RBAC (`admin`, `editor`, `viewer`)
- Runtime: Docker Compose

## Functional Coverage

- Upload CSV pricing feed with schema:
  - `Store ID, SKU, Product Name, Price, Date`
- Persist and upsert pricing records
- Search pricing records using multiple criteria
- Edit/save pricing records
- Audit trail for every pricing edit

## Local Run

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health: `http://localhost:4000/health`

## Demo Credentials

- `admin` / `Password123!`
- `editor` / `Password123!`
- `viewer` / `Password123!`

## Sample CSV

Use `sample-data/pricing-feed-sample.csv` as initial upload content.

## API Endpoints

- `POST /auth/login`
- `POST /pricing/upload` (admin/editor)
- `GET /pricing/search` (all authenticated users)
- `PUT /pricing/:id` (admin/editor)

## Architecture Artifacts

- `docs/context-diagram.md`
- `docs/solution-architecture.md`
- `docs/design-decisions.md`
- `docs/non-functional-requirements.md`
- `docs/assumptions.md`

## Risks and Future Improvements

- Move CSV ingest to queue workers for very large feed sizes.
- Add optimistic locking (version token) for concurrent edit conflict handling.
- Add integration tests and contract tests for API.
- Add distributed tracing and alerting for production operations.
