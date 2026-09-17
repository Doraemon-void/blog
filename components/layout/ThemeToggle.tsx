"use client";

import { useCallback, useSyncExternalStore } from "react";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils";

/**
 * Dark-mode toggle (spec §5, §10).
 *
 * The theme lives on `<html>`'s class list, applied before paint by
 * `ThemeScript` — it is external mutable state, not React state. So it is read
 * with `useSyncExternalStore` rather than mirrored into `useState` from an
 * effect:
 *
 * - An effect that calls `setState` on mount renders twice on every page load
 *   and is flagged by React's own lint rules as a cascading render.
 * - Subscribing to the class list with a `MutationObserver` means the button
 *   stays correct even if something else changes the theme (another tab, an OS
 *   preference change handled elsewhere), which a one-shot read cannot do.
 *
 * `getServerSnapshot` returns `false` because the server has no idea what the
 * theme will be. That is safe here because both icons are always rendered and
 * swapped by CSS — the visible glyph never depends on this value, so there is
 * no flash and no hydration mismatch. Only the label settles after hydration.
 */

const LIGHT_LABEL = "切换到深色模式";
const DARK_LABEL = "切换到浅色模式";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");

    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";

    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode: the toggle still works for this page view.
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-pixel-sm)] border-2 border-transparent text-text-secondary",
        "transition-colors duration-[var(--dur-fast)] hover:border-border hover:text-text",
        className,
      )}
      aria-label={isDark ? DARK_LABEL : LIGHT_LABEL}
      title={isDark ? "浅色模式" : "深色模式"}
    >
      {/* CSS picks the glyph, so the correct icon shows even before the
          subscription resolves — this is what removes the flash. */}
      <PixelIcon name="sun" size={16} className="block dark:hidden" />
      <PixelIcon name="moon" size={16} className="hidden dark:block" />
    </button>
  );
}
