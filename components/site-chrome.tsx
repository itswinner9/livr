import { getSessionUser } from "@/lib/auth/session";
import { listListingFacets } from "@/lib/properties/queries";
import { LivRankWordmark } from "@/components/brand-mark";
import { CompareNavLink } from "@/components/compare-tray";
import { Bookmark, Plus, User } from "lucide-react";
import Link from "next/link";

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper">
      <div className="dossier-wrap flex h-16 items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="shrink-0">
            <LivRankWordmark />
          </Link>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-mute lg:flex" aria-label="Main">
          <Link href="/explore" className="hover:text-ink">
            Explore
          </Link>
          <CompareNavLink className="hover:text-ink" />
          {user ? (
            <Link href="/saved" className="hover:text-ink">
              Saved
            </Link>
          ) : null}
          {user?.role === "admin" || user?.role === "moderator" ? (
            <Link href="/admin" className="hover:text-ink">
              Admin
            </Link>
          ) : null}
          {user?.role === "manager" || user?.role === "admin" ? (
            <Link href="/manager" className="hover:text-ink">
              Manager
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <Link
              href="/saved"
              aria-label="Saved buildings"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-mute hover:text-ink"
            >
              <Bookmark className="size-[22px]" />
            </Link>
          ) : null}
          <Link
            href="/rate"
            className="hidden min-h-11 items-center gap-1 rounded-md bg-accent px-4 font-semibold text-paper hover:bg-accent-hover sm:inline-flex"
          >
            <Plus className="size-4" aria-hidden />
            Write a review
          </Link>
          {user ? (
            <Link href="/account" className="hidden font-semibold text-mute hover:text-ink sm:inline">
              Account
            </Link>
          ) : (
            <Link href="/login" className="inline-flex items-center gap-2 font-semibold text-mute hover:text-ink">
              <span className="hidden md:inline">Log in</span>
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-accent text-paper">
                <User className="size-4" aria-hidden />
              </span>
            </Link>
          )}
          <details className="relative lg:hidden">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-mute hover:text-ink [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 z-40 mt-2 w-48 rounded-md border border-rule bg-surface py-2 text-sm">
              <Link className="block px-3 py-2 hover:bg-muted" href="/explore">
                Explore
              </Link>
              <Link className="block px-3 py-2 hover:bg-muted" href="/search">
                Search
              </Link>
              <CompareNavLink className="block px-3 py-2 hover:bg-muted" />
              {user ? (
                <Link className="block px-3 py-2 hover:bg-muted" href="/saved">
                  Saved
                </Link>
              ) : null}
              <Link className="block px-3 py-2 hover:bg-muted" href="/rate">
                Write a review
              </Link>
              {user ? (
                <Link className="block px-3 py-2 hover:bg-muted" href="/account">
                  Account
                </Link>
              ) : (
                <>
                  <Link className="block px-3 py-2 hover:bg-muted" href="/login">
                    Log in
                  </Link>
                  <Link className="block px-3 py-2 hover:bg-muted" href="/signup">
                    Sign up
                  </Link>
                </>
              )}
              {user?.role === "admin" || user?.role === "moderator" ? (
                <Link className="block px-3 py-2 hover:bg-muted" href="/admin">
                  Admin
                </Link>
              ) : null}
              {user?.role === "manager" || user?.role === "admin" ? (
                <Link className="block px-3 py-2 hover:bg-muted" href="/manager">
                  Manager
                </Link>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const facets = await listListingFacets();
  return (
    <footer className="mt-auto border-t border-rule bg-paper">
      <div className="dossier-wrap py-10">
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <LivRankWordmark compact />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-mute">
              Independent, renter-reported building records. Read reviews and reported rent before you sign a lease.
            </p>
          </div>
          {facets.cityPlaces.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-ink">Cities</h2>
              <ul className="mt-3 space-y-2">
                {facets.cityPlaces.map((place) => (
                  <li key={`${place.city}-${place.province}`}>
                    <a
                      className="text-sm text-mute hover:text-ink"
                      href={`/explore?city=${encodeURIComponent(place.city)}&province=${encodeURIComponent(place.province)}`}
                    >
                      {place.city}, {place.province}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <h2 className="text-sm font-semibold text-ink">Integrity</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <a className="text-sm text-mute hover:text-ink" href="/community-guidelines">
                  Guidelines
                </a>
              </li>
              <li>
                <a className="text-sm text-mute hover:text-ink" href="/about">
                  How it works
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">Organization</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <a className="text-sm text-mute hover:text-ink" href="/about">
                  About LivRank
                </a>
              </li>
              <li>
                <a className="text-sm text-mute hover:text-ink" href="/privacy">
                  Privacy
                </a>
              </li>
              <li>
                <a className="text-sm text-mute hover:text-ink" href="/terms">
                  Terms
                </a>
              </li>
              <li>
                <a className="text-sm text-mute hover:text-ink" href="/pricing">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-rule pt-6 text-xs text-mute md:flex-row md:items-center md:justify-between">
          <p>LivRank. Renter-reported building records.</p>
          <div className="flex gap-6">
            <a className="hover:text-ink" href="/terms">
              Terms
            </a>
            <a className="hover:text-ink" href="/privacy">
              Privacy
            </a>
            <a className="hover:text-ink" href="/community-guidelines">
              Guidelines
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
