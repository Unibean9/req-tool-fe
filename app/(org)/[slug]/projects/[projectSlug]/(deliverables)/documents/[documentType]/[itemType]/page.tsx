"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { useOrgProjects } from "@/hooks/useProject";
import { useDocument, useDocumentTypes } from "@/hooks/useDocument";
import { useDocumentContainerLock } from "@/hooks/useDocumentContainerLock";
import { isDocumentType } from "@/lib/api/services/fetchDocument";
import { getDocumentSectionLock, getPriorRegistryContainer } from "@/lib/document/documentSectionLock";

import { useOrgWorkspace } from "../../../../../../orgWorkspaceContext";
import { DocumentContainerLockedPage } from "../../components/documentContainerLockedPage";
import { DocumentItemPage } from "../../components/documentItemPage";
import { DocumentSectionLockedPage } from "../../components/documentSectionLockedPage";

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

  const { data: document, isPending: isDocumentPending } = useDocument(
    projectId,
    documentType ?? "brd",
    { enabled: Boolean(projectId && documentType && isValidItem) },
  );

  const sectionOrder = useMemo(() => {
    if (!documentType) return [];
    const container = registry?.containers.find(
      (entry) => entry.artifactType === documentType,
    );
    return container?.children ?? [];
  }, [documentType, registry?.containers]);

  const sectionLock = useMemo(() => {
    if (!document || !itemTypeRaw || !sectionOrder.length) return null;
    return getDocumentSectionLock(
      sectionOrder,
      document.items,
      itemTypeRaw,
      documentType,
    );
  }, [document, documentType, itemTypeRaw, sectionOrder]);

  const slot = useMemo(
    () =>
      document?.items.find((item) => item.artifactType === itemTypeRaw) ?? null,
    [document?.items, itemTypeRaw],
  );

  const base = `/${encodeURIComponent(orgSlug)}/projects/${encodeURIComponent(projectSlug)}/documents/${documentType}`;

  if (!documentType || !itemTypeRaw) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Invalid document section.</p>
      </div>
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
        prerequisiteHref={`/${encodeURIComponent(orgSlug)}/projects/${encodeURIComponent(projectSlug)}/documents/${containerLock.prerequisiteDocumentType}`}
      />
    );
  }

  if (
    isDocumentPending &&
    !document &&
    projectId &&
    isValidItem
  ) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading section…</p>
      </div>
    );
  }

  if (sectionLock?.locked && sectionLock.prerequisiteItemType) {
    return (
      <DocumentSectionLockedPage
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        documentType={documentType}
        sectionLabel={slot?.label ?? itemTypeRaw.replace(/_/g, " ")}
        prerequisiteLabel={sectionLock.prerequisiteLabel ?? "previous section"}
        prerequisiteHref={`${base}/${sectionLock.prerequisiteItemType}`}
      />
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
