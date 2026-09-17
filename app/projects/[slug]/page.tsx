import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MDXContent } from "@/components/blog/MDXContent";
import { Container } from "@/components/layout/Container";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { JsonLd } from "@/components/seo/JsonLd";
import type { ProjectStatus } from "@/lib/content";
import { getAllProjects, getProjectBySlug } from "@/lib/content";
import { breadcrumbJsonLd, buildMetadata, projectJsonLd } from "@/lib/seo";
import { site } from "@/lib/site.config";
import { formatDate } from "@/lib/utils";

/**
 * Project detail (spec §35).
 *
 * Spec §35 lists the sections a project page should carry — name, status,
 * description, tech stack, then problem / design / implementation / results /
 * lessons, then links. Rather than modelling each as a frontmatter field, the
 * narrative sections are written as `##` headings in the MDX body: that keeps
 * the structure authorable and lets a project that genuinely has no "results"
 * section simply omit it, instead of rendering an empty heading.
 *
 * The status and tech stack are frontmatter, because those are data rather than
 * prose and are also used by the listing card.
 */

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "进行中",
  wip: "开发中",
  paused: "已暂停",
  archived: "已归档",
};

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) return buildMetadata({ title: "找不到页面", noIndex: true });

  return buildMetadata({
    title: project.title,
    description: project.description,
    path: project.url,
    tags: project.techStack,
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();
  if (project.draft && process.env.NODE_ENV === "production") notFound();

  return (
    <Container width="prose" className="pt-12 md:pt-16">
      <JsonLd data={projectJsonLd(project)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: site.title, path: "/" },
          { name: "Projects", path: "/projects" },
          { name: project.title, path: project.url },
        ])}
      />

      <article>
        <header className="mb-10 border-b-2 border-border-soft pb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 font-pixel text-sm tracking-[0.05em] text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-accent"
          >
            <PixelIcon name="arrowLeft" size={12} />
            PROJECTS
          </Link>

          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-pixel text-sm tracking-[0.05em] text-text-secondary">
            <span className="text-accent">
              {STATUS_LABEL[project.status]}
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-border-soft" />
            <time dateTime={project.date}>{formatDate(project.date)}</time>
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.02em] md:text-4xl">
            {project.title}
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary">
            {project.description}
          </p>

          {project.techStack.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <li key={tech}>
                  <PixelBadge tone="mint">{tech}</PixelBadge>
                </li>
              ))}
            </ul>
          )}

          {project.links.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-4">
              {project.links.map((link) => {
                const isExternal = /^https?:\/\//.test(link.href);
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      {...(isExternal
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                      className="inline-flex items-center gap-1.5 font-pixel text-sm tracking-[0.05em] text-text transition-colors duration-[var(--dur-fast)] hover:text-accent"
                    >
                      {link.label}
                      {isExternal && (
                        <PixelIcon
                          name="arrowRight"
                          size={10}
                          className="-rotate-45"
                        />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </header>

        <MDXContent source={project.body} />
      </article>
    </Container>
  );
}
