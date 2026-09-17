import { ProjectCard } from "@/components/blog/ProjectCard";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import type { Project } from "@/lib/content";
import { SECTION_SPACING } from "@/lib/layout";

/**
 * Projects preview on the homepage (spec §20).
 *
 * Spec §20 asks for about three projects at the bottom of the page. Spec §61
 * allows cards here — projects are the one list where a card earns its weight,
 * because each entry carries a status, a tech stack and two links.
 */

export interface ProjectPreviewProps {
  projects: Project[];
}

export function ProjectPreview({ projects }: ProjectPreviewProps) {
  if (projects.length === 0) return null;

  return (
    <section aria-labelledby="projects-heading" className={SECTION_SPACING}>
      <SectionHeader
        id="projects-heading"
        label="项目"
        href="/projects"
        linkLabel="查看全部"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index + 1} />
        ))}
      </div>
    </section>
  );
}
