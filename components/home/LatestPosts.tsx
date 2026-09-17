import { PostList } from "@/components/blog/PostList";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import type { PostSummary } from "@/lib/content";
import { SECTION_SPACING } from "@/lib/layout";

/**
 * Latest posts (spec §17).
 *
 * Spec §17 wants roughly five posts, an editorial list rather than a card grid,
 * a `VIEW ALL →` on the right of the heading, and no large images. The list
 * itself is `PostList`, shared with the blog index, so the two surfaces cannot
 * drift apart in spacing, meta layout or hover behaviour.
 */

export interface LatestPostsProps {
  posts: PostSummary[];
}

export function LatestPosts({ posts }: LatestPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="latest-heading" className={SECTION_SPACING}>
      <SectionHeader
        id="latest-heading"
        label="最新随笔"
        href="/blog"
        linkLabel="查看全部"
      />
      <PostList posts={posts} />
    </section>
  );
}
