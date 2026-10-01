"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { PROVINCE_CODES, PROVINCE_NAMES } from "@/lib/address/normalize";

export function ListingProvinceSelect({
  action,
  province,
  q,
  city,
}: {
  action: string;
  province: string;
  q?: string;
  city?: string;
}) {
  const router = useRouter();
  return (
    <label className="relative shrink-0 md:w-52">
      <span className="sr-only">Province or territory</span>
      <select
        className="h-12 w-full appearance-none rounded-md bg-muted px-3.5 pr-9 text-sm font-semibold text-ink"
        value={province}
        onChange={(event) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (city) params.set("city", city);
          if (event.target.value) params.set("province", event.target.value);
          const query = params.toString();
          router.push(query ? `${action}?${query}` : action);
        }}
      >
        <option value="">All Canada</option>
        {PROVINCE_CODES.map((code) => (
          <option key={code} value={code}>
            {PROVINCE_NAMES[code]}
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
