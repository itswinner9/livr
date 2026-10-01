import type { RentHistoryGroup } from "@/types/property";
import { formatCad } from "@/lib/utils";

export function RentHistory({ groups }: { groups: RentHistoryGroup[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-mute">No rent history reported yet.</p>;
  }
  return (
    <div className="space-y-5">
      <p className="text-xs text-mute">
        Renter-reported rent. May not represent every unit. This is not official market rent.
      </p>
      {groups.map((group) => (
        <div key={group.bedrooms}>
          <h3 className="text-sm font-medium text-ink">
            {group.bedrooms === 0 ? "Studio" : `${group.bedrooms} bedroom${group.bedrooms === 1 ? "" : "s"}`}
          </h3>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-mute">
                <th className="py-1 font-medium">Year</th>
                <th className="py-1 font-medium">Rent</th>
                <th className="py-1 text-right font-medium">Reports</th>
              </tr>
            </thead>
            <tbody>
              {group.years.map((year) => (
                <tr key={year.year} className="border-b border-rule last:border-0">
                  <td className="figure py-1.5 text-mute">{year.year}</td>
                  <td className="figure py-1.5 text-ink">
                    {year.median != null ? formatCad(year.median) : year.rents.map(formatCad).join(", ")}
                    {year.count >= 3 && year.min != null && year.max != null
                      ? ` (${formatCad(year.min)}–${formatCad(year.max)})`
                      : ""}
                  </td>
                  <td className="py-1.5 text-right text-mute">
                    {year.count} {year.count === 1 ? "report" : "reports"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
