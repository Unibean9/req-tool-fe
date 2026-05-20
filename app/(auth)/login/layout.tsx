import type { ReactNode } from "react";

import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Đăng nhập",
  description: "Đăng nhập Requirements | Bean9 bằng GitHub",
  path: "/login",
  noindex: true,
});

export default function LoginSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
