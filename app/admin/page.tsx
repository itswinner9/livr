import { getAdminCounts } from "@/lib/admin/data";
import Link from "next/link";

export default async function AdminHome() {
  const counts = await getAdminCounts();
  const cards = [
    {
      href: "/admin/reviews",
      label: counts.pendingReviews === 1 ? "review waiting" : "reviews waiting",
      value: counts.pendingReviews,
    },
    {
      href: "/admin/rent-reports",
      label: counts.pendingRent === 1 ? "rent report waiting" : "rent reports waiting",
      value: counts.pendingRent,
    },
    {
      href: "/admin/flags",
      label: counts.flags === 1 ? "open flag" : "open flags",
      value: counts.flags,
    },
    {
      href: "/admin/reviews?tab=published",
      label: "published reviews",
      value: counts.publishedReviews,
    },
    { href: "/admin/properties", label: "properties", value: counts.properties },
    { href: "/admin/users", label: "users", value: counts.users },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Admin</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.href + card.label}>
            <Link href={card.href} className="block border-t border-rule pt-3 hover:text-accent">
              <p className="text-2xl font-semibold">{card.value}</p>
              <p className="text-sm text-mute">{card.label}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
