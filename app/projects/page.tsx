import { ProjectCard } from "@/components/blog/ProjectCard";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import { getAllProjects } from "@/lib/content";
import { PAGE_TOP } from "@/lib/layout";
import { buildMetadata } from "@/lib/seo";

/**
 * Projects index (spec §34).
 *
 * Spec §34 wants cartridge/save-file styled cards and a small grid of them. The
 * card style itself lives in ProjectCard, shared with the homepage preview so
 * the two listings cannot diverge.
 *
 * The spec's description line is used verbatim — it is the site's voice and
 * rewriting it into something more formal would be a downgrade.
 */

export const metadata = buildMetadata({
  title: "项目",
  description: "Things I've built, broken and learned from.",
  path: "/projects",
});

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <Container className={PAGE_TOP}>
      <SectionHeader
        level="h1"
        size="lg"
        id="projects-heading"
        label="项目"
        description="做过的东西，弄坏过的东西，以及从中学到的。"
      />

      <p className="mb-10 font-pixel text-sm tracking-[0.05em] text-text-secondary">
        {projects.length} 个
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            index={index + 1}
          />
        ))}
      </div>
    </Container>
  );
}
