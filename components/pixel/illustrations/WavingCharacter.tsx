"use client";

import { useEffect, useRef, useState } from "react";

import { FooterCharacter } from "./FooterCharacter";

/**
 * Triggers the footer character's single wave (spec §39).
 *
 * The wave must happen the first time the reader reaches the bottom and then
 * never again, so this is a one-shot observer rather than a scroll listener:
 * it disconnects the moment it fires, and the `fired` guard makes the intent
 * explicit even if a browser delivers a second callback before disconnect
 * takes effect.
 *
 * This is the entire reason the footer character needs client JavaScript at
 * all — the artwork itself is static SVG.
 */
export function WavingCharacter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [waved, setWaved] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Older browsers (and any environment without IO) simply never wave.
    // Failing to a static character is better than animating it forever.
    if (typeof IntersectionObserver === "undefined") return;

    let fired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (fired) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            fired = true;
            setWaved(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="shrink-0">
      <FooterCharacter waved={waved} />
    </div>
  );
}
