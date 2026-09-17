import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Page gutter and measure (spec §9).
 *
 * Two widths, both from the spec:
 * - `wide` = 1120px, for the header, footer and full-width sections.
 * - `prose` = 760px, for article bodies. Spec §9 caps blog text at 780px; 760
 *   keeps a comfortable line length for mixed Chinese and Latin text, where a
 *   line of Han characters carries far more information per character than a
 *   line of Latin ones.
 */

export interface ContainerProps {
  children: ReactNode;
  width?: "wide" | "prose";
  as?: ElementType;
  className?: string;
  id?: string;
}

export function Container({
  children,
  width = "wide",
  as: Tag = "div",
  className,
  id,
}: ContainerProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "mx-auto w-full",
        width === "wide" ? "max-w-[1120px]" : "max-w-[760px]",
        // Spec §9: generous gutters, 16–24px on mobile and 32–48px on desktop.
        "px-5 sm:px-6 lg:px-10",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
