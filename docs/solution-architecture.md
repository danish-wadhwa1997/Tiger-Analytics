# Solution Architecture

```mermaid
flowchart TD
  subgraph Browser
    UI[React SPA]
  end
  subgraph App
    Auth[Auth + RBAC]
    Ingest[CSV Ingest]
    Search[Search API]
    Edit[Edit + Audit]
  end
  subgraph Data
    P[(PostgreSQL)]
  end
  UI --> Auth
  UI --> Ingest
  UI --> Search
  UI --> Edit
  Auth --> P
  Ingest --> P
  Search --> P
  Edit --> P
```
