import api from "./client";
import type { PricingRecord, SearchFilters, SearchResponse } from "../types";

export async function searchPricing(
  filters: SearchFilters,
  page: number,
  pageSize: number
): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>("/pricing/search", {
    params: { ...filters, page, pageSize },
  });
  return data;
}

export async function uploadCsv(
  csvContent: string,
  fileName: string
): Promise<{ message: string; rowsProcessed: number }> {
  const { data } = await api.post("/pricing/upload", { csvContent, fileName });
  return data;
}

export async function updatePricingRecord(
  id: number,
  body: {
    productName: string;
    price: number;
    priceDate: string;
    version: number;
  }
): Promise<{ data: PricingRecord }> {
  const { data } = await api.put(`/pricing/${id}`, body);
  return data;
}
