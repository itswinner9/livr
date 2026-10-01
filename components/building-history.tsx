import type { Property, RentHistoryGroup } from "@/types/property";
import type { Review } from "@/types/review";
import { formatCad, formatDate } from "@/lib/utils";

type Event = { key: string; year: number; sort: string; label: string };

export function BuildingHistory({
  property,
  reviews,
  rent,
}: {
  property: Property;
  reviews: Review[];
  rent: RentHistoryGroup[];
}) {
  const events: Event[] = [];

  if (property.year_built) {
    events.push({
      key: "built",
      year: property.year_built,
      sort: `${property.year_built}-00`,
      label: "Building recorded as built",
    });
  }

  const published = [...reviews].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const first = published[0];
  const last = published[published.length - 1];
  if (first) {
    const year = new Date(first.created_at).getFullYear();
    events.push({
      key: `first-review-${first.id}`,
      year,
      sort: first.created_at,
      label: "First published renter review",
    });
  }
  if (last && last.id !== first?.id) {
    events.push({
      key: `last-review-${last.id}`,
      year: new Date(last.created_at).getFullYear(),
      sort: last.created_at,
      label: `Latest review · ${formatDate(last.created_at)}`,
    });
  }

  for (const review of published) {
    if (review.move_in_year) {
      events.push({
        key: `move-in-${review.id}`,
        year: review.move_in_year,
        sort: `${review.move_in_year}-06`,
        label: review.move_out_year
          ? `Renter reported living here ${review.move_in_year}–${review.move_out_year}`
          : `Renter reported moving in ${review.move_in_year}`,
      });
    }
  }

  for (const group of rent) {
    for (const year of group.years) {
      const amount = year.median ?? year.rents[0];
      events.push({
        key: `rent-${group.bedrooms}-${year.year}`,
        year: year.year,
        sort: `${year.year}-12`,
        label: amount
          ? `Rent reported · ${formatCad(amount)} (${group.bedrooms} bedroom${group.bedrooms === 1 ? "" : "s"})`
          : `Rent reported (${group.bedrooms} bedroom${group.bedrooms === 1 ? "" : "s"})`,
      });
    }
  }

  if (property.last_rent_report_date && !rent.length) {
    const year = new Date(property.last_rent_report_date).getFullYear();
    events.push({
      key: "last-rent",
      year,
      sort: property.last_rent_report_date,
      label: `Latest rent report · ${formatDate(property.last_rent_report_date)}`,
    });
  }

  const unique = new Map<string, Event>();
  for (const event of events) {
    unique.set(`${event.year}-${event.label}`, event);
  }
  const ordered = [...unique.values()].sort((a, b) => a.sort.localeCompare(b.sort) || a.year - b.year);

  if (ordered.length === 0) {
    return <p className="text-sm text-mute">No building history on file yet.</p>;
  }

  return (
    <ol>
      {ordered.map((event) => (
        <li key={event.key} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 border-b border-rule py-1.5 text-sm last:border-0">
          <span className="figure text-mute">{event.year}</span>
          <span className="text-ink">{event.label}</span>
        </li>
      ))}
    </ol>
  );
}
