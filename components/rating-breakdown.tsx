import type { RatingSummary } from "@/types/property";
import { scoreTone } from "@/components/listing-ui";

const rows: { key: keyof Omit<RatingSummary, "reviewCount" | "overall">; label: string }[] = [
  { key: "maintenance", label: "Maintenance" },
  { key: "management", label: "Management" },
  { key: "noise", label: "Noise" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "building_condition", label: "Building condition" },
  { key: "parking", label: "Parking" },
  { key: "value", label: "Value" },
];

export function RatingBreakdown({ summary }: { summary: RatingSummary }) {
  if (summary.reviewCount === 0) {
    return <p className="text-sm text-mute">No published ratings yet.</p>;
  }
  const scored = rows.filter((row) => summary[row.key] != null);
  if (scored.length === 0) {
    return (
      <p className="text-sm text-mute">
        Overall rating is {summary.overall != null ? `${summary.overall.toFixed(1)} / 5` : "on file"} from{" "}
        {summary.reviewCount} {summary.reviewCount === 1 ? "review" : "reviews"}. Category scores appear when renters
        rate those topics.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {scored.map((row) => {
        const value = summary[row.key];
        const width = value == null ? 0 : Math.max(0, Math.min(100, (value / 5) * 100));
        return (
          <li key={String(row.key)}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{row.label}</span>
              <span className="figure font-semibold text-star">{value == null ? "—" : value.toFixed(1)}</span>
            </div>
            <span className="block h-2.5 overflow-hidden rounded-sm bg-star-dim" aria-hidden>
              <span className={`block h-2.5 rounded-sm ${scoreTone(value)}`} style={{ width: `${width}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
