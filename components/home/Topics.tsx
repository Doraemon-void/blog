import Link from "next/link";

import { PixelTag } from "@/components/pixel/PixelTag";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import type { ContentGroup, BlogPost } from "@/lib/content";
import { SECTION_SPACING } from "@/lib/layout";

/**
 * Topic picker (spec §19).
 *
 * Spec §19 wants `[ PROGRAMMING ]` style pixel tags, mint on hover, and
 * explicitly forbids giving each tag its own colour. That last rule is what
 * keeps a row of five topics from looking like a swatch palette; the mint hover
 * in `.px-tag` is the only colour change allowed.
 *
 * Each topic shows its post count, which is the one piece of information a
 * topic list can usefully carry — an empty category is not worth a click.
 */

export interface TopicsProps {
  categories: ContentGroup<BlogPost>[];
}

export function Topics({ categories }: TopicsProps) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="topics-heading" className={SECTION_SPACING}>
      <SectionHeader
        id="topics-heading"
        label="主题"
        description="按主题浏览。分类是固定的几个，标签是自由生长的。"
      />

      <ul className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <li key={category.slug}>
            <PixelTag href={`/categories/${category.slug}`}>
              {category.name.toUpperCase()}
            </PixelTag>
            <span className="ml-1.5 font-pixel text-xs text-text-secondary">
              {category.items.length}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-text-secondary">
        想找更细的？{" "}
        <Link
          href="/tags"
          className="text-accent underline decoration-2 underline-offset-2 hover:bg-mint hover:text-on-mint hover:decoration-transparent"
        >
          浏览全部标签
        </Link>
      </p>
    </section>
  );
}
