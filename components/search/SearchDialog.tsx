"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type Fuse from "fuse.js";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { OPEN_SEARCH_EVENT } from "@/components/search/open-search";
import { cn } from "@/lib/utils";

/**
 * Site-wide search (spec §40).
 *
 * Design decisions worth recording:
 *
 * - **The index is a static file fetched on first open.** It is generated at
 *   build time by `app/search-index.json/route.ts` from the same `lib/content`
 *   pipeline every page uses, so there is no second parser to drift. Fetching it
 *   lazily keeps roughly 40KB of content text out of the initial JS bundle, and
 *   — unlike a search API route — it keeps working when the site is deployed
 *   statically.
 * - **Fuse.js is imported dynamically.** It only loads when the dialog first
 *   opens, so a reader who never searches downloads none of it (spec §56).
 * - **Rendered through a portal.** The trigger sits inside a sticky header; a
 *   fixed-position overlay inside a sticky ancestor is fragile, and portalling
 *   to `document.body` removes the question entirely.
 */

interface SearchDoc {
  kind: "blog" | "note" | "project";
  slug: string;
  url: string;
  title: string;
  description: string;
  category?: string;
  tags: string[];
  date: string;
  text: string;
}

interface SearchHit extends SearchDoc {
  key: string;
}

const KIND_LABEL: Record<SearchDoc["kind"], string> = {
  blog: "随笔",
  note: "笔记",
  project: "项目",
};

const MAX_RESULTS = 8;

export function SearchDialog({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  /**
   * The Fuse instance lives in state, not a ref.
   *
   * A ref would have to be read during render to compute the results, and refs
   * are not render-safe: React may render without committing, so a ref read can
   * observe a value that never corresponded to a committed render. State keeps
   * the engine and the results derived from it in step.
   */
  const [fuse, setFuse] = useState<Fuse<SearchDoc> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  /* ---- open / close ---- */

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    // Return focus to the trigger so keyboard users are not dropped at the top
    // of the document (spec §47).
    triggerRef.current?.focus();
  }, []);

  // Global shortcut: ⌘K on macOS, Ctrl+K elsewhere.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => {
          if (value) {
            triggerRef.current?.focus();
            return false;
          }
          return true;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Opened from elsewhere on the page — currently the homepage search box.
  // See components/search/open-search.ts for why this is an event.
  useEffect(() => {
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
  }, []);

  // Load the index the first time the dialog opens.
  useEffect(() => {
    if (!open || docs || loadError) return;

    let cancelled = false;

    (async () => {
      try {
        const [response, fuseModule] = await Promise.all([
          // Default cache mode on purpose — do NOT use `force-cache` here.
          //
          // `force-cache` means "use any cached copy without revalidating",
          // which overrides the route's `Cache-Control: must-revalidate` and
          // pins every returning reader to whatever index their browser first
          // downloaded. The symptom is nasty and quiet: after you publish a new
          // note, readers who have visited before cannot find it, and it looks
          // like the search is broken rather than stale.
          //
          // The default mode revalidates and gets a 304 when nothing changed,
          // which costs one conditional request the first time the dialog opens
          // and nothing after that. There is no repeat fetch to avoid anyway —
          // this effect runs once per page load.
          fetch("/search-index.json"),
          import("fuse.js"),
        ]);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = (await response.json()) as { documents: SearchDoc[] };
        if (cancelled) return;

        const Fuse = fuseModule.default;
        setFuse(
          new Fuse(payload.documents, {
            keys: [
              { name: "title", weight: 3 },
              { name: "tags", weight: 2 },
              { name: "description", weight: 1.5 },
              { name: "category", weight: 1 },
              { name: "text", weight: 1 },
            ],
            threshold: 0.34,
            ignoreLocation: true,
            minMatchCharLength: 2,
            includeScore: false,
          }),
        );
        setDocs(payload.documents);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, docs, loadError]);

  // Focus the field and lock background scrolling while open.
  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /* ---- searching ---- */

  const results = useMemo<SearchHit[]>(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      // No query: show recent content so the dialog is never an empty box.
      return (docs ?? []).slice(0, MAX_RESULTS).map(toHit);
    }

    if (!fuse) return [];
    return fuse
      .search(trimmed)
      .slice(0, MAX_RESULTS)
      .map((result) => toHit(result.item));
  }, [query, docs, fuse]);

  // Keep the highlighted row in view as the user arrows through results.
  useEffect(() => {
    const list = listRef.current;
    const active = list?.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onDialogKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) =>
          results.length === 0 ? 0 : (index + 1) % results.length,
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) =>
          results.length === 0
            ? 0
            : (index - 1 + results.length) % results.length,
        );
        return;
      }
      if (event.key === "Enter") {
        const hit = results[activeIndex];
        if (hit) {
          event.preventDefault();
          window.location.href = hit.url;
        }
        return;
      }
      // Minimal focus trap: the dialog only holds the field and the results, so
      // wrapping Tab at the ends is enough.
      if (event.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          "input, a[href]",
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [activeIndex, close, results],
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-[var(--radius-pixel-sm)] border-2 border-transparent px-1.5 text-text-secondary",
          "transition-colors duration-[var(--dur-fast)] hover:border-border hover:text-text",
          className,
        )}
        aria-label="搜索文章（快捷键 Command 或 Control 加 K）"
      >
        <PixelIcon name="search" size={16} />
        <span className="hidden font-pixel text-xs tracking-[0.05em] lg:inline">
          SEARCH
        </span>
      </button>

      {open
        ? createPortal(
            <div
              className="animate-px-fade fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgb(38_50_56/0.35)] p-4 pt-[12vh]"
              onMouseDown={(event) => {
                // Close only on a click that starts on the backdrop itself, so a
                // drag that ends outside the panel does not dismiss it.
                if (event.target === event.currentTarget) close();
              }}
            >
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="search-dialog-title"
                onKeyDown={onDialogKeyDown}
                className="animate-px-pop px-card w-full max-w-[560px] overflow-hidden"
              >
                <h2
                  id="search-dialog-title"
                  className="flex items-center justify-between border-b-2 border-border bg-surface-soft px-3 py-2 font-pixel text-sm tracking-[0.06em] text-text-secondary"
                >
                  <span>
                    搜索
                    <span aria-hidden="true" className="text-accent">
                      _
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={close}
                    className="text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-text"
                    aria-label="关闭搜索"
                  >
                    <PixelIcon name="close" size={12} />
                  </button>
                </h2>

                <div className="flex items-center gap-2 border-b-2 border-border-soft px-3 py-2.5">
                  <span
                    aria-hidden="true"
                    className="font-pixel text-sm text-accent"
                  >
                    &gt;
                  </span>
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      // Reset the highlight in the event handler rather than in
                      // an effect watching `query`: an effect would render twice
                      // per keystroke, and this is exactly what handlers are for.
                      setActiveIndex(0);
                    }}
                    placeholder="输入关键词…"
                    aria-label="搜索关键词"
                    aria-controls="search-results"
                    autoComplete="off"
                    className="w-full bg-transparent font-pixel text-sm tracking-[0.03em] text-text outline-none placeholder:text-text-secondary/70"
                  />
                </div>

                <div className="max-h-[52vh] overflow-y-auto">
                  {loadError ? (
                    <p className="px-4 py-6 text-center text-sm text-text-secondary">
                      搜索索引加载失败，请刷新页面重试。
                    </p>
                  ) : results.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-text-secondary">
                      {docs === null
                        ? "正在加载索引…"
                        : `没有找到与「${query.trim()}」相关的内容。`}
                    </p>
                  ) : (
                    <ul id="search-results" ref={listRef} role="listbox">
                      {results.map((hit, index) => (
                        <li key={hit.key} role="option" aria-selected={index === activeIndex}>
                          <a
                            href={hit.url}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={cn(
                              "block border-b-2 border-border-soft px-4 py-3 last:border-b-0",
                              "transition-colors duration-[var(--dur-fast)]",
                              index === activeIndex
                                ? "bg-mint/25"
                                : "hover:bg-surface-soft",
                            )}
                          >
                            <span className="font-pixel text-xs tracking-[0.06em] text-text-secondary">
                              {KIND_LABEL[hit.kind]}
                              {hit.category ? ` · ${hit.category}` : ""}
                            </span>
                            <span className="mt-1 block font-medium text-text">
                              {hit.title}
                            </span>
                            {hit.description ? (
                              <span className="mt-0.5 line-clamp-1 block text-sm text-text-secondary">
                                {hit.description}
                              </span>
                            ) : null}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="flex items-center gap-3 border-t-2 border-border-soft bg-surface-soft px-4 py-2 font-pixel text-xs tracking-[0.05em] text-text-secondary">
                  <span>↑↓ 选择</span>
                  <span>ENTER 打开</span>
                  <span>ESC 关闭</span>
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function toHit(doc: SearchDoc): SearchHit {
  return { ...doc, key: `${doc.kind}:${doc.slug}` };
}
