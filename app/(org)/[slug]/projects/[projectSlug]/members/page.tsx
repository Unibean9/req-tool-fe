import type { Metadata } from "next";

import { buildPageMetadata, segmentForMetadataPath } from "@/lib/seo/metadata";
import { fetchProjectNameForMeta } from "@/lib/seo/fetchProjectNameForMeta";

import { Members } from "../../../members/components/membersFlow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  const projectName = await fetchProjectNameForMeta(
    decodeURIComponent(slug),
    decodeURIComponent(projectSlug)
  );
  const title = projectName ? `${projectName} | Members` : "Members";
  return buildPageMetadata({
    title,
    description: "Manage project members.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/members`,
    noindex: true,
  });
}

export default function ProjectMembersPage() {
  return <Members />;
}
