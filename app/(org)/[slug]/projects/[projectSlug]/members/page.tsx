import type { Metadata } from "next";

import { buildPageMetadata, segmentForMetadataPath } from "@/lib/seo/metadata";

import { Members } from "../../../members/components/membersFlow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  return buildPageMetadata({
    title: "Thành viên dự án",
    description: "Quản lý thành viên trong dự án.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/members`,
    noindex: true,
  });
}

export default function ProjectMembersPage() {
  return <Members />;
}
