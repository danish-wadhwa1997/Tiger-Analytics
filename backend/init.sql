CREATE TABLE IF NOT EXISTS app_user (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer'))
);

CREATE TABLE IF NOT EXISTS feed_upload (
  id SERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES app_user(id),
  row_count INTEGER NOT NULL,
  status TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_record (
  id SERIAL PRIMARY KEY,
  store_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  price_date DATE NOT NULL,
  source_feed_id INTEGER REFERENCES feed_upload(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, sku, price_date)
);

CREATE INDEX IF NOT EXISTS idx_pricing_record_store_sku_date ON pricing_record(store_id, sku, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_record_product_name ON pricing_record(product_name);
CREATE INDEX IF NOT EXISTS idx_pricing_record_price_date ON pricing_record(price_date DESC);

CREATE TABLE IF NOT EXISTS pricing_record_audit (
  id SERIAL PRIMARY KEY,
  pricing_record_id INTEGER NOT NULL REFERENCES pricing_record(id),
  changed_by INTEGER NOT NULL REFERENCES app_user(id),
  old_value JSONB NOT NULL,
  new_value JSONB NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_user (username, password_hash, role)
VALUES
  ('admin', '$2b$10$4.n2eGRsLaLOSvKZG6h53u6EhMDxbMq1zVtpkK9eVDHLHxgC2Iy8a', 'admin'),
  ('editor', '$2b$10$4.n2eGRsLaLOSvKZG6h53u6EhMDxbMq1zVtpkK9eVDHLHxgC2Iy8a', 'editor'),
  ('viewer', '$2b$10$4.n2eGRsLaLOSvKZG6h53u6EhMDxbMq1zVtpkK9eVDHLHxgC2Iy8a', 'viewer')
ON CONFLICT (username) DO NOTHING;
