import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { getSessionUser } from "@/lib/auth/session";
import { markNotificationsReadForm } from "@/lib/actions/daily";
import { getNotifications } from "@/lib/daily/queries";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function InboxPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/inbox");
  const items = await getNotifications(user.id);
  const unread = items.filter((item) => !item.read_at).length;

  return (
    <div className="bg-paper py-8">
      <div className="dossier-wrap">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-3xl text-ink">Inbox</h1>
            <p className="mt-2 text-sm text-mute">
              {unread === 0 ? "You're caught up." : `${unread} unread ${unread === 1 ? "alert" : "alerts"}.`}
            </p>
          </div>
          {unread > 0 ? (
            <form action={markNotificationsReadForm}>
              <button type="submit" className="text-sm font-semibold text-accent hover:text-accent-hover">
                Mark all as read
              </button>
            </form>
          ) : null}
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No alerts yet."
            description="Save a building to get a note when a new review or rent report is published there."
            action={
              <Link href="/saved" className="font-semibold text-accent hover:text-accent-hover">
                Open saved buildings
              </Link>
            }
          />
        ) : (
          <ul className="mt-6 divide-y divide-rule border-y border-rule">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className={`text-sm ${item.read_at ? "text-mute" : "font-semibold text-ink"}`}>{item.title}</p>
                  {item.body ? <p className="mt-1 text-sm text-mute">{item.body}</p> : null}
                  <p className="mt-2 text-xs text-mute">{formatDate(item.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {item.link ? (
                    <Link href={item.link} className="text-sm font-semibold text-accent hover:text-accent-hover">
                      Open
                    </Link>
                  ) : null}
                  {!item.read_at ? (
                    <form action={markNotificationsReadForm}>
                      <input type="hidden" name="notificationId" value={item.id} />
                      <button type="submit" className="text-sm font-semibold text-mute hover:text-ink">
                        Mark read
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
