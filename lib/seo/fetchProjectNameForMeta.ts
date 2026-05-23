import { cookies } from "next/headers";

import { AUTH_COOKIE } from "@/lib/auth/session";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/?$/, "");

async function serverFetch<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type ProjectMeta = { id: string; name: string };

async function resolveProjectMeta(
  orgSlug: string,
  projectSlug: string,
  token: string
): Promise<ProjectMeta | null> {
  const orgsRes = await serverFetch<{ status: boolean; data: { id: string; slug: string }[] }>(
    "/api/v1/orgs/me",
    token
  );
  const org = orgsRes?.data?.find((o) => o.slug === orgSlug);
  if (!org) return null;

  const projectsRes = await serverFetch<{
    status: boolean;
    data: { id: string; slug: string; name: string }[];
  }>(`/api/v1/orgs/${encodeURIComponent(org.id)}/projects`, token);

  const project = projectsRes?.data?.find((p) => p.slug === projectSlug);
  return project ? { id: project.id, name: project.name } : null;
}

/**
 * Resolves the project display name for use in page metadata.
 * Makes two sequential API calls: orgs/me → org projects.
 * Returns null silently on any failure so metadata can gracefully fallback.
 */
export async function fetchProjectNameForMeta(
  orgSlug: string,
  projectSlug: string
): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return (await resolveProjectMeta(orgSlug, projectSlug, token))?.name ?? null;
}

/**
 * Resolves both project name and actor name for actor detail metadata.
 * Makes three sequential API calls: orgs/me → org projects → project actors.
 * Returns null fields silently on any failure.
 */
export async function fetchActorTitleForMeta(
  orgSlug: string,
  projectSlug: string,
  actorId: string
): Promise<{ projectName: string | null; actorName: string | null }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return { projectName: null, actorName: null };

  const project = await resolveProjectMeta(orgSlug, projectSlug, token);
  if (!project) return { projectName: null, actorName: null };

  const actorsRes = await serverFetch<{
    status: boolean;
    data: { id: string; name: string }[];
  }>(`/api/v1/projects/${encodeURIComponent(project.id)}/actors`, token);

  const actor = actorsRes?.data?.find((a) => a.id === actorId);
  return { projectName: project.name, actorName: actor?.name ?? null };
}
