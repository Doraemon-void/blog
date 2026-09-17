import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Window chrome for framed content (spec §27, §35).
 *
 * Spec §27 is explicit that this must not imitate macOS: there are no red,
 * yellow and green dots, because this is not a Mac app. The bar carries a label
 * on the left (a filename for code, a caption for a screenshot) and controls on
 * the right.
 *
 * Presentational only — the copy-to-clipboard behaviour lives in
 * `components/blog/CodeBlock.tsx`, which is the one place that needs to be a
 * client component.
 */

export interface PixelWindowProps {
  /** Left side of the title bar. Usually a filename. */
  title?: ReactNode;
  /** Right side of the title bar — buttons or status text. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function PixelWindow({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: PixelWindowProps) {
  return (
    <figure className={cn("px-window my-8", className)}>
      {(title || actions) && (
        <figcaption className="px-window__bar">
          <span className="truncate">{title}</span>
          {actions ? (
            <span className="flex shrink-0 items-center gap-2">{actions}</span>
          ) : null}
        </figcaption>
      )}
      <div className={bodyClassName}>{children}</div>
    </figure>
  );
}
