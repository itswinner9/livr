"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { resolveAddressAction } from "@/lib/actions/address";
import type { AddressDraft } from "@/lib/address/provider";
import { extractUnit, stripUnit } from "@/lib/address/normalize";
import { AddressConfirmCard } from "@/components/address-confirm-card";
import type { SuggestResponse } from "@/app/api/address/suggest/route";

function newSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "00000000-0000-4000-8000-000000000000".replace(/0/g, () => Math.floor(Math.random() * 16).toString(16));
}

export function UnknownAddressContribute({
  query,
  mapToken,
  province = "",
  city = "",
}: {
  query: string;
  mapToken: string | null;
  province?: string;
  city?: string;
}) {
  const sessionRef = useRef("");
  const [status, setStatus] = useState<"loading" | "confirm" | "existing" | "none">("loading");
  const [confirm, setConfirm] = useState<{
    draft: AddressDraft;
    pending: boolean;
    unit: string | null;
  } | null>(null);
  const [existingHref, setExistingHref] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setStatus("none");
      return;
    }
    let cancelled = false;
    sessionRef.current = newSessionToken();
    const session = sessionRef.current;
    const unit = extractUnit(q);
    const mapboxQuery = unit ? stripUnit(q) : q;

    (async () => {
      try {
        const params = new URLSearchParams({ q: mapboxQuery || q, session });
        if (province) params.set("province", province);
        if (city) params.set("city", city);
        const res = await fetch(`/api/address/suggest?${params}`);
        if (!res.ok) {
          if (!cancelled) setStatus("none");
          return;
        }
        const data = (await res.json()) as SuggestResponse;
        const suggestion = data.suggestions?.[0];
        if (!suggestion) {
          if (!cancelled) setStatus("none");
          return;
        }
        const resolved = await resolveAddressAction(suggestion.mapbox_id, session);
        if (cancelled) return;
        if (!resolved.ok) {
          setStatus("none");
          return;
        }
        if (resolved.existing?.status === "active") {
          setExistingHref(`/property/${resolved.existing.slug || resolved.existing.id}`);
          setStatus("existing");
          return;
        }
        setConfirm({
          draft: resolved.draft,
          pending: resolved.existing?.status === "pending",
          unit,
        });
        setStatus("confirm");
      } catch {
        if (!cancelled) setStatus("none");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, province, city]);

  if (status === "loading") {
    return <p className="rounded-md bg-surface p-6 text-sm text-mute border border-rule">Looking up that address…</p>;
  }

  if (status === "existing" && existingHref) {
    return (
      <p className="rounded-md bg-surface p-6 text-sm text-mute border border-rule">
        That building is already on file.{" "}
        <Link className="font-semibold text-accent hover:text-accent-hover" href={existingHref}>
          Open the property page
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-surface p-6 border border-rule">
        <p className="font-semibold text-ink">No one has filed this building yet. Be the first.</p>
        <p className="mt-2 text-sm text-mute">
          Search, rate, or report rent for any address in Canada. If this is the place, confirm it below — or add it
          manually if Mapbox missed it.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link className="font-semibold text-accent hover:text-accent-hover" href="/rate">
            Rate this place
          </Link>
          <Link className="font-semibold text-accent hover:text-accent-hover" href="/rate?intent=rent">
            Report rent
          </Link>
          <Link className="font-semibold text-ink hover:text-accent" href="/property/new">
            Add the address manually
          </Link>
        </div>
      </div>
      {status === "confirm" && confirm ? (
        <AddressConfirmCard
          draft={confirm.draft}
          mapToken={mapToken}
          pending={confirm.pending}
          unit={confirm.unit}
        />
      ) : null}
    </div>
  );
}
