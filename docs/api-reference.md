# API Reference

Base URL: `http://localhost:4000`

## Authentication

### POST /auth/login

Login and receive a JWT token.

**Rate limit:** 10 requests per minute per IP.

**Request body:**
```json
{
  "username": "admin",
  "password": "Password123!"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}
```

**Errors:** 400 (validation), 401 (bad credentials), 429 (rate limit)

---

## Pricing Upload

### POST /pricing/upload

Upload a CSV pricing feed. Requires `admin` or `editor` role.

**Rate limit:** 20 requests per minute per IP.

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "csvContent": "Store ID,SKU,Product Name,Price,Date\nUS-NY-001,SKU-1001,Milk,3.49,2026-04-01",
  "fileName": "april-prices.csv"
}
```

**Response 200:**
```json
{
  "message": "Upload processed successfully.",
  "rowsProcessed": 1
}
```

**Errors:** 400 (validation/CSV error), 401 (unauthenticated), 403 (unauthorized), 429 (rate limit)

---

## Pricing Search

### GET /pricing/search

Search pricing records with filters. Requires any authenticated role.

**Headers:** `Authorization: Bearer <token>`

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| storeId | string | Exact match on store ID |
| sku | string | Exact match on SKU |
| productName | string | Partial match (ILIKE) |
| minPrice | number | Minimum price filter |
| maxPrice | number | Maximum price filter |
| startDate | string | Start of date range (YYYY-MM-DD) |
| endDate | string | End of date range (YYYY-MM-DD) |
| page | number | Page number (default: 1) |
| pageSize | number | Results per page (default: 20, max: 100) |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "store_id": "US-NY-001",
      "sku": "SKU-1001",
      "product_name": "Organic Milk 1L",
      "price": "3.49",
      "price_date": "2026-04-01",
      "version": 0,
      "updated_at": "2026-04-09T15:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

## Pricing Edit

### PUT /pricing/:id

Update a pricing record. Requires `admin` or `editor` role. Uses optimistic locking.

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "productName": "Organic Milk 1L Updated",
  "price": 3.59,
  "priceDate": "2026-04-01",
  "version": 0
}
```

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "store_id": "US-NY-001",
    "sku": "SKU-1001",
    "product_name": "Organic Milk 1L Updated",
    "price": "3.59",
    "price_date": "2026-04-01",
    "version": 1,
    "updated_at": "2026-04-09T15:05:00.000Z"
  }
}
```

**Errors:** 400 (validation), 404 (not found), 409 (version conflict), 401/403 (auth)

---

## Health

### GET /health

**Response 200:**
```json
{ "status": "ok" }
```
