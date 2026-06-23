"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { useOrgProjects } from "@/hooks/useProject";
import { isDocumentType } from "@/lib/api/services/fetchDocument";
import { isLockedDocumentType } from "@/lib/document/lockedDocumentTypes";

import { useOrgWorkspace } from "../../../../../orgWorkspaceContext";
import { DocumentLockedPage } from "../components/documentLockedPage";
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

  const { data: projects, isPending: isProjectsPending } = useOrgProjects(orgId);
  const projectId = useMemo(
    () => projects?.find((p) => p.slug === projectSlug)?.id ?? null,
    [projects, projectSlug]
  );

  if (!documentType) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Invalid document type.</p>
      </div>
    );
  }

  if (isLockedDocumentType(documentType)) {
    return (
      <DocumentLockedPage
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        documentType={documentType}
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
