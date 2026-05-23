import type { Metadata } from "next";

import { buildPageMetadata, segmentForMetadataPath } from "@/lib/seo/metadata";
import { fetchActorTitleForMeta } from "@/lib/seo/fetchProjectNameForMeta";

import { RequirementsModelPageClient } from "./components/model/requirementsModelPageClient";

function normalizeActorIdParam(raw: string): string {
  const trimmed = raw.trim();
  try {
    return decodeURIComponent(trimmed).trim();
  } catch {
    return trimmed;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string; actorId: string }>;
}): Promise<Metadata> {
  const { slug, projectSlug, actorId: rawActorId } = await params;
  const actorId = normalizeActorIdParam(rawActorId);
  const { projectName, actorName } = await fetchActorTitleForMeta(
    decodeURIComponent(slug),
    decodeURIComponent(projectSlug),
    actorId
  );
  const title = projectName && actorName
    ? `${projectName} | ${actorName}`
    : actorName ?? projectName ?? "Actor";
  const path = `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/actors/${encodeURIComponent(actorId)}`;

  return buildPageMetadata({
    title,
    description: actorName ? `Sơ đồ Actor, Epic, Feature và User Story cho ${actorName}.` : "Sơ đồ yêu cầu cho actor.",
    path,
    noindex: true,
  });
}

export default async function ProjectActorDetailPage({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string; actorId: string }>;
}) {
  const { actorId } = await params;
  const id = normalizeActorIdParam(actorId);

  return <RequirementsModelPageClient actorId={id} />;
}
