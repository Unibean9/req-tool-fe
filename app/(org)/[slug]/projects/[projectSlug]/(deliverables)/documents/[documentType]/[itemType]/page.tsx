"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { useOrgProjects } from "@/hooks/useProject";
import { useDocumentTypes } from "@/hooks/useDocument";
import { isDocumentType } from "@/lib/api/services/fetchDocument";
import { isLockedDocumentType } from "@/lib/document/lockedDocumentTypes";

import { useOrgWorkspace } from "../../../../../../orgWorkspaceContext";
import { DocumentItemPage } from "../../components/documentItemPage";
import { DocumentLockedPage } from "../../components/documentLockedPage";

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

  const documentTypeRaw = useMemo(() => {
    const raw = params?.documentType;
    return typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? (raw[0] ?? "")
        : "";
  }, [params?.documentType]);

  const itemTypeRaw = useMemo(() => {
    const raw = params?.itemType;
    return typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? (raw[0] ?? "")
        : "";
  }, [params?.itemType]);

  const documentType = isDocumentType(documentTypeRaw) ? documentTypeRaw : null;
  const { data: registry } = useDocumentTypes();

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

  const isValidItem = useMemo(() => {
    if (!documentType || !itemTypeRaw) return false;
    const container = registry?.containers.find(
      (entry) => entry.artifactType === documentType
    );
    return container?.children.includes(itemTypeRaw) ?? false;
  }, [documentType, itemTypeRaw, registry?.containers]);

  const { data: projects, isPending: isProjectsPending } = useOrgProjects(orgId);
  const projectId = useMemo(
    () => projects?.find((p) => p.slug === projectSlug)?.id ?? null,
    [projects, projectSlug]
  );

  if (!documentType || !itemTypeRaw) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Invalid document section.</p>
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

  if (registry && !isValidItem) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          This section does not belong to the document.
        </p>
      </div>
    );
  }

  return (
    <DocumentItemPage
      projectId={projectId}
      documentType={documentType}
      itemType={itemTypeRaw}
      isProjectsPending={isProjectsPending}
    />
  );
}
