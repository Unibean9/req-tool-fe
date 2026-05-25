import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPageMetadata } from "@/lib/seo/metadata";

import { OrgSlugLayoutClient } from "./orgSlugLayoutClient";

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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: "Workspace",
    description: "Organization workspace on Requirements | Bean9.",
    path: `/${segmentForPath(slug)}`,
    noindex: true,
  });
}

export default function OrgSlugLayout({ children }: { children: ReactNode }) {
  return <OrgSlugLayoutClient>{children}</OrgSlugLayoutClient>;
}
