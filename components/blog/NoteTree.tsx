import Link from "next/link";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { NoteGroup } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Notes index, drawn as a tree.
 *
 * The structure was already right — a series, then its entries in reading order
 * — but box-drawing characters (`├──`) are typed text pretending to be a
 * diagram: they sit on the text baseline, their stroke weight matches nothing
 * else on the page, and they break the pixel grid.
 *
 * So the connectors are drawn instead: a 2px spine, a 2px branch, and a 6px
 * square node at each junction. 2px matches the border weight used everywhere
 * else, and the square node matches the square bullet in article prose, so the
 * result reads as a diagram in the site's own language rather than as ASCII.
 *
 * The spine is assembled per row rather than as one continuous line, because
 * each row is its own flex item: the first row omits the segment above its
 * branch, the last omits the segment below it, and only the middle rows run the
 * full height. Getting that wrong leaves a stub hanging above the first entry or
 * trailing past the last — which is exactly what the old characters did.
 *
 * Everything decorative is `aria-hidden`, so a screen reader gets a clean nested
 * list instead of descriptions of lines.
 */

/** Vertical offset of a row's branch, aligned to its first line's centre. */
const BRANCH_Y = 17;

export interface NoteTreeProps {
  groups: NoteGroup[];
  className?: string;
}

export function NoteTree({ groups, className }: NoteTreeProps) {
  if (groups.length === 0) {
    return <p className="py-10 text-center text-text-secondary">还没有笔记。</p>;
  }

  return (
    <div className={cn("flex flex-col gap-12", className)}>
      {groups.map((group) => (
        <section
          key={group.series ?? "__standalone"}
          aria-labelledby={`notes-${group.series ?? "standalone"}`}
        >
          {group.series && (
            <h2
              id={`notes-${group.series}`}
              className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-pixel text-lg text-text"
            >
              <PixelIcon
                name="folder"
                size={20}
                className="translate-y-0.5 text-accent"
              />
              {group.series}
              <span className="font-pixel text-sm text-text-secondary">
                {group.notes.length} 篇
              </span>
            </h2>
          )}

          <ul className={cn(group.series && "pl-2")}>
            {group.notes.map((note, index) => {
              const isFirst = index === 0;
              const isLast = index === group.notes.length - 1;
              const isOnly = isFirst && isLast;

              return (
                <li key={note.slug} className="group/row flex items-stretch">
                  {/* --- connector gutter: spine, branch, node --- */}
                  <span aria-hidden="true" className="relative w-7 shrink-0">
                    {!isOnly && (
                      <span
                        className={cn(
                          "absolute left-0 w-0.5 bg-border-soft",
                          isFirst && "bottom-0 top-[17px]",
                          isLast && "top-0 h-[17px]",
                          !isFirst && !isLast && "inset-y-0",
                        )}
                      />
                    )}

                    <span
                      className="absolute left-0 h-0.5 w-5 bg-border-soft"
                      style={{ top: BRANCH_Y - 1 }}
                    />

                    <span
                      className="absolute h-1.5 w-1.5 bg-accent"
                      style={{ left: 18, top: BRANCH_Y - 4 }}
                    />
                  </span>

                  {/* --- row --- */}
                  <div className="flex min-w-0 flex-1 items-baseline gap-3 py-1.5">
                    <Link
                      href={note.url}
                      className="text-text transition-colors duration-[var(--dur-fast)] group-hover/row:text-accent"
                    >
                      {note.title}
                    </Link>

                    <span className="ml-auto hidden shrink-0 font-pixel text-xs text-text-secondary sm:inline">
                      {note.readingTime} 分钟
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
