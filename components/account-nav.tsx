"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/account", label: "Overview" },
  { href: "/today", label: "Today" },
  { href: "/account/inbox", label: "Inbox" },
  { href: "/account/reviews", label: "Reviews" },
  { href: "/account/rent-reports", label: "Rent reports" },
  { href: "/saved", label: "Saved" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="sticky top-16 z-40 border-b border-rule bg-paper">
      <div className="dossier-wrap">
        <ul className="flex gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "inline-flex min-h-11 items-center rounded-md border border-ink bg-surface px-3.5 text-sm font-semibold text-ink"
                      : "inline-flex min-h-11 items-center rounded-md px-3.5 text-sm font-semibold text-mute hover:bg-muted hover:text-ink"
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
