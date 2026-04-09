# Design Decisions

- **React + TypeScript SPA**: clear component model and fast developer iteration for demo delivery.
- **Node.js + Express API**: simple, predictable backend stack with explicit module boundaries.
- **PostgreSQL**: strong relational model and indexing for search-heavy pricing queries.
- **JWT + RBAC**: role-based access with `admin`, `editor`, `viewer` roles aligned to interview constraints.
- **Audit trail table**: captures before/after values for every record edit to support traceability.

## Trade-offs

- A single deployable API is easier for a case study, but large scale could move ingest to async workers.
- CSV is ingested synchronously for clarity, but production can batch and queue uploads.
