import { PixelTag } from "@/components/pixel/PixelTag";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import { getAllTags } from "@/lib/content";
import { PAGE_TOP } from "@/lib/layout";
import { buildMetadata } from "@/lib/seo";

/**
 * Tag index.
 *
 * Not a route the spec names, but a tag page that is only reachable by already
 * knowing the tag is a dead end — and spec §19 points readers here.
 *
 * Tags are ordered by how much content carries them, so the list reads as a map
 * of what the site is actually about rather than as an alphabetical dump. Counts
 * are shown for the same reason: they are the only signal that tells a reader
 * which tags are worth a click.
 */

export const metadata = buildMetadata({
  title: "标签",
  description: "所有标签。",
  path: "/tags",
});

export default function TagsPage() {
  const groups = getAllTags();

  return (
    <Container className={PAGE_TOP}>
      <SectionHeader
        level="h1"
        size="lg"
        id="tags-heading"
        label="标签"
        description="按数量排序。分类是固定的几个，标签是自由生长的。"
      />

      {groups.length === 0 ? (
        <p className="py-10 text-center text-text-secondary">还没有标签。</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {groups.map((group) => (
            <li key={group.slug} className="flex items-baseline">
              <PixelTag href={`/tags/${group.slug}`}>
                {group.name.toUpperCase()}
              </PixelTag>
              <span className="ml-1.5 font-pixel text-xs text-text-secondary">
                {group.items.length}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
