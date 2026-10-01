"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function ListingCitySelect({
  action,
  cities,
  city,
  q,
}: {
  action: string;
  cities: string[];
  city: string;
  q?: string;
}) {
  const router = useRouter();
  return (
    <label className="relative shrink-0 md:w-44">
      <span className="sr-only">City</span>
      <select
        className="h-12 w-full appearance-none rounded-md bg-muted px-3.5 pr-9 text-sm font-semibold text-ink"
        value={city}
        onChange={(event) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (event.target.value) params.set("city", event.target.value);
          const query = params.toString();
          router.push(query ? `${action}?${query}` : action);
        }}
      >
        <option value="">All cities</option>
        {cities.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-mute"
      />
    </label>
  );
}
