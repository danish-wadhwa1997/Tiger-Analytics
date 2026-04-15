# Context Diagram

Shows the system boundary, external actors, and primary data flows.

```mermaid
flowchart LR
  subgraph External Actors
    OpsUser[Retail Ops User]
    AdminUser[Admin / IT Ops]
  end

  subgraph System Boundary
    SPA[React SPA<br/>Browser]
    API[Pricing API<br/>Node.js + Express]
    DB[(PostgreSQL<br/>Pricing Data)]
  end

  subgraph Cross-Cutting
    Logs[Structured Logs]
    Health[Health / Readiness]
  end

  OpsUser -- Upload CSV / Search / Edit --> SPA
  AdminUser -- Manage Users / Monitor --> API
  SPA -- REST over HTTPS --> API
  API -- SQL over TCP --> DB
  API --> Logs
  API --> Health
```

## Actors

| Actor | Description |
|---|---|
| Retail Ops User | Uploads pricing feeds, searches records, edits prices via the SPA. |
| Admin / IT Ops | Manages user accounts, monitors health, reviews audit logs. |

## Data Flows

| Flow | Protocol | Purpose |
|---|---|---|
| SPA → API | REST/JSON over HTTP | Authentication, upload, search, edit |
| API → DB | PostgreSQL wire protocol | Persistence, querying, audit logging |
| API → Logs | stdout/stderr | Structured request and error logging |
