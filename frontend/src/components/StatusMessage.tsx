interface Props {
  type: "success" | "error" | "info";
  message: string;
}

export default function StatusMessage({ type, message }: Props) {
  if (!message) return null;

  const className = `status status--${type}`;
  return (
    <div className={className} role="status" aria-live="polite">
      {message}
    </div>
  );
}
