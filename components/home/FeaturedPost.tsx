import Link from "next/link";

import { FeaturedArt } from "@/components/home/FeaturedArt";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixelTag } from "@/components/pixel/PixelTag";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import type { BlogPost } from "@/lib/content";
import { SECTION_SPACING } from "@/lib/layout";
import { formatDate, slugify } from "@/lib/utils";

/**
 * Featured post (spec §18).
 *
 * Spec §18's layout: artwork on the left, and on the right `FEATURED`, the
 * category, the title, the description, `date · read time`, and a `阅读全文 →`.
 * One or two per homepage — the caller decides how many to pass.
 *
 * On mobile the art moves below the text rather than above it. A reader arriving
 * on a phone should meet the title first (spec §59); a cover image is the wrong
 * thing to spend the first screen on.
 */

export interface FeaturedPostProps {
  post: BlogPost;
  className?: string;
}

export function FeaturedPost({ post, className }: FeaturedPostProps) {
  return (
    <article className={className}>
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:gap-12">
        {/* Source order puts the text first on mobile; `md:order-*` restores the
            spec's art-on-the-left arrangement on desktop. */}
        <FeaturedArt
          categorySlug={post.categorySlug}
          className="order-2 md:order-1"
        />

        <div className="order-1 md:order-2">
          <p className="flex items-center gap-3 font-pixel text-sm tracking-[0.06em] text-text-secondary">
            <span className="text-accent">精选</span>
            <span aria-hidden="true" className="h-3 w-px bg-border-soft" />
            <Link
              href={`/categories/${post.categorySlug}`}
              className="transition-colors duration-[var(--dur-fast)] hover:text-accent"
            >
              {post.category.toUpperCase()}
            </Link>
          </p>

          <h3 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.02em] md:text-3xl">
            <Link
              href={post.url}
              className="text-text transition-colors duration-[var(--dur-fast)] hover:text-accent"
            >
              {post.title}
            </Link>
          </h3>

          <p className="mt-4 max-w-[56ch] text-text-secondary">
            {post.description}
          </p>

          <p className="mt-5 font-pixel text-sm tracking-[0.05em] text-text-secondary">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            {post.readingTime} 分钟
          </p>

          <Link
            href={post.url}
            className="group mt-6 inline-flex items-center gap-2 font-pixel text-xs tracking-[0.05em] text-text transition-colors duration-[var(--dur-fast)] hover:text-accent"
          >
            阅读全文
            <PixelIcon
              name="arrowRight"
              size={12}
              className="transition-transform duration-[var(--dur-fast)] group-hover:translate-x-1"
            />
          </Link>

          <ul className="mt-6 flex flex-wrap gap-2">
            {post.tags.slice(0, 4).map((tag) => (
              <li key={tag}>
                <PixelTag href={`/tags/${slugify(tag)}`} size="sm">
                  {tag}
                </PixelTag>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export interface FeaturedPostsProps {
  posts: BlogPost[];
}

/** Wraps one or two featured posts under a single section heading. */
export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className={SECTION_SPACING}>
      <SectionHeader id="featured-heading" label="精选" />
      <div className="flex flex-col gap-16">
        {posts.map((post) => (
          <FeaturedPost key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
