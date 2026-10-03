import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  ChecklistForm,
  HomeNoteForm,
  LeaseForm,
  RentLogForm,
  SavedSearchForm,
  SetHomeForm,
} from "@/components/today-forms";
import { HOME_NOTE_TOPICS } from "@/lib/daily/checklist";
import { daysUntil, monthLabel, currentYearMonth } from "@/lib/daily/dates";
import { removeSavedSearchForm } from "@/lib/actions/daily";
import type { TodayData } from "@/lib/daily/types";
import { cityCanonicalPath, propertyCanonicalPath, propertyDisplayName } from "@/lib/seo";
import { formatCad, formatDate } from "@/lib/utils";

function daysCopy(days: number | null, label: string) {
  if (days == null) return null;
  if (days > 1) return `${days} days until ${label}`;
  if (days === 1) return `1 day until ${label}`;
  if (days === 0) return `${label} is today`;
  if (days === -1) return `${label} was yesterday`;
  return `${Math.abs(days)} days past ${label}`;
}

export function TodayDossier({ data }: { data: TodayData }) {
  const { year, month } = currentYearMonth();
  const leaseDays = data.lease ? daysUntil(data.lease.lease_end) : null;
  const noticeDays = data.lease?.notice_date ? daysUntil(data.lease.notice_date) : null;
  const cityHref = data.city && data.province ? cityCanonicalPath({ city: data.city, province: data.province }) : "/explore";

  if (!data.configured) {
    return (
      <div className="bg-paper py-10">
        <div className="dossier-wrap">
          <EmptyState
            title="Connect your account to use Today."
            description="Today keeps your home, rent log, and city pulse in one place once the database is configured."
            action={
              <Link href="/explore" className="font-semibold text-accent hover:text-accent-hover">
                Explore buildings
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted">
      <section className="bg-paper py-8 md:py-10">
        <div className="dossier-wrap">
          <p className="text-sm font-semibold text-mute">Today</p>
          <h1 className="display mt-2 text-3xl text-ink md:text-4xl">{data.heading}</h1>
          <p className="mt-2 max-w-xl text-sm text-mute">
            A short loop for the building you live in and the cities you are watching.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="dossier-wrap grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-7">
            <Card>
              <h2 className="text-xl font-bold text-ink">What changed</h2>
              {data.unread.length === 0 ? (
                <p className="mt-3 text-sm text-mute">
                  No new alerts.{" "}
                  <Link href="/account/inbox" className="font-semibold text-accent hover:text-accent-hover">
                    Open inbox
                  </Link>
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-rule">
                  {data.unread.map((item) => (
                    <li key={item.id} className="py-3">
                      <Link href={item.link || "/account/inbox"} className="block hover:text-accent">
                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                        {item.body ? <p className="mt-1 text-sm text-mute">{item.body}</p> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-ink">My home</h2>
              {data.home ? (
                <p className="mt-2 text-sm text-mute">
                  <Link href={propertyCanonicalPath(data.home)} className="font-semibold text-accent hover:text-accent-hover">
                    {propertyDisplayName(data.home)}
                  </Link>
                  {` · ${data.home.city}, ${data.home.province}`}
                </p>
              ) : (
                <p className="mt-2 text-sm text-mute">
                  Save a building, then mark it as the place you live so Today can show your city pulse.
                </p>
              )}
              <SetHomeForm saved={data.saved} homeId={data.home?.id ?? null} />
              {data.saved.length === 0 ? (
                <p className="mt-3 text-sm text-mute">
                  <Link href="/explore" className="font-semibold text-accent hover:text-accent-hover">
                    Find a building to save
                  </Link>
                </p>
              ) : null}
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-ink">Lease countdown</h2>
              <p className="mt-2 text-sm text-mute">Your dates. LivRank does not give notice-period advice.</p>
              {data.lease ? (
                <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-md bg-muted px-3 py-3">
                    <dt className="text-xs font-medium text-mute">Lease end</dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {daysCopy(leaseDays, "lease end") ?? formatDate(data.lease.lease_end)}
                    </dd>
                  </div>
                  <div className="rounded-md bg-muted px-3 py-3">
                    <dt className="text-xs font-medium text-mute">Notice date</dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {data.lease.notice_date
                        ? (daysCopy(noticeDays, "notice") ?? formatDate(data.lease.notice_date))
                        : "Not set"}
                    </dd>
                  </div>
                </dl>
              ) : null}
              <LeaseForm
                propertyId={data.home?.id ?? null}
                leaseEnd={data.lease?.lease_end?.slice(0, 10) ?? null}
                noticeDate={data.lease?.notice_date?.slice(0, 10) ?? null}
              />
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-ink">Rent log</h2>
              <p className="mt-2 text-sm text-mute">
                {data.rentThisMonth
                  ? `${formatCad(data.rentThisMonth.amount)} logged for ${monthLabel(year, month)}.`
                  : `Nothing logged for ${monthLabel(year, month)} yet.`}
              </p>
              <RentLogForm
                propertyId={data.home?.id ?? null}
                amount={data.rentThisMonth?.amount ?? null}
                paidOn={data.rentThisMonth?.paid_on?.slice(0, 10) ?? null}
              />
            </Card>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-5">
            <Card>
              <h2 className="text-xl font-bold text-ink">Issue diary</h2>
              <p className="mt-2 text-sm text-mute">Private notes. Turn one into a review when you are ready.</p>
              <HomeNoteForm propertyId={data.home?.id ?? null} />
              {data.notes.length > 0 ? (
                <ul className="mt-5 divide-y divide-rule">
                  {data.notes.map((note) => {
                    const topic = HOME_NOTE_TOPICS.find((item) => item.key === note.topic)?.label ?? note.topic;
                    const reviewHref = data.home
                      ? `/review/new?propertyId=${data.home.id}&title=${encodeURIComponent(topic)}&note=${encodeURIComponent(note.body)}`
                      : "/rate";
                    return (
                      <li key={note.id} className="py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-mute">{topic}</p>
                        <p className="mt-1 text-sm text-ink">{note.body}</p>
                        <Link href={reviewHref} className="mt-2 inline-block text-sm font-semibold text-accent hover:text-accent-hover">
                          Use in a review
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-ink">Saved searches</h2>
              <SavedSearchForm
                key={`${data.city ?? ""}-${data.province ?? ""}`}
                city={data.city ?? undefined}
                province={data.province ?? undefined}
              />
              {data.searches.length > 0 ? (
                <ul className="mt-5 space-y-4">
                  {data.searches.map(({ search, buildings }) => (
                    <li key={search.id} className="rounded-md border border-rule p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={cityCanonicalPath(search)}
                            className="text-sm font-semibold text-ink hover:text-accent"
                          >
                            {search.city}, {search.province}
                          </Link>
                          <p className="mt-1 text-xs text-mute">
                            {buildings.length === 0
                              ? "No new buildings since you saved this."
                              : `${buildings.length} ${buildings.length === 1 ? "building" : "buildings"} since you saved this.`}
                          </p>
                        </div>
                        <form action={removeSavedSearchForm}>
                          <input type="hidden" name="searchId" value={search.id} />
                          <button type="submit" className="text-xs font-semibold text-mute hover:text-ink">
                            Remove
                          </button>
                        </form>
                      </div>
                      {buildings.length > 0 ? (
                        <ul className="mt-3 space-y-1">
                          {buildings.map((building) => (
                            <li key={building.id}>
                              <Link
                                href={propertyCanonicalPath(building)}
                                className="text-sm text-accent hover:text-accent-hover"
                              >
                                {building.address_line_1}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-ink">Move checklist</h2>
              {data.checklistProperty ? (
                <>
                  <p className="mt-2 text-sm text-mute">
                    For{" "}
                    <Link
                      href={propertyCanonicalPath(data.checklistProperty)}
                      className="font-semibold text-accent hover:text-accent-hover"
                    >
                      {propertyDisplayName(data.checklistProperty)}
                    </Link>
                  </p>
                  <ChecklistForm
                    propertyId={data.checklistProperty.id}
                    completedSteps={data.completedSteps}
                  />
                </>
              ) : (
                <p className="mt-2 text-sm text-mute">Save a building to keep a short move list.</p>
              )}
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-ink">City pulse</h2>
              {data.city && data.province ? (
                <p className="mt-2 text-sm text-mute">
                  Latest renter reports in{" "}
                  <Link href={cityHref} className="font-semibold text-accent hover:text-accent-hover">
                    {data.city}, {data.province}
                  </Link>
                  .
                </p>
              ) : (
                <p className="mt-2 text-sm text-mute">Mark a home or watch a city to see new reviews here.</p>
              )}
              {data.pulse.length > 0 ? (
                <ul className="mt-4 divide-y divide-rule">
                  {data.pulse.map((item) => (
                    <li key={item.id} className="py-3">
                      <Link href={item.href} className="block hover:text-accent">
                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                        <p className="mt-1 text-xs text-mute">{item.hint}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
