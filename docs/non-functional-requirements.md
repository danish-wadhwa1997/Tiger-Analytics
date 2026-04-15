# Non-Functional Requirements

For a retail chain with 3000 stores across multiple countries.

## Performance

| Requirement | Design Response |
|---|---|
| Search latency < 200ms at 95th percentile | Composite B-tree indexes on `(store_id, sku, price_date)`; paginated queries with LIMIT/OFFSET |
| CSV ingest throughput | Batch upsert in chunks of 500 rows; single transaction per upload |
| Frontend responsiveness | Client-side fuzzy filtering avoids round-trips for exploration |

## Scalability

| Requirement | Design Response |
|---|---|
| Growing data volume (millions of rows) | Server-side pagination with total count; indexed search paths |
| Increasing concurrent users | Stateless API enables horizontal scaling behind a load balancer |
| Large CSV feeds | Batch processing; future path: async queue workers for very large files |

## Availability

| Requirement | Design Response |
|---|---|
| Service uptime | Containerized deployment with health checks; stateless API restarts cleanly |
| Database availability | PostgreSQL with persistent volume; production path: managed HA Postgres |

## Security

| Requirement | Design Response |
|---|---|
| Authentication | JWT-based with bcrypt password hashing |
| Authorization | RBAC enforced at middleware level on every protected endpoint |
| Input validation | Zod schemas on all request bodies/query params |
| Secure headers | Helmet middleware sets security headers |
| Rate limiting | IP-based rate limiter on login (10/min) and upload (20/min) endpoints |
| SQL injection | Parameterized queries throughout |

## Reliability and Data Integrity

| Requirement | Design Response |
|---|---|
| No partial writes | Transaction boundaries on ingest and edit+audit operations |
| Idempotent feed updates | UNIQUE constraint on `(store_id, sku, price_date)` with ON CONFLICT upsert |
| Edit conflict detection | Optimistic locking via `version` column; 409 Conflict on stale update |
| Audit trail | Every edit captured in `pricing_record_audit` with before/after JSONB |

## Observability

| Requirement | Design Response |
|---|---|
| Request logging | Morgan middleware with structured output |
| Health monitoring | `/health` endpoint queries database connectivity |
| Error reporting | Centralized error handler with consistent JSON error shape |

## Internationalization Readiness

| Requirement | Design Response |
|---|---|
| Multi-country stores | `store_id` encoding supports country prefixes (e.g., US-NY-001, IN-MH-245) |
| Date handling | All dates stored as PostgreSQL DATE type; API uses ISO 8601 |
| Currency | Schema supports NUMERIC(12,2); currency column can be added without migration |

## Data Retention

| Requirement | Design Response |
|---|---|
| Audit log growth | JSONB storage with timestamp; partitioning or archival policy can be added |
| Feed upload history | `feed_upload` table tracks all uploads with metadata |
