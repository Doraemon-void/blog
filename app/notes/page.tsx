import { NoteTree } from "@/components/blog/NoteTree";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import { getAllNotes, getNoteGroups } from "@/lib/content";
import { PAGE_TOP } from "@/lib/layout";
import { buildMetadata } from "@/lib/seo";

/**
 * Notes index (spec §32).
 *
 * Spec §32 draws the line between the two content types explicitly: Blog is
 * finished articles, Notes is a digital garden of short pieces. The layout
 * follows from that — notes are browsed as a file tree by year and month, not as
 * a reverse-chronological feed, because the point of a garden is seeing what
 * grew when.
 */

export const metadata = buildMetadata({
  title: "笔记",
  description: "系统性的学习笔记，成系列地整理。",
  path: "/notes",
});

export default function NotesPage() {
  const groups = getNoteGroups();
  const total = getAllNotes().length;

  return (
    <Container className={PAGE_TOP}>
      <SectionHeader
        level="h1"
        size="lg"
        id="notes-heading"
        label="笔记"
        description="系统性的学习笔记，成系列地整理。每篇都从一个小问题开始。"
      />

      <div className="mb-10 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="font-pixel text-sm tracking-[0.05em] text-text-secondary">
          {total} 篇
        </p>
        <span aria-hidden="true" className="h-3 w-px bg-border-soft" />
        <p className="text-sm text-text-secondary">
          成体系的学习记录。按系列编排，可以顺着读下去。
        </p>
      </div>

      <NoteTree groups={groups} />
    </Container>
  );
}
