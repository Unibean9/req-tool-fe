"use client";

import { useMemo } from "react";

import { useDocument } from "@/hooks/useDocument";
import {
  isDocumentType,
  type DocumentItemSlot,
  type DocumentRegistryEntry,
  type DocumentType,
} from "@/lib/api/services/fetchDocument";
import {
  getDocumentContainerLock,
  type DocumentContainerLockInfo,
} from "@/lib/document/documentSectionLock";

function buildPlaceholderItems(
  container: DocumentRegistryEntry
): DocumentItemSlot[] {
  return container.children.map((itemType) => ({
    artifactType: itemType,
    label: itemType.replace(/_/g, " "),
    description: "",
    artifactId: null,
    parentId: null,
    status: null,
    title: null,
    currentVersionId: null,
    currentVersion: null,
    versions: [],
  }));
}

export function useDocumentContainerLock(
  projectId: string | null | undefined,
  documentType: DocumentType | null | undefined,
  priorContainer: DocumentRegistryEntry | null | undefined
): DocumentContainerLockInfo {
  const priorDocumentType =
    priorContainer && isDocumentType(priorContainer.artifactType)
      ? priorContainer.artifactType
      : null;

  const { data: priorDocument } = useDocument(projectId, priorDocumentType, {
    enabled: Boolean(projectId && priorDocumentType),
  });

  return useMemo(() => {
    if (!documentType || !priorContainer || !priorDocumentType) {
      return {
        locked: false,
        prerequisiteDocumentType: null,
        prerequisiteLabel: null,
      };
    }

    const priorItems = priorDocument?.items.length
      ? priorDocument.items
      : buildPlaceholderItems(priorContainer);

    return getDocumentContainerLock(
      priorContainer.children,
      priorItems,
      priorDocumentType,
      priorDocument?.label ?? priorContainer.label
    );
  }, [documentType, priorContainer, priorDocument, priorDocumentType]);
}
