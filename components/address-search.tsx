"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { Building2, Loader2, MapPin, Search } from "lucide-react";
import type { SuggestResponse } from "@/app/api/address/suggest/route";
import { resolveAddressAction } from "@/lib/actions/address";
import type { AddressDraft } from "@/lib/address/provider";
import { extractUnit, stripUnit } from "@/lib/address/normalize";
import { AddressConfirmCard } from "@/components/address-confirm-card";
import { cn } from "@/lib/utils";

type Option =
  | { kind: "property"; key: string; item: SuggestResponse["properties"][number] }
  | { kind: "suggestion"; key: string; item: SuggestResponse["suggestions"][number] }
  | { kind: "search"; key: string };

const EMPTY: SuggestResponse = { properties: [], suggestions: [] };

function newSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "00000000-0000-4000-8000-000000000000".replace(/0/g, () => Math.floor(Math.random() * 16).toString(16));
}

export function AddressSearch({
  defaultValue = "",
  size = "lg",
  mapToken = null,
  city = "",
  province = "",
  intent,
}: {
  defaultValue?: string;
  size?: "lg" | "md";
  mapToken?: string | null;
  city?: string;
  province?: string;
  intent?: "review" | "rent";
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<string>("");
  const [q, setQ] = useState(defaultValue);
  const [fetched, setFetched] = useState<{ query: string; data: SuggestResponse }>({ query: "", data: EMPTY });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ draft: AddressDraft; pending: boolean; unit: string | null } | null>(null);
  const [resolving, startResolve] = useTransition();
  const pendingSearch = useRef(false);

  const query = q.trim();
  const searchable = query.length >= 2;
  const results = searchable ? fetched.data : EMPTY;
  const loading = searchable && fetched.query !== query;
  const options: Option[] = [
    ...results.properties.map((item) => ({ kind: "property" as const, key: `p-${item.id}`, item })),
    ...results.suggestions.map((item) => ({ kind: "suggestion" as const, key: `s-${item.mapbox_id}`, item })),
    ...(query.length >= 2 ? [{ kind: "search" as const, key: "search" }] : []),
  ];

  useEffect(() => {
    if (query.length < 2) return;
    if (!sessionRef.current) sessionRef.current = newSessionToken();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const mapboxQuery = extractUnit(query) ? stripUnit(query) : query;
        const params = new URLSearchParams({
          q: mapboxQuery || query,
          session: sessionRef.current,
        });
        if (province) params.set("province", province);
        if (city) params.set("city", city);
        const res = await fetch(`/api/address/suggest?${params}`, { signal: controller.signal });
        if (res.status === 429) {
          setError("You're searching quickly. Give it a moment.");
          setFetched({ query, data: EMPTY });
          return;
        }
        const data = (await res.json()) as SuggestResponse;
        setError(null);
        setFetched({ query, data: { properties: data.properties ?? [], suggestions: data.suggestions ?? [] } });
        setActive(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setFetched({ query, data: EMPTY });
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, city, province]);

  const goToSearch = useCallback(() => {
    if (!query) return;
    setOpen(false);
    const params = new URLSearchParams();
    params.set("q", query);
    if (city) params.set("city", city);
    if (province) params.set("province", province);
    router.push(`/search?${params.toString()}`);
  }, [query, city, province, router]);

  useEffect(() => {
    if (!pendingSearch.current || loading) return;
    pendingSearch.current = false;
    const looksLikeStreet = /\d/.test(query);
    const suggestion = fetched.data.suggestions[0];
    if (looksLikeStreet && suggestion) {
      setOpen(false);
      choose({ kind: "suggestion", key: `s-${suggestion.mapbox_id}`, item: suggestion });
      return;
    }
    goToSearch();
    // choose is defined below; this effect only runs after a pending Search submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, fetched, query, goToSearch]);

  function choose(option: Option) {
    setOpen(false);
    if (option.kind === "search") return goToSearch();
    if (option.kind === "property") {
      if (intent === "rent") {
        router.push(`/rent-report/new?propertyId=${option.item.id}`);
        return;
      }
      if (intent === "review") {
        router.push(`/review/new?propertyId=${option.item.id}`);
        return;
      }
      router.push(`/property/${option.item.slug || option.item.id}`);
      return;
    }
    const session = sessionRef.current;
    const unit = extractUnit(q);
    setQ(option.item.full_address.replace(/,?\s*Canada$/, ""));
    startResolve(async () => {
      const res = await resolveAddressAction(option.item.mapbox_id, session);
      sessionRef.current = "";
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      if (res.existing?.status === "active") {
        router.push(`/property/${res.existing.slug || res.existing.id}`);
        return;
      }
      setConfirm({
        draft: res.draft,
        pending: res.existing?.status === "pending",
        unit,
      });
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (options.length ? (i + 1) % options.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (options.length ? (i <= 0 ? options.length - 1 : i - 1) : -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter" && open && active >= 0 && options[active]) {
      e.preventDefault();
      choose(options[active]);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query) return;
    const looksLikeStreet = /\d/.test(query);
    if (looksLikeStreet && loading) {
      pendingSearch.current = true;
      return;
    }
    if (looksLikeStreet && results.suggestions[0]) {
      choose({
        kind: "suggestion",
        key: `s-${results.suggestions[0].mapbox_id}`,
        item: results.suggestions[0],
      });
      return;
    }
    goToSearch();
  }

  const showList = open && query.length >= 2 && (options.length > 0 || loading);
  const lg = size === "lg";
  const optionProps = (option: Option) => {
    const i = options.findIndex((o) => o.key === option.key);
    return {
      id: `${listId}-${option.key}`,
      role: "option" as const,
      "aria-selected": active === i,
      onMouseDown: (ev: React.MouseEvent) => ev.preventDefault(),
      onMouseEnter: () => setActive(i),
      "data-option-key": option.key,
      className: cn(
        "flex w-full cursor-pointer items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-150",
        active === i ? "bg-white/5" : "hover:bg-white/5",
      ),
    };
  };
  const propertyOptions = options.filter((o) => o.kind === "property");
  const suggestionOptions = options.filter((o) => o.kind === "suggestion");
  const searchOption = options.find((o) => o.kind === "search");

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} role="search" className="relative flex w-full flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`${listId}-input`}>
          Search an address anywhere in Canada
        </label>
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <input
            ref={inputRef}
            id={`${listId}-input`}
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${listId}-list`}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 && options[active] ? `${listId}-${options[active].key}` : undefined}
            autoComplete="off"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setConfirm(null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            placeholder="Any Canadian street, building, city, or postal code"
            className={cn(
              "w-full rounded-md border-0 bg-muted pl-10 pr-10 text-ink placeholder:text-mute focus:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              lg ? "h-12 py-3 text-base" : "h-11 py-2.5 text-sm",
            )}
          />
          {loading || resolving ? (
            <Loader2 aria-hidden className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-mute" />
          ) : null}
          {showList ? (
            <div
              id={`${listId}-list`}
              role="listbox"
              aria-label="Address suggestions"
              onClick={(e) => {
                const key = (e.target as HTMLElement).closest<HTMLElement>("[data-option-key]")?.dataset.optionKey;
                const option = options.find((o) => o.key === key);
                if (option) choose(option);
              }}
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto rounded-md border border-rule bg-surface py-1"
            >
              {propertyOptions.length > 0 ? (
                <div role="group" aria-label="On LivRank">
                  <p className="kicker px-4 pb-1 pt-2">On LivRank</p>
                  {propertyOptions.map((o) =>
                    o.kind === "property" ? (
                      <div key={o.key} {...optionProps(o)}>
                        <Building2 aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-ink">
                            {o.item.address_line_1}
                            {o.item.building_name ? ` · ${o.item.building_name}` : ""}
                          </span>
                          <span className="block text-xs text-mute">
                            {o.item.city}, {o.item.province} · {o.item.review_count}{" "}
                            {o.item.review_count === 1 ? "review" : "reviews"}
                          </span>
                        </span>
                        {o.item.rating != null ? (
                          <span className="figure text-sm text-ink">{o.item.rating.toFixed(1)}</span>
                        ) : null}
                      </div>
                    ) : null,
                  )}
                </div>
              ) : null}
              {suggestionOptions.length > 0 ? (
                <div role="group" aria-label="Rate a new address">
                  <p className="kicker px-4 pb-1 pt-2">
                    {intent === "rent" ? "Report rent at a new address" : "Rate a new address"}
                  </p>
                  {suggestionOptions.map((o) =>
                    o.kind === "suggestion" ? (
                      <div key={o.key} {...optionProps(o)}>
                        <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-mute" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-ink">{o.item.name}</span>
                          <span className="block truncate text-xs text-mute">{o.item.place_formatted}</span>
                        </span>
                      </div>
                    ) : null,
                  )}
                </div>
              ) : null}
              {loading && options.length <= 1 ? (
                <p className="px-4 py-2 text-sm text-mute">Searching…</p>
              ) : null}
              {searchOption ? (
                <div {...optionProps(searchOption)}>
                  <Search aria-hidden className="mt-0.5 size-4 shrink-0 text-mute" />
                  <span>
                    See all results for <span className="font-medium">“{query}”</span>
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="submit"
          className={cn(
            "inline-flex min-h-12 items-center justify-center rounded-md bg-accent font-semibold text-paper hover:bg-accent-hover",
            lg ? "px-6" : "px-4",
          )}
        >
          Search
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {confirm ? (
        <div className="mt-4">
          <AddressConfirmCard
            draft={confirm.draft}
            mapToken={mapToken}
            pending={confirm.pending}
            unit={confirm.unit}
            preferredIntent={intent}
            onCancel={() => {
              setConfirm(null);
              inputRef.current?.focus();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
