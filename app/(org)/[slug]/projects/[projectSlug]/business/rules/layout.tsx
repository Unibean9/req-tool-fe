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
  const title = projectName ? `${projectName} | Business Rules` : "Business Rules";
  return buildPageMetadata({
    title,
    description: "Quy tắc nghiệp vụ của dự án.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/business/rules`,
    noindex: true,
  });
}

export default function ProjectRulesLayout({ children }: { children: ReactNode }) {
  return children;
}
