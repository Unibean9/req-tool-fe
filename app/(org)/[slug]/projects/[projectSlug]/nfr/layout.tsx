import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPageMetadata } from "@/lib/seo/metadata";

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
    title: "NFR",
    description: "Yêu cầu phi chức năng của dự án.",
    path: `/${segmentForPath(slug)}/projects/${segmentForPath(projectSlug)}/nfr`,
    noindex: true,
  });
}

export default function ProjectNfrLayout({ children }: { children: ReactNode }) {
  return children;
}
