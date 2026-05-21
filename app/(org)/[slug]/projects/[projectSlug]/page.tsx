import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata, segmentForMetadataPath } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  return buildPageMetadata({
    title: "Workspace dự án",
    description: "Không gian làm việc dự án trên Requirements | Bean9.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}`,
    noindex: true,
  });
}

export default async function OrgProjectSlugIndexPage({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}) {
  const { slug, projectSlug } = await params;
  redirect(
    `/${encodeURIComponent(slug)}/projects/${encodeURIComponent(projectSlug)}/dashboard`
  );
}
