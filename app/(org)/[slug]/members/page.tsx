import type { Metadata } from "next";

import { buildPageMetadata, segmentForMetadataPath } from "@/lib/seo/metadata";

import { Members } from "./components/membersFlow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: "Thành viên",
    description: "Quản lý thành viên trong tổ chức.",
    path: `/${segmentForMetadataPath(slug)}/members`,
    noindex: true,
  });
}

export default function OrgMembersPage() {
  return <Members />;
}
