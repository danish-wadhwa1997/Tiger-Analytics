import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import axios from "axios";

type User = { id: number; username: string; role: "admin" | "editor" | "viewer" };
type PricingRecord = {
  id: number;
  store_id: string;
  sku: string;
  product_name: string;
  price: string;
  price_date: string;
  updated_at: string;
};

const api = axios.create({
  baseURL: "http://localhost:4000"
});

function App() {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [login, setLogin] = useState({ username: "admin", password: "Password123!" });
  const [csvName, setCsvName] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [filters, setFilters] = useState({ storeId: "", sku: "", productName: "" });
  const [editRecord, setEditRecord] = useState<PricingRecord | null>(null);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/auth/login", login);
      return response.data as { token: string; user: User };
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        "/pricing/upload",
        { csvContent, fileName: csvName || "manual-upload.csv" },
        { headers: authHeaders }
      );
      return response.data as { message: string };
    }
  });

  const searchQuery = useQuery({
    queryKey: ["pricing-search", filters, token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await api.get("/pricing/search", {
        params: filters,
        headers: authHeaders
      });
      return response.data as { data: PricingRecord[] };
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editRecord) {
        throw new Error("No record selected.");
      }
      return api.put(
        `/pricing/${editRecord.id}`,
        {
          productName: editRecord.product_name,
          price: Number(editRecord.price),
          priceDate: editRecord.price_date
        },
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      searchQuery.refetch();
      setEditRecord(null);
    }
  });

  const canEdit = user?.role === "admin" || user?.role === "editor";

  if (!token) {
    return (
      <main className="container">
        <h1>Retail Pricing Management</h1>
        <p>Sign in with RBAC-enabled account.</p>
        <div className="card">
          <label>
            Username
            <input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
            />
          </label>
          <button onClick={() => loginMutation.mutate()} disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </div>
        <p className="muted">Demo users: admin/editor/viewer with password Password123!</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Retail Pricing Management</h1>
      <p>
        Signed in as <strong>{user?.username}</strong> ({user?.role})
      </p>

      {canEdit && (
        <section className="card">
          <h2>Upload CSV Feed</h2>
          <label>
            File Name
            <input value={csvName} onChange={(e) => setCsvName(e.target.value)} placeholder="prices-apr-2026.csv" />
          </label>
          <label>
            CSV Content
            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Store ID,SKU,Product Name,Price,Date"
            />
          </label>
          <button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !csvContent}>
            {uploadMutation.isPending ? "Uploading..." : "Upload Feed"}
          </button>
        </section>
      )}

      <section className="card">
        <h2>Search Pricing Records</h2>
        <div className="filters">
          <input
            placeholder="Store ID"
            value={filters.storeId}
            onChange={(e) => setFilters({ ...filters, storeId: e.target.value })}
          />
          <input placeholder="SKU" value={filters.sku} onChange={(e) => setFilters({ ...filters, sku: e.target.value })} />
          <input
            placeholder="Product Name"
            value={filters.productName}
            onChange={(e) => setFilters({ ...filters, productName: e.target.value })}
          />
          <button onClick={() => searchQuery.refetch()} disabled={searchQuery.isFetching}>
            Search
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Store</th>
              <th>SKU</th>
              <th>Product</th>
              <th>Price</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(searchQuery.data?.data ?? []).map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.store_id}</td>
                <td>{record.sku}</td>
                <td>{record.product_name}</td>
                <td>{record.price}</td>
                <td>{record.price_date}</td>
                <td>
                  {canEdit ? (
                    <button onClick={() => setEditRecord(record)}>Edit</button>
                  ) : (
                    <span className="muted">View only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {editRecord && (
        <section className="card">
          <h2>Edit Record #{editRecord.id}</h2>
          <label>
            Product Name
            <input
              value={editRecord.product_name}
              onChange={(e) => setEditRecord({ ...editRecord, product_name: e.target.value })}
            />
          </label>
          <label>
            Price
            <input
              type="number"
              value={editRecord.price}
              onChange={(e) => setEditRecord({ ...editRecord, price: e.target.value })}
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={editRecord.price_date}
              onChange={(e) => setEditRecord({ ...editRecord, price_date: e.target.value })}
            />
          </label>
          <div className="actions">
            <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              Save
            </button>
            <button onClick={() => setEditRecord(null)}>Cancel</button>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
