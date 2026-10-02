import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
        status === "published" ||
        status === "approved" ||
        status === "admin" ||
        status === "moderator"
          ? "bg-muted text-ink"
          : status === "rejected" || status === "hidden" || status === "deleted"
            ? "bg-destructive/15 text-destructive"
            : "bg-muted text-mute",
      )}
    >
      {label}
    </span>
  );
}
