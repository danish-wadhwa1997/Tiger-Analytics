import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { usePricingSearch } from "./hooks/usePricingSearch";
import LoginView from "./components/LoginView";
import UploadPanel from "./components/UploadPanel";
import SearchPanel from "./components/SearchPanel";
import ResultsTable from "./components/ResultsTable";
import Pagination from "./components/Pagination";
import EditDrawer from "./components/EditDrawer";
import type { PricingRecord } from "./types";

export default function App() {
  const auth = useAuth();
  const search = usePricingSearch(auth.isAuthenticated);
  const [editRecord, setEditRecord] = useState<PricingRecord | null>(null);

  if (!auth.isAuthenticated) {
    return <LoginView loginMutation={auth.loginMutation} />;
  }

  return (
    <main className="container">
      <h1>Retail Pricing Management</h1>
      <div className="header-bar">
        <p>
          Signed in as <strong>{auth.user?.username}</strong> ({auth.user?.role})
        </p>
        <button onClick={auth.logout}>Logout</button>
      </div>

      {auth.canEdit && <UploadPanel />}

      <section className="card" aria-labelledby="search-heading">
        <h2 id="search-heading">Search Pricing Records</h2>
        <SearchPanel
          filters={search.filters}
          setFilters={search.setFilters}
          fuzzyTerm={search.fuzzyTerm}
          setFuzzyTerm={search.setFuzzyTerm}
          onSearch={() => search.query.refetch()}
          isSearching={search.query.isFetching}
        />
        <ResultsTable
          rows={search.displayRows}
          canEdit={auth.canEdit}
          onEdit={setEditRecord}
        />
        <Pagination
          page={search.page}
          totalPages={search.totalPages}
          total={search.total}
          onPageChange={search.setPage}
        />
      </section>

      {editRecord && (
        <EditDrawer record={editRecord} onClose={() => setEditRecord(null)} />
      )}
    </main>
  );
}
