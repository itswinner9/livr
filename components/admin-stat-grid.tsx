import { cn } from "@/lib/utils";
import Link from "next/link";

export type AdminStatItem = {
  href: string;
  label: string;
  value: number;
  featured?: boolean;
  hint?: string;
};

export function AdminStatGrid({ items }: { items: AdminStatItem[] }) {
  const featured = items.some((item) => item.featured);
  const cols =
    featured || items.length === 4
      ? "sm:grid-cols-4"
      : items.length >= 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <dl className={cn("mt-4 grid grid-cols-2 gap-2 rounded-md border border-rule bg-surface p-2", cols)}>
      {items.map((item) => (
        <div
          key={item.href + item.label}
          className={cn("rounded-md bg-muted px-3 py-3", item.featured && "col-span-2 sm:col-span-1")}
        >
          <dt className="text-xs font-medium text-mute">{item.label}</dt>
          <dd>
            <Link
              href={item.href}
              className={cn(
                "mt-1 block font-extrabold leading-none tracking-tight text-ink tabular-nums hover:text-accent",
                item.featured ? "text-5xl" : "text-3xl",
              )}
            >
              {item.value}
            </Link>
            {item.hint ? <p className="mt-2 text-sm text-mute">{item.hint}</p> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
