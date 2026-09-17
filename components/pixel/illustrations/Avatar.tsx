import { AVATAR } from "@/lib/pixel-art/figures";

import { PixelSprite } from "../PixelSprite";

/**
 * Pixel avatar for the About page (spec §36).
 *
 * Framed with the standard pixel card treatment — a 2px border and a hard
 * shadow — so it reads as one more object in the same design language rather
 * than as a photo that happens to be blocky.
 */

export interface AvatarProps {
  /** Display size in CSS px. 192 = 8× the 24-cell grid, so cells stay square. */
  size?: number;
  className?: string;
}

export function Avatar({ size = 192, className }: AvatarProps) {
  return (
    <div
      className={className}
      style={{
        border: "2px solid var(--border)",
        borderRadius: "var(--radius-pixel-sm)",
        backgroundColor: "var(--surface-soft)",
        boxShadow: "var(--shadow-pixel-lg)",
        padding: 8,
      }}
    >
      <PixelSprite
        rows={AVATAR}
        scale={size / AVATAR[0].length}
        title="Dora 的像素头像"
      />
    </div>
  );
}
