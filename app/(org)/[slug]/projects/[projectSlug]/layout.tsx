import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPageMetadata } from "@/lib/seo/metadata";

import { ProjectSlugLayoutClient } from "./projectSlugLayoutClient";

function segmentForPath(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment.trim()));
  } catch {
    return encodeURIComponent(segment.trim());
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  return buildPageMetadata({
    title: "Project workspace",
    description: "Project workspace on Requirements | Bean9.",
    path: `/${segmentForPath(slug)}/projects/${segmentForPath(projectSlug)}`,
    noindex: true,
  });
}

export default function OrgProjectSlugLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProjectSlugLayoutClient>{children}</ProjectSlugLayoutClient>;
}
