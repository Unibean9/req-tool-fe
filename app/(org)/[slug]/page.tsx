import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata, segmentForMetadataPath } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: "Workspace",
    description: "Organization workspace on Requirements | Bean9.",
    path: `/${segmentForMetadataPath(slug)}`,
    noindex: true,
  });
}

export default async function OrgSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${encodeURIComponent(slug)}/projects`);
}
