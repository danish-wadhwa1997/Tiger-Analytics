# Architectural Decision Records (ADRs)

## ADR-001: React + TypeScript SPA

**Context:** Need a single-page application for the case study with modern tooling.
**Decision:** React with TypeScript and Vite for fast builds and type safety.
**Consequences:** Strong ecosystem support; requires TypeScript discipline; Vite provides fast HMR for development.

## ADR-002: Node.js + Express Backend

**Context:** Need a lightweight API server that pairs well with TypeScript frontend.
**Decision:** Express with TypeScript, structured into layered modules (routes → services → repositories).
**Consequences:** Familiar ecosystem; explicit control over middleware chain; more boilerplate than frameworks like NestJS but simpler to understand for reviewers.

## ADR-003: PostgreSQL for Persistence

**Context:** Pricing data is relational (store × SKU × date), requires strong indexing, and must support complex search queries.
**Decision:** PostgreSQL 16 with composite indexes on search paths.
**Consequences:** Excellent query performance; ACID transactions for data integrity; schema migrations needed for evolution (acceptable trade-off).

## ADR-004: JWT + RBAC Authentication

**Context:** Case study requires role-based access control for upload/edit restrictions.
**Decision:** Stateless JWT tokens with three roles: `admin`, `editor`, `viewer`.
**Consequences:** Simple to implement and verify; no session storage needed; trade-off is no server-side revocation without a blacklist.

## ADR-005: Batch CSV Upsert

**Context:** Row-by-row INSERT doesn't scale for large feeds (3000 stores × many SKUs).
**Decision:** Parse CSV, validate all rows, then batch-upsert in chunks of 500 rows using multi-value INSERT with ON CONFLICT.
**Consequences:** Dramatically better throughput; single transaction ensures atomicity; trade-off is higher memory per batch (acceptable at 500 rows).

## ADR-006: Optimistic Locking for Edit Conflicts

**Context:** Multiple users may edit the same pricing record simultaneously.
**Decision:** Add `version` column; UPDATE requires matching version; reject with 409 Conflict if stale.
**Consequences:** No lock contention; clear user feedback on conflict; requires frontend to track and send version.

## ADR-007: Audit Trail via Separate Table

**Context:** Pricing changes in retail must be traceable for compliance and accountability.
**Decision:** `pricing_record_audit` stores before/after JSONB snapshots with user and timestamp.
**Consequences:** Full change history; queryable via SQL; trade-off is storage growth (mitigated by retention policy if needed).

## ADR-008: Client-Side Fuzzy Search

**Context:** Users want flexible search without changing backend identifier semantics.
**Decision:** Fuse.js on frontend filters the current page results; backend maintains exact match for `store_id`/`sku` (index-friendly).
**Consequences:** Fast UX for exploration; no index degradation; limitation is fuzzy only applies to loaded page, not full dataset.

## ADR-009: In-Memory Rate Limiting

**Context:** Need basic protection against brute-force login and upload abuse.
**Decision:** Simple in-process rate limiter keyed by IP + path.
**Consequences:** Works for single-instance demo; production would need Redis-backed distributed rate limiting.

## ADR-010: Docker Compose for Local Development

**Context:** Case study must be runnable with one command.
**Decision:** `docker-compose.yml` orchestrates PostgreSQL, backend, and frontend containers.
**Consequences:** Reproducible environment; no local dependency management needed; trade-off is Docker Desktop required on reviewer's machine.
