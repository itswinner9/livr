"use client";

import { useState } from "react";

export function ListingPhoto({
  src,
  label,
  className,
}: {
  src: string | null;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);
  if (failed || !src) {
    return (
      <div
        className={`flex items-end bg-[linear-gradient(160deg,#f5f5f5_0%,#e8e8e8_55%,#fff1eb_100%)] ${className ?? ""}`}
      >
        <span className="p-4 text-sm font-medium text-ink">{label}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} onError={() => setFailed(true)} />
  );
}
