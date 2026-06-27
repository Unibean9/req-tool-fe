import type { ReactNode } from "react";

import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in",
  description: "Sign in to Requirements | Bean9 with GitHub",
  path: "/login",
  noindex: true,
});

export default function LoginSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
