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
  const title = projectName ? `${projectName} | Goals` : "Goals";
  return buildPageMetadata({
    title,
    description: "Mục tiêu kinh doanh của dự án.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/business/goals`,
    noindex: true,
  });
}

export default function ProjectGoalsLayout({ children }: { children: ReactNode }) {
  return children;
}
