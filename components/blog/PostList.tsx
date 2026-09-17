import { PostListItem } from "@/components/blog/PostListItem";
import { PixelDivider } from "@/components/pixel/PixelDivider";
import type { PostSummary } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Editorial post list (spec §17, §23, §61).
 *
 * Spec §61 is the reason this is not a card grid: "Latest Posts: 直接列表，
 * Blog: 直接列表" — cards are reserved for Featured posts and Projects.
 * Keeping the two listing surfaces card-free is what stops the pages from
 * looking like every other blog, and it is also why the empty state below is
 * plain text rather than an illustration.
 *
 * Entries are separated by the dashed pixel divider (spec §17) rather than a
 * border, so the rule stays on the 4px pixel grid.
 */

export interface PostListProps {
  posts: PostSummary[];
  /** Shown when the list is empty — a filtered search, usually. */
  emptyMessage?: string;
  className?: string;
}

export function PostList({
  posts,
  emptyMessage = "这里还没有内容。",
  className,
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <p className="py-10 text-center text-text-secondary">{emptyMessage}</p>
    );
  }

  return (
    <ul className={cn("flex flex-col", className)}>
      {posts.map((post, index) => (
        <li key={`${post.categorySlug}/${post.slug}`}>
          {index > 0 && <PixelDivider className="my-8" />}
          <PostListItem post={post} />
        </li>
      ))}
    </ul>
  );
}
