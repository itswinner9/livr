import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-rule px-1.5 py-0.5 text-[11px] font-medium text-mute",
        className,
      )}
    >
      {children}
    </span>
  );
}
