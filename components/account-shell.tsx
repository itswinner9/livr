import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AccountNav } from "@/components/account-nav";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <section className="bg-surface">
        <div className="dossier-wrap py-3">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-mute">
            <Link href="/explore" className="hover:text-accent">
              Explore
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="font-semibold text-ink">Account</span>
          </nav>
        </div>
      </section>
      <AccountNav />
      {children}
    </div>
  );
}
