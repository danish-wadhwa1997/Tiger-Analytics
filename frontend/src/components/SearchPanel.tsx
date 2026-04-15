import type { SearchFilters } from "../types";

interface Props {
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  fuzzyTerm: string;
  setFuzzyTerm: (t: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export default function SearchPanel({
  filters,
  setFilters,
  fuzzyTerm,
  setFuzzyTerm,
  onSearch,
  isSearching,
}: Props) {
  return (
    <div role="search" aria-label="Pricing record search">
      <div className="filters">
        <label htmlFor="f-store">
          Store ID
          <input
            id="f-store"
            placeholder="e.g. US-NY-001"
            value={filters.storeId}
            onChange={(e) => setFilters({ ...filters, storeId: e.target.value })}
          />
        </label>
        <label htmlFor="f-sku">
          SKU
          <input
            id="f-sku"
            placeholder="e.g. SKU-1001"
            value={filters.sku}
            onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
          />
        </label>
        <label htmlFor="f-product">
          Product Name
          <input
            id="f-product"
            placeholder="partial match"
            value={filters.productName}
            onChange={(e) =>
              setFilters({ ...filters, productName: e.target.value })
            }
          />
        </label>
        <button onClick={onSearch} disabled={isSearching}>
          {isSearching ? "Searching\u2026" : "Search"}
        </button>
      </div>
      <label htmlFor="fuzzy-filter">
        Fuzzy filter (within current page)
        <input
          id="fuzzy-filter"
          placeholder="Try near-match terms like milk, 1001, ny-001"
          value={fuzzyTerm}
          onChange={(e) => setFuzzyTerm(e.target.value)}
        />
      </label>
    </div>
  );
}
