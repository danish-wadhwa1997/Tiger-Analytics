import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";

let adminToken = "";

describe("Auth", () => {
  it("rejects invalid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "admin", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("rejects malformed request body", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "ab" });
    expect(res.status).toBe(400);
  });

  it("returns token for valid admin login", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "admin", password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("admin");
    adminToken = res.body.token;
  });
});

describe("Upload", () => {
  beforeAll(async () => {
    if (!adminToken) {
      const res = await request(app)
        .post("/auth/login")
        .send({ username: "admin", password: "Password123!" });
      adminToken = res.body.token;
    }
  });

  it("rejects unauthenticated upload", async () => {
    const res = await request(app)
      .post("/pricing/upload")
      .send({ csvContent: "a", fileName: "b" });
    expect(res.status).toBe(401);
  });

  it("rejects upload for viewer role", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ username: "viewer", password: "Password123!" });
    const viewerToken = loginRes.body.token;

    const res = await request(app)
      .post("/pricing/upload")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ csvContent: "a", fileName: "b" });
    expect(res.status).toBe(403);
  });

  it("processes valid CSV upload", async () => {
    const csv = [
      "Store ID,SKU,Product Name,Price,Date",
      "US-NY-001,SKU-1001,Organic Milk 1L,3.49,2026-04-01",
      "US-CA-113,SKU-1001,Organic Milk 1L,3.79,2026-04-01",
    ].join("\n");

    const res = await request(app)
      .post("/pricing/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ csvContent: csv, fileName: "test.csv" });

    expect(res.status).toBe(200);
    expect(res.body.rowsProcessed).toBe(2);
  });
});

describe("Search", () => {
  it("rejects unauthenticated search", async () => {
    const res = await request(app).get("/pricing/search");
    expect(res.status).toBe(401);
  });

  it("returns paginated results with total", async () => {
    const res = await request(app)
      .get("/pricing/search")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("totalPages");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("filters by store_id exact match", async () => {
    const res = await request(app)
      .get("/pricing/search?storeId=US-NY-001")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    for (const row of res.body.data) {
      expect(row.store_id).toBe("US-NY-001");
    }
  });
});

describe("Edit", () => {
  it("rejects edit without version field", async () => {
    const res = await request(app)
      .put("/pricing/1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productName: "Test", price: 1.0, priceDate: "2026-04-01" });

    expect(res.status).toBe(400);
  });

  it("updates record with correct version", async () => {
    const searchRes = await request(app)
      .get("/pricing/search?storeId=US-NY-001&sku=SKU-1001")
      .set("Authorization", `Bearer ${adminToken}`);

    const record = searchRes.body.data[0];
    if (!record) return;

    const res = await request(app)
      .put(`/pricing/${record.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productName: "Organic Milk 1L Updated",
        price: 3.59,
        priceDate: "2026-04-01",
        version: record.version,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.product_name).toBe("Organic Milk 1L Updated");
    expect(res.body.data.version).toBe(record.version + 1);
  });

  it("rejects stale version with 409", async () => {
    const searchRes = await request(app)
      .get("/pricing/search?storeId=US-NY-001&sku=SKU-1001")
      .set("Authorization", `Bearer ${adminToken}`);

    const record = searchRes.body.data[0];
    if (!record) return;

    const staleVersion = record.version - 1;
    const res = await request(app)
      .put(`/pricing/${record.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productName: "Stale Update",
        price: 9.99,
        priceDate: "2026-04-01",
        version: staleVersion,
      });

    expect(res.status).toBe(409);
  });
});

describe("Health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
