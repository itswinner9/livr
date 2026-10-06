import { AccountDeleteForm } from "@/components/account-delete-form";
import { AccountProfileForm } from "@/components/account-profile-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { oauthFinishRedirect } from "@/lib/auth/oauth";
import { getSessionUser, isStaff } from "@/lib/auth/session";
import { signOutForm } from "@/lib/actions/forms";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSavedProperties } from "@/lib/properties/queries";
import { formatCad, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Bookmark, ChevronRight, PenLine, Receipt, Sun } from "lucide-react";

function planLabel(status: string) {
  if (status === "free") return "Free";
  return status.replace(/_/g, " ");
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string; return?: string; intent?: string }>;
}) {
  const finish = oauthFinishRedirect("/account", await searchParams);
  if (finish) redirect(finish);

  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  const supabase = await createServerSupabase();
  const [{ data: reviews }, { data: rents }, saved] = await Promise.all([
    supabase
      ? supabase
          .from("reviews")
          .select("id, review_title, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; review_title: string; status: string; created_at: string }[] }),
    supabase
      ? supabase
          .from("rent_reports")
          .select("id, monthly_rent, bedrooms, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({
          data: [] as { id: string; monthly_rent: number; bedrooms: number; status: string; created_at: string }[],
        }),
    getSavedProperties(user.id),
  ]);

  const reviewRows = reviews ?? [];
  const rentRows = rents ?? [];
  const heading = user.display_name?.trim() || "Your account";

  return (
    <div className="bg-muted">
      <section className="scroll-mt-32 py-6 md:py-8">
        <div className="dossier-wrap">
          <h1 className="display text-3xl text-ink md:text-4xl">{heading}</h1>
          <p className="mt-2 text-sm text-mute">
            {[user.email, planLabel(user.subscription_status), isStaff(user.role) ? user.role : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {isStaff(user.role) ? (
            <p className="mt-2">
              <Link href="/admin" className="text-sm font-semibold text-accent hover:text-accent-hover">
                Open admin
              </Link>
            </p>
          ) : null}

          <dl className="mt-5 grid grid-cols-2 gap-2 rounded-md border border-rule bg-surface p-2 sm:grid-cols-3">
            <div className="rounded-md bg-muted px-3 py-3">
              <dt className="text-xs font-medium text-mute">Reviews</dt>
              <dd className="mt-1 text-3xl font-extrabold leading-none tracking-tight text-ink tabular-nums">
                {reviewRows.length}
              </dd>
            </div>
            <div className="rounded-md bg-muted px-3 py-3">
              <dt className="text-xs font-medium text-mute">Rent reports</dt>
              <dd className="mt-1 text-3xl font-extrabold leading-none tracking-tight text-ink tabular-nums">
                {rentRows.length}
              </dd>
            </div>
            <div className="col-span-2 rounded-md bg-muted px-3 py-3 sm:col-span-1">
              <dt className="text-xs font-medium text-mute">Saved</dt>
              <dd className="mt-1 text-3xl font-extrabold leading-none tracking-tight text-ink tabular-nums">
                {saved.length}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="bg-paper py-8">
        <div className="dossier-wrap grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-7">
            <Card>
              <h2 className="text-xl font-bold text-ink">Profile</h2>
              <p className="mt-1 text-sm text-mute">Role and plan are not editable here.</p>
              <div className="mt-5">
                <AccountProfileForm displayName={user.display_name ?? ""} />
              </div>
            </Card>

            <Card>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-ink">Recent reviews</h2>
                <Link href="/account/reviews" className="text-sm font-semibold text-accent hover:text-accent-hover">
                  View all
                </Link>
              </div>
              {reviewRows.length === 0 ? (
                <p className="mt-4 text-sm text-mute">
                  No reviews yet.{" "}
                  <Link href="/rate" className="font-semibold text-accent hover:text-accent-hover">
                    Write a review
                  </Link>
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-rule">
                  {reviewRows.slice(0, 3).map((review) => (
                    <li key={review.id} className="flex min-h-11 items-center justify-between gap-3 py-3 text-sm">
                      <span className="min-w-0 truncate font-medium text-ink">{review.review_title}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={review.status} />
                        <span className="text-mute">{formatDate(review.created_at)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-ink">Recent rent reports</h2>
                <Link href="/account/rent-reports" className="text-sm font-semibold text-accent hover:text-accent-hover">
                  View all
                </Link>
              </div>
              {rentRows.length === 0 ? (
                <p className="mt-4 text-sm text-mute">
                  No rent reports yet.{" "}
                  <Link href="/rate?intent=rent" className="font-semibold text-accent hover:text-accent-hover">
                    Report rent
                  </Link>
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-rule">
                  {rentRows.slice(0, 3).map((report) => (
                    <li key={report.id} className="flex min-h-11 items-center justify-between gap-3 py-3 text-sm">
                      <span className="font-medium text-ink">
                        {formatCad(Number(report.monthly_rent))}
                        <span className="ml-2 text-mute">
                          {report.bedrooms === 0 ? "Studio" : `${report.bedrooms} bed`}
                        </span>
                      </span>
                      <StatusBadge status={report.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-5">
            <nav aria-label="Account shortcuts" className="overflow-hidden rounded-md border border-rule bg-surface">
              {[
                {
                  href: "/today",
                  label: "Today",
                  hint: "Home, rent log, city pulse",
                  icon: Sun,
                },
                {
                  href: "/account/inbox",
                  label: "Inbox",
                  hint: "Watch alerts",
                  icon: Bell,
                },
                {
                  href: "/account/reviews",
                  label: "My reviews",
                  hint: reviewRows.length === 1 ? "1 review" : `${reviewRows.length} reviews`,
                  icon: PenLine,
                },
                {
                  href: "/account/rent-reports",
                  label: "My rent reports",
                  hint: rentRows.length === 1 ? "1 report" : `${rentRows.length} reports`,
                  icon: Receipt,
                },
                {
                  href: "/saved",
                  label: "Saved buildings",
                  hint: saved.length === 1 ? "1 saved" : `${saved.length} saved`,
                  icon: Bookmark,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-14 items-center gap-3 border-b border-rule px-4 last:border-0 hover:bg-muted"
                >
                  <item.icon className="size-4 shrink-0 text-mute" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{item.label}</span>
                    <span className="block text-sm text-mute">{item.hint}</span>
                  </span>
                  <ChevronRight className="size-4 text-mute" aria-hidden />
                </Link>
              ))}
            </nav>

            <Card>
              <h2 className="text-xl font-bold text-ink">Session</h2>
              <p className="mt-1 text-sm text-mute">Log out on this device.</p>
              <form action={signOutForm} className="mt-5">
                <Button type="submit" variant="outline">
                  Log out
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-ink">Privacy</h2>
              <p className="mt-2 text-sm text-mute">
                Email preferences are stored when the database is configured. Deleting your account clears your public
                display name. Published reviews may remain as Former renter content for the building file.
              </p>
              <div className="mt-5">
                <AccountDeleteForm />
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
