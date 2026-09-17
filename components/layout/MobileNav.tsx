"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { navItems, site, socialLinks } from "@/lib/site.config";
import { cn } from "@/lib/utils";

/**
 * Mobile navigation (spec §46).
 *
 * Spec §46 asks for a simple pixel panel, not a full-screen animated takeover,
 * and spec §45 says the open animation should not be elaborate. This is a
 * dropdown panel that fades and rises 4px — the smallest motion that still
 * reads as "appeared".
 *
 * Accessibility: `aria-expanded` tracks state, Escape closes, the panel closes
 * on navigation, and focus returns to the trigger so a keyboard user is not
 * stranded. Background scroll is locked while it is open.
 */

export function MobileNav() {
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /**
   * Closing on navigation is derived, not synchronised.
   *
   * The obvious implementation keeps a boolean and clears it in an effect that
   * watches the pathname. That renders twice per navigation and React's own
   * lint rules flag it as a cascading render. Instead the panel records the
   * route it was opened on, and openness is `openedAt === pathname` — so
   * navigating closes the panel as a consequence of that comparison. No effect
   * involved, and it cannot drift out of step with the router.
   */
  const open = openedAt === pathname;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenedAt(null);
        triggerRef.current?.focus();
      }
    }

    // An effect IS the right tool for this half: locking body scroll is
    // synchronising with a system outside React.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpenedAt(open ? null : pathname)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "关闭菜单" : "打开菜单"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-pixel-sm)] border-2 border-transparent",
          "text-text-secondary transition-colors duration-[var(--dur-fast)] hover:border-border hover:text-text",
        )}
      >
        <PixelIcon name={open ? "close" : "menu"} size={16} />
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          className="animate-px-pop px-card absolute inset-x-5 top-full mt-2 overflow-hidden p-0"
        >
          <nav aria-label="移动端导航">
            <ul>
              {navItems.map((item) => {
                const isCurrent = item.match(pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isCurrent ? "page" : undefined}
                      className={cn(
                        "block border-b-2 border-border-soft px-4 py-3 font-pixel text-xs tracking-[0.06em]",
                        "transition-colors duration-[var(--dur-fast)]",
                        isCurrent
                          ? "bg-mint text-on-mint"
                          : "text-text hover:bg-surface-soft",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="px-4 py-3">
            <a
              href={site.author.github}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 font-pixel text-xs tracking-[0.05em] text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-accent"
            >
              GITHUB
              <PixelIcon name="arrowRight" size={10} className="-rotate-45" />
            </a>
          </div>

          <ul className="sr-only">
            {socialLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
