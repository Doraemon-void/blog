"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { navItems, site } from "@/lib/site.config";
import { cn } from "@/lib/utils";

/**
 * Desktop navigation (spec §10).
 *
 * Spec §10 offers two ways to mark the current page — mint text, or a 3px pixel
 * underline. Both are used together: colour alone fails for readers with a
 * colour-vision deficiency, and the underline alone is easy to miss at 11px.
 *
 * The 3px thickness is deliberate; a 1px underline would be a normal link
 * affordance, while 3px reads as a pixel rule.
 */

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="主导航" className={className}>
      <ul className="flex items-center gap-1">
        {navItems.map((item) => {
          const isCurrent = item.match(pathname);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "relative block px-2.5 py-2 font-pixel text-sm tracking-[0.06em]",
                  "transition-colors duration-[var(--dur-fast)]",
                  isCurrent
                    ? "text-accent"
                    : "text-text-secondary hover:text-text",
                )}
              >
                {item.label}
                {isCurrent && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-1.5 -bottom-0.5 h-[3px] bg-mint"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * GitHub shortcut in the header (spec §10's `GH`).
 *
 * Rendered as pixel text rather than an icon: the spec asks for "GH", and a
 * legible octocat at 16px on a pixel grid is not something that can be drawn
 * well — text is both clearer and more on-brand here.
 */
export function HeaderGithubLink({ className }: { className?: string }) {
  return (
    <a
      href={site.author.github}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex h-8 items-center rounded-[var(--radius-pixel-sm)] border-2 border-transparent px-1.5",
        "font-pixel text-xs tracking-[0.05em] text-text-secondary",
        "transition-colors duration-[var(--dur-fast)] hover:border-border hover:text-text",
        className,
      )}
      aria-label="在 GitHub 上查看（新窗口打开）"
    >
      GH
      <PixelIcon name="arrowRight" size={10} className="ml-1 -rotate-45" />
    </a>
  );
}
