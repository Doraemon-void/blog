"use client";

import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import { HeaderGithubLink, NavLinks } from "@/components/layout/NavLinks";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SearchDialog } from "@/components/search/SearchDialog";
import { cn } from "@/lib/utils";

/**
 * Sticky header (spec §10).
 *
 * Spec §10: sticky, 64–72px tall, logo left and navigation right, and the
 * background may become slightly more opaque once scrolled — but no large blur.
 * So the surface goes from 95% to fully opaque, and a bottom rule appears. No
 * `backdrop-filter` anywhere: spec §65 rules out glassmorphism, and a frosted
 * bar would fight the pixel language.
 *
 * The scroll listener is passive and throttled through `requestAnimationFrame`,
 * so it costs at most one state update per frame and cannot cause a scroll
 * handler pile-up (spec §56).
 */

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        frame = 0;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b-2 transition-colors duration-[var(--dur-normal)]",
        scrolled
          ? "border-border-soft bg-bg"
          : "border-transparent bg-bg/95",
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">
          <Logo />

          <div className="flex items-center gap-1 sm:gap-2">
            <NavLinks className="hidden lg:block" />

            <span
              aria-hidden="true"
              className="mx-1 hidden h-5 w-px bg-border-soft lg:block"
            />

            <SearchDialog />
            <HeaderGithubLink className="hidden lg:inline-flex" />
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
