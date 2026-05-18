"use client";

import { type ReactNode, useLayoutEffect, useMemo } from "react";
import { notFound, useParams, usePathname, useRouter } from "next/navigation";

import { useOrgProjects } from "@/hooks/useProject";
import {
  getRedirectSlugWhenCurrentMissing,
  projectSubPathFromPathname,
} from "@/lib/project/projectListNav";

import { useOrgWorkspace } from "../../orgWorkspaceContext";
import { ProjectWorkspaceLayout } from "./components/projectWorkspaceLayout";

export function ProjectSlugLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const raw = params?.projectSlug;
  const projectSlug = useMemo(() => {
    const s =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw)
          ? (raw[0] ?? "")
          : "";
    try {
      return decodeURIComponent(s).trim();
    } catch {
      return s.trim();
    }
  }, [raw]);

  const { orgId, slug: orgSlug } = useOrgWorkspace();
  const { data: projects, isPending, isError, isFetching, isLoading } =
    useOrgProjects(orgId);

  const projectsList = useMemo(() => projects ?? [], [projects]);
  const projectsReady = !isLoading && !isPending && !isFetching;
  const projectExists = projectsList.some((p) => p.slug === projectSlug);

  useLayoutEffect(() => {
    if (!projectsReady || projectExists || !projectSlug) return;

    const encOrg = encodeURIComponent(orgSlug);
    const redirectSlug = getRedirectSlugWhenCurrentMissing(
      projectsList,
      projectSlug
    );

    if (!redirectSlug) {
      router.replace(`/${encOrg}/projects`);
      return;
    }

    const base = `/${encOrg}/projects/${encodeURIComponent(projectSlug)}`;
    const subPath = projectSubPathFromPathname(pathname, base);
    router.replace(
      `/${encOrg}/projects/${encodeURIComponent(redirectSlug)}/${subPath}`
    );
  }, [
    orgSlug,
    pathname,
    projectExists,
    projectSlug,
    projectsList,
    projectsReady,
    router,
  ]);

  if (!projectSlug) {
    notFound();
  }

  if (isError) {
    notFound();
  }

  if (projectsReady && !projectExists) {
    return (
      <ProjectWorkspaceLayout
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        projects={projectsList}
        isProjectsPending
      >
        {null}
      </ProjectWorkspaceLayout>
    );
  }

  return (
    <ProjectWorkspaceLayout
      orgSlug={orgSlug}
      projectSlug={projectSlug}
      projects={projectsList}
      isProjectsPending={isPending}
    >
      {children}
    </ProjectWorkspaceLayout>
  );
}
