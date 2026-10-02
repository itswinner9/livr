"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminCounts } from "@/lib/admin/data";

const NAV = [
  { href: "/admin", label: "Overview", exact: true, countKey: null, always: false },
  { href: "/admin/reviews", label: "Reviews", exact: false, countKey: "pendingReviews" as const, always: false },
  { href: "/admin/rent-reports", label: "Rent reports", exact: false, countKey: "pendingRent" as const, always: false },
  { href: "/admin/flags", label: "Flags", exact: false, countKey: "flags" as const, always: false },
  { href: "/admin/properties", label: "Properties", exact: false, countKey: "properties" as const, always: true },
  { href: "/admin/users", label: "Users", exact: false, countKey: "users" as const, always: true },
  { href: "/admin/managers", label: "Managers", exact: false, countKey: null, always: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ counts }: { counts: AdminCounts }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const count = item.countKey ? counts[item.countKey] : 0;
        const showCount = item.countKey && (item.always || count > 0);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex min-h-11 items-center justify-between rounded-md border border-ink bg-muted px-3 py-2 text-sm font-semibold text-ink"
                : "flex min-h-11 items-center justify-between rounded-md px-3 py-2 text-sm text-mute hover:bg-muted hover:text-ink"
            }
          >
            {item.label}
            {showCount ? (
              <span className="figure rounded-sm bg-paper px-1.5 text-xs font-semibold tabular-nums text-ink">
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
