export type UserRole = "admin" | "editor" | "viewer";

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface PricingRecord {
  id: number;
  store_id: string;
  sku: string;
  product_name: string;
  price: string;
  price_date: string;
  version: number;
  updated_at: string;
}

export interface SearchFilters {
  storeId: string;
  sku: string;
  productName: string;
}

export interface SearchResponse {
  data: PricingRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
