# Known Limitations

## Authentication

- JWT tokens cannot be revoked server-side without a blacklist or short expiry + refresh token flow.
- No password policy enforcement (minimum complexity, rotation, lockout after failed attempts).
- No SSO/OIDC integration for enterprise identity providers.

## CSV Ingest

- Upload is synchronous within the HTTP request cycle. Very large files (10K+ rows) may approach timeout limits.
- No streaming parser; full CSV is loaded into memory before processing.
- No partial success: if any row fails validation, the entire upload is rolled back.
- No duplicate detection across uploads beyond the upsert key.

## Search

- Client-side fuzzy search only applies to the currently loaded page of results, not the full dataset.
- No full-text search index on `product_name` (uses ILIKE which is adequate for moderate scale but not optimal for millions of rows with complex queries).
- No saved searches or search history.

## Concurrency

- Optimistic locking detects conflicts but does not merge changes.
- No real-time collaboration or live update notifications when another user edits a record.

## Rate Limiting

- In-memory rate limiter is per-process; does not work correctly with multiple API instances behind a load balancer.
- Production requires Redis-backed distributed rate limiting.

## Observability

- No metrics endpoint (Prometheus/OpenTelemetry).
- No distributed tracing.
- No alerting integration.

## Frontend

- No offline support or service worker.
- No responsive design optimization for mobile devices.
- No keyboard shortcut support for power users.

## Testing

- Integration tests cover core API flows but no load/performance testing.
- No end-to-end browser tests (Playwright/Cypress).
- No accessibility audit automation (axe-core).
