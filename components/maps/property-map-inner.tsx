"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup } from "@/components/ui/map";
import { mapStyles } from "@/lib/map/mapbox-style";
import { cn } from "@/lib/utils";
import type { MapPin } from "./property-map";

function bounds(pins: MapPin[]): [[number, number], [number, number]] {
  const lngs = pins.map((p) => p.longitude);
  const lats = pins.map((p) => p.latitude);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export default function PropertyMapInner({
  pins,
  token,
  zoom = 15,
  interactive = true,
  className,
}: {
  pins: MapPin[];
  token: string | null;
  zoom?: number;
  interactive?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const multiple = pins.length > 1;
  const first = pins[0];

  return (
    <div className={cn("relative overflow-hidden border border-rule bg-muted", className)}>
      <Map
        theme="dark"
        styles={mapStyles(token)}
        center={[first.longitude, first.latitude]}
        zoom={zoom}
        bounds={multiple ? bounds(pins) : undefined}
        fitBoundsOptions={{ padding: 48, maxZoom: 15 }}
        interactive={interactive}
        cooperativeGestures={interactive}
      >
        {interactive ? <MapControls position="bottom-right" showZoom /> : null}
        {pins.map((pin) => (
          <MapMarker
            key={pin.id}
            longitude={pin.longitude}
            latitude={pin.latitude}
            onClick={multiple || !pin.href ? undefined : () => router.push(pin.href!)}
          >
            <MarkerContent>
              <span
                aria-label={pin.label}
                className="figure flex min-w-7 items-center justify-center rounded-sm border border-surface bg-accent px-1.5 py-0.5 text-xs text-primary-foreground"
              >
                {pin.rating != null ? pin.rating.toFixed(1) : "•"}
              </span>
            </MarkerContent>
            {multiple ? (
              <MarkerPopup closeButton className="w-56 p-3">
                <p className="text-sm font-medium text-ink">{pin.label}</p>
                {pin.sublabel ? <p className="mt-0.5 text-xs text-mute">{pin.sublabel}</p> : null}
                {pin.href ? (
                  <Link className="mt-2 inline-block text-xs font-medium text-accent hover:text-accent-hover" href={pin.href}>
                    View property
                  </Link>
                ) : null}
              </MarkerPopup>
            ) : null}
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}
