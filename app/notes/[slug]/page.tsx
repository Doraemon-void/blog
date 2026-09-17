import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleHeader } from "@/components/blog/ArticleHeader";
import { ArticleNavigation } from "@/components/blog/ArticleNavigation";
import { MDXContent } from "@/components/blog/MDXContent";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllNotes, getAdjacent, getNoteBySlug } from "@/lib/content";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site.config";

/**
 * Note detail (spec §33).
 *
 * Spec §33 wants this deliberately simpler than a blog post: title, date, tags,
 * body — no hero, no cover image, and no table of contents, since a note is
 * short enough that a TOC would be longer than the content it indexes.
 *
 * It shares `ArticleHeader` and `ArticleNavigation` with posts so the two read
 * as the same site, and the narrower measure comes from `Container` rather than
 * a bespoke width.
 */

interface NotePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllNotes().map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: NotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) return buildMetadata({ title: "找不到页面", noIndex: true });

  return buildMetadata({
    title: note.title,
    description: note.description,
    path: note.url,
    type: "article",
    publishedTime: note.date,
    modifiedTime: note.updated ?? undefined,
    tags: note.tags,
  });
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) notFound();
  if (note.draft && process.env.NODE_ENV === "production") notFound();

  const { previous, next } = getAdjacent("note", note.slug);

  return (
    <Container width="prose" className="pt-12 md:pt-16">
      <JsonLd data={articleJsonLd(note)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: site.title, path: "/" },
          { name: "Notes", path: "/notes" },
          { name: note.title, path: note.url },
        ])}
      />

      <article>
        <ArticleHeader
          title={note.title}
          description={note.description}
          // Notes deliberately omit the date — see ArticleHeader.
          updated={note.updated}
          tags={note.tags}
          readingTime={note.readingTime}
        />

        <MDXContent source={note.body} />

        <ArticleNavigation previous={previous} next={next} />
      </article>
    </Container>
  );
}
