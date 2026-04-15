interface Props {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: Props) {
  if (totalPages <= 1 && total <= 0) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        &laquo; Prev
      </button>
      <span aria-current="page">
        Page {page} of {totalPages} ({total} records)
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next &raquo;
      </button>
    </nav>
  );
}
