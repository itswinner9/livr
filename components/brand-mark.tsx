export function LivRankWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "text-base font-bold tracking-tight text-ink" : "text-lg font-bold tracking-tight text-ink"}>
      LivRank
    </span>
  );
}
