import type { Metadata } from "next";
import { Link2 } from "lucide-react";

import { buildPageMetadata, segmentForMetadataPath } from "@/lib/seo/metadata";

import { ProjectWorkbenchPlaceholder } from "../components/projectWorkbenchPlaceholder";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  return buildPageMetadata({
    title: "GitHub",
    description: "Liên kết repository GitHub với dự án.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/github`,
    noindex: true,
  });
}

export default function ProjectGithubLinkPage() {
  return (
    <ProjectWorkbenchPlaceholder
      title="Liên kết với Github"
      description="Kết nối repository GitHub với dự án để đồng bộ requirements và trace tới code."
      icon={Link2}
    />
  );
}
