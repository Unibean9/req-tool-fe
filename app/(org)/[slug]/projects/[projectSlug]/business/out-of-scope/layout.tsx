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
  const title = projectName ? `${projectName} | Out of Scope` : "Out of Scope";
  return buildPageMetadata({
    title,
    description: "Các hạng mục ngoài phạm vi của dự án.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/business/out-of-scope`,
    noindex: true,
  });
}

export default function ProjectOutOfScopeLayout({ children }: { children: ReactNode }) {
  return children;
}
