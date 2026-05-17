import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/metadata";

import { defaultActorMetaForId } from "./components/model/requirementsModelDefaults";
import { RequirementsModelPageClient } from "./components/model/requirementsModelPageClient";

function segmentForPath(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment.trim()));
  } catch {
    return encodeURIComponent(segment.trim());
  }
}

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
  const actor = defaultActorMetaForId(actorId);
  const path = `/${segmentForPath(slug)}/projects/${segmentForPath(projectSlug)}/actors/${encodeURIComponent(actorId)}`;

  return buildPageMetadata({
    title: `Mô hình yêu cầu · ${actor.name}`,
    description: `Sơ đồ Actor, Epic, Feature và User Story cho ${actor.name}.`,
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
