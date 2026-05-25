import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPageMetadata, segmentForMetadataPath } from "@/lib/seo/metadata";
import { fetchProjectNameForMeta } from "@/lib/seo/fetchProjectNameForMeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const decodedProjectSlug = decodeURIComponent(projectSlug);
  const projectName = await fetchProjectNameForMeta(decodedSlug, decodedProjectSlug);
  const title = projectName ? `${projectName} | Dashboard` : "Dashboard";
  return buildPageMetadata({
    title,
    description: "Project overview.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/dashboard`,
    noindex: true,
  });
}

export default function ProjectDashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
