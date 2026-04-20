# Interview Cheat Sheet — Retail Pricing Feed (Detailed)

Use this document to **review quickly** and **learn concepts** in context. Each section builds on the previous one.

---

## Part 0 — The elevator pitch (30 seconds)

**What problem does this solve?**  
Retail chains receive **pricing feeds** (CSV) from many stores. Ops teams need to **load** that data, **find** rows by store/SKU/product/date, and **correct** prices when something is wrong — with **traceability** (who changed what).

**What did you build?**  
A **single-page web app** plus a **REST API** and **PostgreSQL**. Users sign in with **roles** (admin/editor can upload and edit; viewer can only search). CSVs are **validated**, **upserted** (no duplicate keys for the same store/SKU/date), searches are **paginated** with **totals**, and edits use **optimistic locking** plus an **audit trail**.

**Why these technologies?**  
**React** for UI, **Node/Express** for a simple API, **Postgres** for relational data and strong querying — a common, boring, interview-friendly stack.

---

## Part 1 — Glossary (read once, refer back)

| Term | Plain English |
|------|----------------|
| **SPA** | Single Page Application: one HTML shell; navigation updates content via JavaScript without full page reloads. |
| **REST API** | HTTP endpoints (GET/POST/PUT) that return JSON; clients call URLs with verbs that match actions. |
| **JWT** | JSON Web Token: signed string the server gives after login; client sends it in `Authorization: Bearer …` to prove identity. |
| **RBAC** | Role-Based Access Control: permissions come from a **role** (admin/editor/viewer), not from custom rules per button. |
| **Upsert** | “Insert if new, update if key already exists” — implemented here with SQL `INSERT … ON CONFLICT … DO UPDATE`. |
| **Idempotent** | Running the same operation twice has the same effect as once — here, re-uploading the same feed updates the same logical rows instead of duplicating. |
| **Pagination** | Returning **one page** of rows (e.g. 20) plus **total count** so the UI can show “page 2 of 50”. |
| **Optimistic locking** | No DB lock while editing; you send the **version** you read; if someone else saved first, your version is stale → server returns **409 Conflict**. |
| **Audit trail** | A separate table storing **before/after** snapshots of a row when it changes, plus **who** and **when**. |
| **Index** | A data structure that speeds up lookups (like a book index); trade-off: faster reads, slightly slower writes and more disk. |
| **Parameterized query** | SQL uses `$1, $2` placeholders so user input is **never** concatenated into SQL strings — prevents SQL injection. |
| **Middleware** | Functions that run on every request (or on a route group) **before** your handler — auth, rate limit, error formatting. |

---

## Part 2 — End-to-end flow (how a request moves)

### 2.1 Login

1. Browser sends `POST /auth/login` with `{ username, password }`.
2. Server looks up user, compares password with **bcrypt** (slow hash; safe storage).
3. Server signs a **JWT** containing `{ id, username, role }` with a **secret** (`JWT_SECRET`).
4. Browser stores the token (in this app: React state; production often **httpOnly cookie**).
5. Later requests send `Authorization: Bearer <token>`.

**Why bcrypt?**  
Passwords are never stored plain. Even if the DB leaks, attackers must brute-force hashes.

**Why JWT “stateless”?**  
The server doesn’t need a session table for every user — it verifies the signature. **Trade-off:** revoking a token before expiry needs extra design (denylist, short TTL, refresh tokens).

### 2.2 Upload CSV

1. Only **admin** or **editor** (middleware checks JWT role).
2. Body contains **file name** + **CSV text** (or file read in browser and sent as string).
3. Server **parses** CSV to rows, **validates** each row (required columns, numeric price, date).
4. **Transaction:** insert a row in `feed_upload` (metadata), then **batch upsert** into `pricing_record` in chunks (e.g. 500 rows) for performance.
5. **Commit** if all good; **rollback** if anything fails (atomicity).

**Why a transaction?**  
Either the whole upload succeeds as a unit, or nothing partial is left behind (integrity).

**Why batch upsert?**  
Row-by-row `INSERT` = many round-trips to the database. Batching = fewer round-trips, better throughput for large files.

### 2.3 Search

1. Any authenticated role can call `GET /pricing/search` with query params (`storeId`, `sku`, `productName`, price range, dates, `page`, `pageSize`).
2. Server builds a **WHERE** clause with **parameterized** values.
3. Two queries (or one count + one data): **`COUNT(*)`** for total matches, **`SELECT … LIMIT/OFFSET`** for the page.
4. Response includes **`total`**, **`totalPages`**, **`page`**, **`pageSize`**, **`data`**.

**Why total count?**  
Without it, the UI cannot show “page 3 of 20” or know if more pages exist.

**Why exact match on Store ID / SKU?**  
They are **identifiers**. Prefix/wildcard search on IDs often returns wrong matches (e.g. `S1` matching `S10`). Product name uses **partial** `ILIKE` because it’s human text.

### 2.4 Edit

1. **admin** or **editor** sends `PUT /pricing/:id` with `productName`, `price`, `priceDate`, and **`version`** (read when the row was loaded).
2. `UPDATE … SET …, version = version + 1 WHERE id = $id AND version = $expected`.
3. If **zero rows** updated → someone else changed the row first → **409** with a clear message.
4. If update succeeds → insert into **`pricing_record_audit`** (old JSON, new JSON, user id).

**Why version?**  
Classic **optimistic locking**: no long-lived database locks; conflicts are detected at save time.

---

## Part 3 — Database design (what each piece is for)

### 3.1 `app_user`

Stores **login identity**: username, **password hash**, **role**.  
Seeded users exist for demo (`admin`, `editor`, `viewer`).

### 3.2 `feed_upload`

One row per **upload attempt**: file name, who uploaded, row count, status.  
Lets you answer “which file produced this data?” and supports future status (`processing`, `failed`).

### 3.3 `pricing_record`

Core business table:

| Column | Meaning |
|--------|--------|
| `store_id` | Store identifier (can encode region, e.g. `US-NY-001`). |
| `sku` | Product identifier in that store’s catalog. |
| `product_name` | Display name; searchable with partial match. |
| `price` | `NUMERIC(12,2)` — exact decimal money, not float. |
| `price_date` | **Which day** this price applies (same SKU can have different prices on different dates). |
| `version` | Increments on each successful edit — **optimistic locking**. |
| `source_feed_id` | Optional link to `feed_upload`. |

**Unique constraint `(store_id, sku, price_date)`**  
Defines “one row per store + SKU + date.” That’s why **upsert** works: same key → update, new date → new row.

### 3.4 `pricing_record_audit`

Append-only **history**: `old_value`, `new_value` as JSONB, `changed_by`, `changed_at`.  
Supports compliance questions: “who changed this price?”

### 3.5 Indexes (why they matter)

- **Composite index** on `(store_id, sku, price_date)` — speeds filters that use those columns together (exact match paths).
- **`price_date`** — sorting/filtering by time.
- **`product_name` with `pg_trgm`** (if enabled) — helps **text** search patterns; requires `CREATE EXTENSION pg_trgm`.

**Interview tip:** Say “we index for the **queries we actually run**; adding indexes has a write cost, so we don’t index everything blindly.”

---

## Part 4 — Backend architecture (how code is organized)

**Layers (mental model):**

```
HTTP Request
    → Middleware (helmet, cors, json parser, rate limit, auth)
    → Route handler (thin)
    → Validator (Zod) — fail fast with 400
    → Service (business rules, transactions)
    → Repository / SQL (data access)
    → PostgreSQL
```

**Why separate layers?**  
- **Test** services without HTTP.  
- **Swap** storage later (e.g. queue for ingest).  
- **Keep** SQL out of route handlers so routes stay readable.

**Patterns you can name:**

| Pattern | Where it shows up |
|---------|-------------------|
| **Repository** | SQL grouped in one module; routes don’t embed raw queries everywhere. |
| **Middleware** | Auth and rate limit are reusable across routes. |
| **Centralized errors** | One `ApiError` + global handler → consistent JSON errors. |

---

## Part 5 — Frontend architecture

**Responsibilities:**

| Piece | Role |
|-------|------|
| **API module** | Axios instance; attach `Authorization` header when logged in. |
| **Custom hooks** | `useAuth` (login/logout/token), `usePricingSearch` (filters, page, query key). |
| **TanStack Query** | Caches server state, refetches after mutations, avoids manual `useEffect` spaghetti. |
| **Components** | Login, upload, search, table, pagination, edit panel — each **one job**. |
| **Fuse.js** | Optional fuzzy filter on **current page** of results — UX only; not a replacement for server search. |

**Query key:**  
`["pricing-search", filters, page, pageSize]` — when any of these change, React Query refetches. That’s **correctness**: stale data isn’t shown after you change filters or page.

---

## Part 6 — Non-functional requirements (how you talk about “3000 stores”)

| Concern | What you implemented | What you’d add at scale |
|---------|----------------------|-------------------------|
| **Performance** | Indexes, pagination, batch upsert | Read replicas, caching hot keys, async ingest |
| **Security** | JWT, bcrypt, RBAC, Helmet, Zod, rate limits | Secrets manager, WAF, stricter CORS, audit access |
| **Reliability** | Transactions, health check | Retries, dead-letter queue for failed jobs |
| **Observability** | Morgan logs, `/health` | Structured JSON logs, metrics, tracing |
| **Scalability** | Stateless API | Multiple API instances + load balancer; queue for big CSVs |

---

## Part 7 — Trade-offs (interview gold)

| Decision | Benefit | Cost / follow-up |
|----------|---------|------------------|
| JWT | Simple, stateless | Revocation, token storage (XSS if in localStorage) |
| Exact ID search | Correct semantics, index-friendly | Users must type full SKU/store unless you add a separate “prefix” mode |
| Client fuzzy filter | Fast UX on visible rows | Does not search the whole database |
| Sync CSV upload | Simple to reason about | Timeouts on huge files → queue + worker |
| In-memory rate limit | Easy | Wrong across multiple servers → Redis |
| Postgres | ACID, SQL, indexes | Operational expertise for HA, backups |

---

## Part 8 — Limitations (honesty beats overclaiming)

Say these with confidence — they show maturity:

- No **token refresh** / **logout** on all devices — demo scope.
- **Very large files** should use streaming + background jobs, not one HTTP request.
- **Rate limiting** is process-local — production needs a shared store.
- **Full global fuzzy search** would be server-side (or search engine), not only Fuse on one page.
- **Tests** — integration tests exist for API; E2E and load tests are natural next steps.

---

## Part 9 — Quick “if they ask…” answers

**“Why PostgreSQL?”**  
Relational model fits pricing rows, constraints and transactions matter, and we need flexible queries and indexes.

**“Why optimistic locking?”**  
Low contention; conflicts are rare for many retail workflows; 409 is acceptable UX with a refresh.

**“How do you prevent SQL injection?”**  
Parameterized queries everywhere; no string concatenation of user input into SQL.

**“How would you scale ingest?”**  
Stream parse, stage table or COPY, batch commit, or enqueue to workers; return job id and poll status.

**“Where is the single-page app?”**  
One `index.html`, React mounts into `#root`, client-side routing can be added; all main flows are in one app shell without full reloads.

---

## Part 10 — One-page memory hook (mnemonic)

**L-E-A-P-S:**  
**L**oad CSV (batch upsert) → **E**xact IDs + partial product search → **A**udit + **A**uth (RBAC) → **P**ages + **P**ostgres → **S**tale edit = 409 (version).

---

*This cheat sheet matches the architecture and docs in this repository. Adjust numbers (chunk size, rate limits) if your deployed code differs.*
