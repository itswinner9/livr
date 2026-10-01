import Link from "next/link";
import { CompareHydrate } from "@/components/compare-hydrate";
import { CompareToggle } from "@/components/compare-toggle";
import { DossierCard, scoreTone, type ListingCardModel } from "@/components/listing-ui";
import { Stars } from "@/components/stars";
import { itemFromProperty } from "@/lib/compare/ids";
import { latestReportedRent } from "@/lib/rent-reports/latest";
import { formatCad, cn } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, type IssueMention, type Property, type RatingSummary, type RentHistoryGroup } from "@/types/property";

const SIGNAL_ROWS: { key: keyof Omit<RatingSummary, "reviewCount" | "overall">; label: string }[] = [
  { key: "maintenance", label: "Maintenance" },
  { key: "management", label: "Management" },
  { key: "noise", label: "Noise" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "building_condition", label: "Building condition" },
  { key: "parking", label: "Parking" },
  { key: "value", label: "Value" },
];

export type CompareColumn = {
  property: Property;
  ratingSummary: RatingSummary;
  rentSummary: RentHistoryGroup[];
  issues: IssueMention[];
};

function SignalCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-mute">—</span>;
  const width = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div>
      <p className="tabular-nums font-semibold text-ink">{value.toFixed(1)}</p>
      <span className="mt-1.5 block h-2 overflow-hidden rounded-sm bg-star-dim" aria-hidden>
        <span className={cn("block h-2 rounded-sm", scoreTone(value))} style={{ width: `${width}%` }} />
      </span>
    </div>
  );
}

function TopicsCell({ issues }: { issues: IssueMention[] }) {
  if (issues.length === 0) return <span className="text-mute">—</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {issues.slice(0, 4).map((issue) => (
        <li key={issue.topic} className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize text-ink">
          {issue.topic.replace(/_/g, " ")}
        </li>
      ))}
    </ul>
  );
}

export function CompareDossier({
  columns,
  suggestions,
}: {
  columns: CompareColumn[];
  suggestions: ListingCardModel[];
}) {
  const hydrateItems = columns.map((column) => itemFromProperty(column.property));
  const slots: (CompareColumn | null)[] = [columns[0] ?? null, columns[1] ?? null, columns[2] ?? null];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <CompareHydrate items={hydrateItems} />
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">Compare buildings</h1>
      <p className="mt-4 max-w-2xl text-sm text-mute">
        Side-by-side facts only. LivRank does not pick a winner or assign a universal score.
      </p>

      {columns.length === 0 ? (
        <div className="mt-8">
          <p className="text-base font-medium text-ink">Pick up to three buildings.</p>
          <p className="mt-2 max-w-xl text-sm text-mute">
            Add a file from Explore, or start with one of the recently reviewed buildings below.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-paper hover:bg-accent-hover"
            >
              Explore buildings
            </Link>
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink hover:bg-muted"
            >
              Search by address
            </Link>
          </div>
          {suggestions.length > 0 ? (
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-ink">Recently reviewed</h2>
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {suggestions.slice(0, 6).map((row) => (
                  <DossierCard key={row.property.id} row={row} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule">
                <th className="w-36 py-3 pr-4 text-left font-medium text-mute"> </th>
                {slots.map((column, index) => (
                  <th key={column?.property.id ?? `empty-${index}`} className="min-w-[12rem] px-3 py-3 text-left align-top font-semibold text-ink">
                    {column ? (
                      <div className="space-y-2">
                        <Link href={`/property/${column.property.slug || column.property.id}`} className="hover:text-accent">
                          {column.property.address_line_1}
                        </Link>
                        <p className="text-xs font-medium text-mute">
                          {column.property.city}, {column.property.province}
                        </p>
                        <CompareToggle item={itemFromProperty(column.property)} selectedLabel="Remove" />
                      </div>
                    ) : (
                      <Link href="/explore" className="font-semibold text-accent hover:text-accent-hover">
                        Add a building
                      </Link>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-rule">
                <th className="py-4 pr-4 text-left font-medium text-mute">Overall</th>
                {slots.map((column, index) => {
                  const overall = column?.ratingSummary.overall ?? null;
                  return (
                    <td key={column?.property.id ?? `overall-${index}`} className="px-3 py-4 align-top">
                      {column ? (
                        overall != null ? (
                          <div>
                            <p className="text-2xl font-bold tabular-nums text-ink">
                              {overall.toFixed(1)}
                              <span className="text-sm font-medium text-mute"> / 5</span>
                            </p>
                            <p className="mt-1">
                              <Stars value={overall} showValue={false} />
                            </p>
                          </div>
                        ) : (
                          <span className="text-mute">—</span>
                        )
                      ) : (
                        <span className="text-mute">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-rule">
                <th className="py-4 pr-4 text-left font-medium text-mute">Reviews</th>
                {slots.map((column, index) => (
                  <td key={column?.property.id ?? `reviews-${index}`} className="px-3 py-4 tabular-nums text-ink">
                    {column ? column.ratingSummary.reviewCount : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-rule">
                <th className="py-4 pr-4 text-left font-medium text-mute">Reported rent</th>
                {slots.map((column, index) => {
                  const rent = column ? latestReportedRent(column.rentSummary) : null;
                  return (
                    <td key={column?.property.id ?? `rent-${index}`} className="px-3 py-4 text-ink">
                      {rent ? (
                        <>
                          <span className="tabular-nums font-semibold">{formatCad(rent.amount)}</span>
                          <span className="block text-xs text-mute">
                            {rent.bedrooms} bedroom · {rent.year}
                          </span>
                        </>
                      ) : (
                        <span className="text-mute">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-rule">
                <th className="py-4 pr-4 text-left font-medium text-mute">Type</th>
                {slots.map((column, index) => (
                  <td key={column?.property.id ?? `type-${index}`} className="px-3 py-4 text-ink">
                    {column?.property.property_type
                      ? PROPERTY_TYPE_LABELS[column.property.property_type]
                      : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-rule">
                <th className="py-4 pr-4 text-left font-medium text-mute">Year built</th>
                {slots.map((column, index) => (
                  <td key={column?.property.id ?? `year-${index}`} className="px-3 py-4 tabular-nums text-ink">
                    {column?.property.year_built ?? "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-rule">
                <th className="py-4 pr-4 text-left font-medium text-mute">Units</th>
                {slots.map((column, index) => (
                  <td key={column?.property.id ?? `units-${index}`} className="px-3 py-4 tabular-nums text-ink">
                    {column?.property.units_count ?? "—"}
                  </td>
                ))}
              </tr>
              {SIGNAL_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-rule">
                  <th className="py-4 pr-4 text-left font-medium text-mute">{row.label}</th>
                  {slots.map((column, index) => (
                    <td key={column?.property.id ?? `${row.key}-${index}`} className="px-3 py-4">
                      <SignalCell value={column ? column.ratingSummary[row.key] : null} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th className="py-4 pr-4 text-left font-medium text-mute">Topics</th>
                {slots.map((column, index) => (
                  <td key={column?.property.id ?? `topics-${index}`} className="px-3 py-4">
                    {column ? <TopicsCell issues={column.issues} /> : <span className="text-mute">—</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
