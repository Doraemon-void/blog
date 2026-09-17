import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PixelIcon, type IconSize } from "./PixelIcon";
import type { PixelIconName } from "@/lib/pixel-art/icons";

/**
 * Pixel button (spec §74).
 *
 * Visual behaviour lives in the `.px-btn` classes in globals.css so the press
 * physics are defined once and cannot drift between call sites: hover lifts
 * 1px and grows the hard shadow, active presses 2px down and collapses it.
 *
 * Both buttons and anchors are supported. Anchors get a real `<a>` (via
 * next/link for internal routes) rather than a click handler on a `<button>`,
 * so middle-click, "open in new tab" and keyboard activation all behave.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface PixelButtonProps {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: PixelIconName;
  iconSize?: IconSize;
  /** Which side the icon sits on. Trailing arrows read better for "go". */
  iconPosition?: "left" | "right";
  /** Adds rel/target and a screen-reader hint for off-site links. */
  external?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

export function PixelButton({
  children,
  href,
  variant = "secondary",
  size = "md",
  icon,
  iconSize,
  iconPosition = "left",
  external = false,
  className,
  type = "button",
  disabled = false,
  onClick,
  "aria-label": ariaLabel,
}: PixelButtonProps) {
  const classes = cn(
    "px-btn",
    variant === "primary" && "px-btn--primary",
    variant === "ghost" && "px-btn--ghost",
    size === "sm" && "px-btn--sm",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  const glyph = icon ? (
    <PixelIcon
      name={icon}
      size={iconSize ?? (size === "sm" ? 12 : 14)}
      className={iconPosition === "right" ? "order-2" : undefined}
    />
  ) : null;

  const content = (
    <>
      {iconPosition === "left" && glyph}
      <span>{children}</span>
      {iconPosition === "right" && glyph}
    </>
  );

  if (href) {
    const isInternal = href.startsWith("/") || href.startsWith("#");

    if (isInternal && !external) {
      return (
        <Link href={href} className={classes} aria-label={ariaLabel}>
          {content}
        </Link>
      );
    }

    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
