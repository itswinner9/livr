"use client";

import { useEffect, useState } from "react";

export type PropertySection = { id: string; label: string };

export function PropertySectionNav({ sections }: { sections: PropertySection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const ids = sections.map((section) => section.id).join(",");

  useEffect(() => {
    const items = ids.split(",").filter(Boolean);
    if (items.length === 0) return;

    const update = () => {
      const offset = 140;
      let current = items[0];
      for (const id of items) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= offset) current = id;
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("hashchange", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("hashchange", update);
    };
  }, [ids]);

  return (
    <nav aria-label="On this building file" className="sticky top-16 z-40 border-b border-rule bg-paper">
      <div className="dossier-wrap">
        <ul className="flex gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => {
            const isActive = active === section.id;
            return (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  className={
                    isActive
                      ? "inline-flex min-h-11 items-center rounded-md border border-ink bg-surface px-3.5 text-sm font-semibold text-ink"
                      : "inline-flex min-h-11 items-center rounded-md px-3.5 text-sm font-semibold text-mute hover:bg-muted hover:text-ink"
                  }
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
