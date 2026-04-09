# Context Diagram

```mermaid
flowchart LR
  User[Retail Operations User] --> SPA[Single Page Application]
  SPA --> API[Pricing API Service]
  API --> DB[(PostgreSQL)]
  API --> OBS[Logs + Metrics]
  Admin[Operations/Admin] --> API
```
