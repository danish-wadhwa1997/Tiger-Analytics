import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { updatePricingRecord } from "../api/pricing";
import StatusMessage from "./StatusMessage";
import type { PricingRecord } from "../types";

interface Props {
  record: PricingRecord;
  onClose: () => void;
}

export default function EditDrawer({ record, onClose }: Props) {
  const queryClient = useQueryClient();
  const nameRef = useRef<HTMLInputElement>(null);
  const [productName, setProductName] = useState(record.product_name);
  const [price, setPrice] = useState(record.price);
  const [priceDate, setPriceDate] = useState(record.price_date?.slice(0, 10));

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      updatePricingRecord(record.id, {
        productName,
        price: Number(price),
        priceDate,
        version: record.version,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-search"] });
      onClose();
    },
  });

  return (
    <section className="card" aria-labelledby="edit-heading">
      <h2 id="edit-heading">Edit Record #{record.id}</h2>
      <label htmlFor="edit-name">Product Name</label>
      <input
        id="edit-name"
        ref={nameRef}
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
      />
      <label htmlFor="edit-price">Price</label>
      <input
        id="edit-price"
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <label htmlFor="edit-date">Date</label>
      <input
        id="edit-date"
        type="date"
        value={priceDate}
        onChange={(e) => setPriceDate(e.target.value)}
      />
      <div className="actions">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving\u2026" : "Save"}
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
      {mutation.isError && (
        <StatusMessage
          type="error"
          message={
            (mutation.error as Error)?.message ??
            "Save failed. Record may have been modified by another user."
          }
        />
      )}
    </section>
  );
}
