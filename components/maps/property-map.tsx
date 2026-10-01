"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

export type MapPin = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  sublabel?: string;
  href?: string;
  rating?: number | null;
};

const PropertyMapInner = dynamic(() => import("./property-map-inner"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
});

/** Lazy-loaded mapcn map. Renders nothing when no pin has coordinates. */
export function PropertyMap({
  pins,
  token,
  zoom,
  interactive,
  className,
}: {
  pins: Array<Omit<MapPin, "latitude" | "longitude"> & { latitude: number | null; longitude: number | null }>;
  token: string | null;
  zoom?: number;
  interactive?: boolean;
  className?: string;
}) {
  const located = pins
    .map((p) => ({
      ...p,
      latitude: p.latitude == null ? null : Number(p.latitude),
      longitude: p.longitude == null ? null : Number(p.longitude),
    }))
    .filter(
      (p): p is MapPin =>
        typeof p.latitude === "number" &&
        Number.isFinite(p.latitude) &&
        typeof p.longitude === "number" &&
        Number.isFinite(p.longitude),
    );
  if (located.length === 0) return null;
  return (
    <div className={cn("h-64 w-full", className)}>
      <PropertyMapInner pins={located} token={token} zoom={zoom} interactive={interactive} className="h-full w-full" />
    </div>
  );
}
