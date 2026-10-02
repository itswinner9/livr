import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My reviews" };

export default async function AccountReviewsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/reviews");
  const supabase = await createServerSupabase();
  const { data } = supabase
    ? await supabase
        .from("reviews")
        .select("id, review_title, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };
  const rows = data ?? [];

  return (
    <div className="bg-paper py-8">
      <div className="dossier-wrap">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-3xl text-ink">My reviews</h1>
            <p className="mt-2 text-sm text-mute">Everything you have submitted, including pending moderation.</p>
          </div>
          <Link
            href="/rate"
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-paper hover:bg-accent-hover"
          >
            Write a review
          </Link>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title="No reviews yet."
            description="Rate a building you have lived in. Pending reviews stay on this list until they are published."
            action={
              <Link href="/rate" className="font-semibold text-accent hover:text-accent-hover">
                Write a review
              </Link>
            }
          />
        ) : (
          <ul className="mt-6 overflow-hidden rounded-md border border-rule bg-surface">
            {rows.map((review) => (
              <li key={review.id} className="flex min-h-14 items-center justify-between gap-3 border-b border-rule px-4 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{review.review_title}</p>
                  <p className="text-sm text-mute">{formatDate(review.created_at)}</p>
                </div>
                <StatusBadge status={review.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
