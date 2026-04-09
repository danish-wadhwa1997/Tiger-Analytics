# Assumptions

- The case study is local/demo only and does not require cloud deployment artifacts.
- CSV headers are exactly `Store ID, SKU, Product Name, Price, Date`.
- User directory is internal and seeded for demo (`admin`, `editor`, `viewer`).
- Pricing edits must be audited but no approval workflow is required.
- Data volume defaults: up to low millions of rows over time with paginated user search.
