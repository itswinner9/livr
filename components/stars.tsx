export function Stars({
  value,
  label,
  showValue = true,
}: {
  value: number | null;
  label?: string;
  showValue?: boolean;
}) {
  if (value == null) {
    return <span className="text-sm text-mute">No published ratings yet</span>;
  }
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-star" aria-label={label ?? `${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden className={i < rounded ? "text-star" : "text-star-dim"}>
          {i < rounded ? "★" : "☆"}
        </span>
      ))}
      {showValue ? <span className="figure ml-1 text-sm text-ink">{value.toFixed(1)}</span> : null}
    </span>
  );
}
