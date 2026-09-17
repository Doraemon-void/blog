"use client";

import { useEffect, useState } from "react";

import type { TocEntry } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Article table of contents (spec §30).
 *
 * Spec §30 wants h2/h3 only, a sticky right-hand column about 200px wide on
 * desktop, the active section in mint, and — on mobile — no sticky version at
 * all, replaced by a collapsible list at the top of the article. Both are here;
 * which one a reader sees is a CSS media query, not a JS branch, so neither
 * layout can render on the wrong breakpoint.
 *
 * The mobile version is a native `<details>`. It needs no JavaScript, works
 * before hydration, and is announced correctly by screen readers — a
 * hand-rolled disclosure would be more code and less accessible.
 *
 * Active-section tracking keeps a Set of visible heading ids and picks the
 * first in document order. Tracking a single "current" element instead is the
 * common implementation and it flickers: at a scroll position where two
 * headings are both intersecting, whichever callback fires last wins.
 */

export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (entries.length === 0) return;
    if (typeof IntersectionObserver === "undefined") return;

    const ids = entries.map((entry) => entry.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) visible.add(record.target.id);
          else visible.delete(record.target.id);
        }
        const firstVisible = ids.find((id) => visible.has(id));
        if (firstVisible) setActiveId(firstVisible);
      },
      // A heading counts as active once it clears the sticky header and before
      // it reaches the lower third of the viewport.
      { rootMargin: "-88px 0px -66% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-labelledby="toc-heading" className="text-sm">
      <h2
        id="toc-heading"
        className="mb-4 font-pixel text-sm tracking-[0.06em] text-text-secondary"
      >
        本页目录
        <span aria-hidden="true" className="text-accent">
          _
        </span>
      </h2>

      <ul className="flex flex-col gap-2 border-l-2 border-border-soft">
        {entries.map((entry) => {
          const isActive = entry.id === activeId;
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "-ml-0.5 block border-l-2 py-0.5 leading-snug transition-colors duration-[var(--dur-fast)]",
                  entry.depth === 3 ? "pl-6" : "pl-4",
                  isActive
                    ? "border-mint text-accent"
                    : "border-transparent text-text-secondary hover:text-text",
                )}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile-only collapsible TOC (spec §30). */
export function MobileTableOfContents({ entries }: { entries: TocEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <details className="px-card mb-10 p-0 lg:hidden">
      <summary className="cursor-pointer list-none px-4 py-3 font-pixel text-sm tracking-[0.06em] text-text-secondary">
        本页目录
        <span aria-hidden="true" className="text-accent">
          _
        </span>
        <span className="float-right text-text-secondary" aria-hidden="true">
          ▾
        </span>
      </summary>
      <ul className="flex flex-col gap-1 border-t-2 border-border-soft px-4 py-3">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={cn(
                "block py-1 leading-snug text-text-secondary",
                entry.depth === 3 && "pl-5",
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
