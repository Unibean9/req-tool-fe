"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { useOrgProjects } from "@/hooks/useProject";
import { useDocumentTypes } from "@/hooks/useDocument";
import { useDocumentContainerLock } from "@/hooks/useDocumentContainerLock";
import { isDocumentType } from "@/lib/api/services/fetchDocument";
import { getPriorRegistryContainer } from "@/lib/document/documentSectionLock";

import { useOrgWorkspace } from "../../../../../orgWorkspaceContext";
import { DocumentContainerLockedPage } from "../components/documentContainerLockedPage";
import { DocumentOverviewPage } from "../components/documentOverviewPage";

export default function Page() {
  const params = useParams();
  const { orgId } = useOrgWorkspace();

  const projectSlug = useMemo(() => {
    const raw = params?.projectSlug;
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
  }, [params?.projectSlug]);

  const orgSlug = useMemo(() => {
    const raw = params?.slug;
    const s =
      typeof raw === "string" ? raw : Array.isArray(raw) ? (raw[0] ?? "") : "";
    try {
      return decodeURIComponent(s).trim();
    } catch {
      return s.trim();
    }
  }, [params?.slug]);

  const documentTypeRaw = useMemo(() => {
    const raw = params?.documentType;
    return typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? (raw[0] ?? "")
        : "";
  }, [params?.documentType]);

  const documentType = isDocumentType(documentTypeRaw) ? documentTypeRaw : null;

  const { data: registry } = useDocumentTypes({
    enabled: Boolean(documentType),
  });

  const containers = registry?.containers ?? [];
  const priorContainer =
    documentType && containers.length > 0
      ? getPriorRegistryContainer(containers, documentType)
      : null;

  const { data: projects, isPending: isProjectsPending } = useOrgProjects(orgId);
  const projectId = useMemo(
    () => projects?.find((p) => p.slug === projectSlug)?.id ?? null,
    [projects, projectSlug]
  );

  const containerLock = useDocumentContainerLock(
    projectId,
    documentType,
    priorContainer,
  );

  const base = `/${encodeURIComponent(orgSlug)}/projects/${encodeURIComponent(projectSlug)}/documents`;

  if (!documentType) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Invalid document type.</p>
      </div>
    );
  }

  if (
    containerLock.locked &&
    containerLock.prerequisiteDocumentType &&
    containerLock.prerequisiteLabel
  ) {
    return (
      <DocumentContainerLockedPage
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        documentType={documentType}
        prerequisiteLabel={containerLock.prerequisiteLabel}
        prerequisiteHref={`${base}/${containerLock.prerequisiteDocumentType}`}
      />
    );
  }

  return (
    <DocumentOverviewPage
      orgSlug={orgSlug}
      projectSlug={projectSlug}
      projectId={projectId}
      documentType={documentType}
      isProjectsPending={isProjectsPending}
    />
  );
}
