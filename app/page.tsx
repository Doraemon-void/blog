import { FeaturedPosts } from "@/components/home/FeaturedPost";
import { Hero } from "@/components/home/Hero";
import { LatestPosts } from "@/components/home/LatestPosts";
import { ProjectPreview } from "@/components/home/ProjectPreview";
import { Topics } from "@/components/home/Topics";
import { Container } from "@/components/layout/Container";
import { QuickSearch } from "@/components/search/QuickSearch";
import {
  getAllProjects,
  getActiveCategories,
  getFeaturedPosts,
  getRecentPosts,
  toPostSummary,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

/**
 * Homepage.
 *
 * Section order follows the spec's sketch (hero, currently, latest posts,
 * featured, topics, projects) with one change the author asked for: the
 * CURRENTLY_ status panel is gone, replaced by a search box. It listed
 * "learning / coding / reading / playing", which repeated what the About page
 * already says and took the most valuable slot on the page to say it. Search is
 * the thing a reader actually needs here.
 *
 * Every section below the search degrades to nothing when there is no content
 * for it, so an empty blog is a short page rather than a page full of empty
 * headings — which is the current state, since the only content is the Beej
 * notes. Adding posts to content/blog populates them automatically.
 */

export const metadata = buildMetadata({ path: "/" });

export default function HomePage() {
  const latest = getRecentPosts(5).map(toPostSummary);
  const featured = getFeaturedPosts().slice(0, 2);
  const topics = getActiveCategories();
  const projects = getAllProjects().slice(0, 3);

  return (
    <>
      <Hero />

      <Container>
        <QuickSearch />
        <LatestPosts posts={latest} />
        <FeaturedPosts posts={featured} />
        <Topics categories={topics} />
        <ProjectPreview projects={projects} />
      </Container>
    </>
  );
}
