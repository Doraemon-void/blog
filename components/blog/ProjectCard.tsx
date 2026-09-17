import Link from "next/link";

import { PixelBadge } from "@/components/pixel/PixelBadge";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { Project, ProjectStatus } from "@/lib/content";
import { cn, formatDate } from "@/lib/utils";

/**
 * Project card (spec §20, §34).
 *
 * Spec §20 asks for something between a cartridge and a save file, and then says
 * to keep it restrained. The restraint is the hard part: the "cartridge" reading
 * comes from a header strip carrying a slot number (`PROJECT_01`), which is
 * enough to evoke the idea without the ridges, labels and bevels that would turn
 * it into a game menu (spec §65).
 *
 * Status is shown as a word rather than a colour bar. A colour-coded status
 * needs a legend to be legible, and a legend on a card is exactly the kind of
 * clutter spec §92 tells you to drop.
 */

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "进行中",
  wip: "开发中",
  paused: "已暂停",
  archived: "已归档",
};

export interface ProjectCardProps {
  project: Project;
  /** Slot number in the listing, e.g. `01` → `PROJECT_01`. */
  index?: number;
  className?: string;
}

export function ProjectCard({ project, index, className }: ProjectCardProps) {
  const source = project.links.find(
    (link) => link.label.toUpperCase() === "SOURCE",
  );

  return (
    <article className={cn("px-card px-card--lift flex flex-col", className)}>
      <p className="flex items-center justify-between border-b-2 border-border bg-surface-soft px-4 py-2 font-pixel text-xs tracking-[0.06em] text-text-secondary">
        <span>
          {typeof index === "number"
            ? `项目 ${String(index).padStart(2, "0")}`
            : "项目"}
        </span>
        <span className="text-accent">{STATUS_LABEL[project.status]}</span>
      </p>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug tracking-[-0.01em]">
          <Link
            href={project.url}
            className="text-text transition-colors duration-[var(--dur-fast)] hover:text-accent"
          >
            {project.title}
          </Link>
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {project.description}
        </p>

        {/* `mt-auto` bottom-anchors the badges and links to the card's base.
            Without it, a card whose description runs one line longer pushes its
            badges down while its neighbours' stay put, and the row reads as
            misaligned. Cards in a grid row are equal height, so the slack has to
            go somewhere — it goes here. */}
        <div className="mt-auto pt-5">
          {project.techStack.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {project.techStack.slice(0, 4).map((tech) => (
                <li key={tech}>
                  <PixelBadge>{tech}</PixelBadge>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-border-soft pt-4">
            <Link
              href={project.url}
              className="group inline-flex items-center gap-1.5 font-pixel text-sm tracking-[0.05em] text-text transition-colors duration-[var(--dur-fast)] hover:text-accent"
            >
              详情
              <PixelIcon
                name="arrowRight"
                size={12}
                className="transition-transform duration-[var(--dur-fast)] group-hover:translate-x-1"
              />
            </Link>

            {source && (
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-pixel text-sm tracking-[0.05em] text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-accent"
              >
                源码
                <PixelIcon name="arrowRight" size={10} className="-rotate-45" />
              </a>
            )}

            <span className="ml-auto font-pixel text-xs text-text-secondary">
              {formatDate(project.date)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
