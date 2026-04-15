# Assumptions

## Scope

- This is a local/demo implementation for a case study interview.
- No cloud deployment artifacts (Terraform, Kubernetes manifests) are required.
- No CI/CD pipeline is in scope, though the project is Docker-ready.

## Data Model

- CSV headers are exactly: `Store ID, SKU, Product Name, Price, Date`.
- Price is a positive decimal number. Currency is implied per-store/country and not included in the CSV.
- Date format in CSV is ISO 8601 (`YYYY-MM-DD`).
- The unique business key for a pricing record is `(store_id, sku, price_date)`.

## Users and Access

- User directory is internal and seeded for demo with three accounts: `admin`, `editor`, `viewer`.
- No self-registration or external identity provider (SSO/OIDC) is required.
- All three roles share the same password for demo convenience.

## Scale Expectations

- Up to 3000 stores, each with thousands of SKUs.
- Data volume grows into low millions of rows over months.
- Concurrent user count is moderate (tens to low hundreds).
- CSV uploads range from tens to low thousands of rows per file.

## Operations

- Pricing edits must be audited but no approval workflow is required.
- No automated scheduled ingestion; uploads are user-initiated.
- Backup and disaster recovery are handled at the infrastructure level (managed database).
