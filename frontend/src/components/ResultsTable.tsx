import type { PricingRecord } from "../types";

interface Props {
  rows: PricingRecord[];
  canEdit: boolean;
  onEdit: (record: PricingRecord) => void;
}

export default function ResultsTable({ rows, canEdit, onEdit }: Props) {
  return (
    <table aria-label="Pricing records">
      <caption className="sr-only">Search results for pricing records</caption>
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Store</th>
          <th scope="col">SKU</th>
          <th scope="col">Product</th>
          <th scope="col">Price</th>
          <th scope="col">Date</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={7} className="muted" style={{ textAlign: "center" }}>
              No records found.
            </td>
          </tr>
        )}
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.id}</td>
            <td>{r.store_id}</td>
            <td>{r.sku}</td>
            <td>{r.product_name}</td>
            <td>{r.price}</td>
            <td>{r.price_date?.slice(0, 10)}</td>
            <td>
              {canEdit ? (
                <button onClick={() => onEdit(r)}>Edit</button>
              ) : (
                <span className="muted">View only</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
