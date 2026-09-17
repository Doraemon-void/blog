import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostList } from "@/components/blog/PostList";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import { getAllTags, getTagBySlug, toPostSummary } from "@/lib/content";
import { PAGE_TOP } from "@/lib/layout";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/site.config";

/**
 * Tag page (spec §53).
 *
 * Spec §53's layout is `TAG_ / #CPU / 12 POSTS` followed by the matching
 * articles. Tags span blog posts and notes, because both are things you read and
 * search by topic; projects are excluded since their taxonomy is `techStack`,
 * which renders as badges rather than tag links (spec §37).
 */

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export function generateStaticParams() {
  return getAllTags().map((group) => ({ tag: group.slug }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const group = getTagBySlug(tag);

  if (!group) return buildMetadata({ title: "找不到标签", noIndex: true });

  return buildMetadata({
    title: `#${group.name}`,
    description: `所有标记为 ${group.name} 的文章与笔记。`,
    path: `/tags/${group.slug}`,
    tags: [group.name],
  });
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const group = getTagBySlug(tag);

  if (!group) notFound();

  // The group mixes posts and notes; `toPostSummary` handles both.
  const items = group.items.map(toPostSummary);

  return (
    <Container className={PAGE_TOP}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: site.title, path: "/" },
          { name: "Tags", path: "/tags" },
          { name: `#${group.name}`, path: `/tags/${group.slug}` },
        ])}
      />

      <SectionHeader
        level="h1"
        size="lg"
        id="tag-heading"
        label="TAG"
        description={`#${group.name} — ${group.items.length} ${group.items.length === 1 ? "entry" : "entries"}`}
      />

      <PostList
        posts={items}
        emptyMessage={`还没有标记为 ${group.name} 的内容。`}
      />
    </Container>
  );
}
