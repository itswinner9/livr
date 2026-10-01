export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="5" width="14" height="12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 5V3.5H13V5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 15H17" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function LivRankWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <BrandMark className="size-5 text-ink" />
      <span className={compact ? "text-base font-bold tracking-tight" : "text-lg font-bold tracking-tight"}>
        LivRank
      </span>
    </span>
  );
}
