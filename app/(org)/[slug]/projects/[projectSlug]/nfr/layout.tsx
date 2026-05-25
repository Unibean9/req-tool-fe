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
  const title = projectName ? `${projectName} | Non-Functional Requirements` : "Non-Functional Requirements";
  return buildPageMetadata({
    title,
    description: "Non-functional requirements for the project.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/nfr`,
    noindex: true,
  });
}

export default function ProjectNfrLayout({ children }: { children: ReactNode }) {
  return children;
}
