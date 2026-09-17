import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { WavingCharacter } from "@/components/pixel/illustrations/WavingCharacter";
import { site, socialLinks } from "@/lib/site.config";

/**
 * Footer (spec §39, §85).
 *
 * Spec §39 asks for something simple: a pixel divider on top, the copyright and
 * social links, and one small pixel character on the right that waves a single
 * time on the reader's first arrival at the bottom. Spec §85 fixes the copy.
 *
 * The ♥ in the footer note is rendered as the drawn pixel heart rather than the
 * text glyph, so it shares the same grid, palette and crisp edges as everything
 * else (spec §57 argues against emoji as UI marks). The note is split around the
 * glyph, and falls back to plain text if the config ever stops containing one.
 */

const YEAR = new Date().getFullYear();
const [NOTE_BEFORE, NOTE_AFTER] = site.footerNote.split("♥");

export function Footer() {
  return (
    <footer className="mt-auto border-t-2 border-border">
      <Container>
        <div className="flex flex-col gap-8 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Logo size="sm" />

            <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm text-text-secondary">
              {NOTE_AFTER === undefined ? (
                site.footerNote
              ) : (
                <>
                  <span>{NOTE_BEFORE}</span>
                  <PixelIcon name="heart" size={14} className="text-coral" />
                  <span>{NOTE_AFTER}</span>
                </>
              )}
            </p>

            <p className="mt-2 text-sm text-text-secondary">
              © {YEAR} {site.name}
            </p>

            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noreferrer noopener" }
                      : {})}
                    className="inline-flex items-center gap-1 font-pixel text-sm tracking-[0.05em] text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-accent"
                  >
                    {link.label}
                    {link.external && (
                      <PixelIcon
                        name="arrowRight"
                        size={10}
                        className="-rotate-45"
                      />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <WavingCharacter />
        </div>
      </Container>
    </footer>
  );
}
