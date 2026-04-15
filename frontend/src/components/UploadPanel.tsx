import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { uploadCsv } from "../api/pricing";
import StatusMessage from "./StatusMessage";

export default function UploadPanel() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [csvContent, setCsvContent] = useState("");

  const mutation = useMutation({
    mutationFn: () => uploadCsv(csvContent, fileName || "manual-upload.csv"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-search"] });
      setCsvContent("");
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsvContent(reader.result as string);
    reader.readAsText(file);
  };

  return (
    <section className="card" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Upload CSV Feed</h2>

      <label htmlFor="csv-file">Choose CSV file</label>
      <input
        id="csv-file"
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <label htmlFor="csv-name">File name (optional override)</label>
      <input
        id="csv-name"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        placeholder="prices-apr-2026.csv"
      />

      <label htmlFor="csv-content">Or paste CSV content</label>
      <textarea
        id="csv-content"
        rows={6}
        value={csvContent}
        onChange={(e) => setCsvContent(e.target.value)}
        placeholder="Store ID,SKU,Product Name,Price,Date"
      />

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !csvContent}
      >
        {mutation.isPending ? "Uploading\u2026" : "Upload Feed"}
      </button>

      {mutation.isSuccess && (
        <StatusMessage type="success" message="Upload processed successfully." />
      )}
      {mutation.isError && (
        <StatusMessage
          type="error"
          message={
            (mutation.error as Error)?.message ?? "Upload failed."
          }
        />
      )}
    </section>
  );
}
