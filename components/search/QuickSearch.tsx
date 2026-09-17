"use client";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { openSearch } from "@/components/search/open-search";

/**
 * Search box on the homepage, replacing the CURRENTLY_ panel.
 *
 * It is a button that looks like an input, not an input. That is deliberate:
 * typing here would have to either duplicate the ⌘K dialog's query state or
 * filter a homepage that has nothing to filter, and both are worse than opening
 * the one search the site already has. This is the same pattern GitHub and
 * Linear use for their header search.
 *
 * The keyboard hint is shown because the shortcut is the real feature — this box
 * exists mainly to advertise that ⌘K works.
 */

export function QuickSearch() {
  return (
    <section aria-labelledby="quick-search-heading" className="py-10 md:py-14">
      <h2 id="quick-search-heading" className="sr-only">
        搜索
      </h2>

      <button
        type="button"
        onClick={openSearch}
        className="px-card px-card--lift flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <PixelIcon name="search" size={16} className="shrink-0 text-accent" />

        <span className="font-pixel text-sm tracking-[0.05em] text-text-secondary">
          搜索
        </span>

        <span
          aria-hidden="true"
          className="truncate font-pixel text-sm tracking-[0.02em] text-text-secondary/60"
        >
          搜索全部内容…
        </span>

        <kbd className="ml-auto hidden shrink-0 items-center gap-1 rounded-[var(--radius-pixel-sm)] border-2 border-border-soft px-2 py-1 font-pixel text-xs tracking-[0.05em] text-text-secondary sm:inline-flex">
          <span className="text-sm leading-none">⌘</span>K
        </kbd>
      </button>
    </section>
  );
}
