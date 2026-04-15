import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { searchPricing } from "../api/pricing";
import type { PricingRecord, SearchFilters } from "../types";

const EMPTY_FILTERS: SearchFilters = { storeId: "", sku: "", productName: "" };

export function usePricingSearch(enabled: boolean) {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [fuzzyTerm, setFuzzyTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const query = useQuery({
    queryKey: ["pricing-search", filters, page, pageSize],
    enabled,
    queryFn: () => searchPricing(filters, page, pageSize),
  });

  const apiRows: PricingRecord[] = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = query.data?.totalPages ?? 0;

  const displayRows = useMemo(() => {
    const term = fuzzyTerm.trim();
    if (!term) return apiRows;
    const fuse = new Fuse(apiRows, {
      keys: ["store_id", "sku", "product_name"],
      threshold: 0.35,
      ignoreLocation: true,
    });
    return fuse.search(term).map((r) => r.item);
  }, [apiRows, fuzzyTerm]);

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setFuzzyTerm("");
    setPage(1);
  };

  return {
    filters,
    setFilters,
    fuzzyTerm,
    setFuzzyTerm,
    page,
    setPage,
    pageSize,
    total,
    totalPages,
    displayRows,
    query,
    resetFilters,
  };
}
