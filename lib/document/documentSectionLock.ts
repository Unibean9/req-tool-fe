import {
  isDocumentType,
  type DocumentItemSlot,
  type DocumentRegistryEntry,
  type DocumentType,
} from "@/lib/api/services/fetchDocument";

const UNLOCKED_SECTION: DocumentSectionLockInfo = {
  locked: false,
  hasPendingPrerequisite: false,
  prerequisiteItemType: null,
  prerequisiteLabel: null,
};

export type DocumentSectionState = "notStarted" | "inProgress" | "accepted";

export function getDocumentSectionState(
  item: DocumentItemSlot
): DocumentSectionState {
  if (!item.artifactId) return "notStarted";
  if (item.status === "accepted") return "accepted";
  return "inProgress";
}

export function getDocumentSectionStatusLabel(item: DocumentItemSlot): string {
  const hasArtifact = Boolean(item.artifactId);
  if (!hasArtifact) return "Not started";
  if (item.status === "accepted") return "Accepted";
  if (item.status === "draft") return "Draft";
  if (item.status === "needs_clarification") return "Needs clarification";
  if (item.status === "rejected") return "Rejected";
  return "In progress";
}

/** Section đủ điều kiện mở khóa section kế tiếp (đã tạo artifact + accepted). */
export function isDocumentSectionAccepted(item: DocumentItemSlot): boolean {
  return getDocumentSectionState(item) === "accepted";
}

export function isSequentialSectionLockEnabled(
  documentType: DocumentType | null | undefined
): boolean {
  return Boolean(documentType && isDocumentType(documentType));
}

/** Container trước trong thứ tự registry API (`GET /documents/types`). */
export function getPriorRegistryContainer(
  containers: readonly DocumentRegistryEntry[],
  documentType: string
): DocumentRegistryEntry | null {
  const index = containers.findIndex(
    (entry) => entry.artifactType === documentType
  );
  if (index <= 0) return null;
  return containers[index - 1] ?? null;
}

export function areAllDocumentSectionsAccepted(
  sectionOrder: readonly string[],
  items: readonly DocumentItemSlot[]
): boolean {
  if (!sectionOrder.length) return true;
  const slotByType = new Map(items.map((item) => [item.artifactType, item]));
  return sectionOrder.every((itemType) => {
    const slot = slotByType.get(itemType);
    return Boolean(slot && isDocumentSectionAccepted(slot));
  });
}

const UNLOCKED_CONTAINER: DocumentContainerLockInfo = {
  locked: false,
  hasPendingPrerequisite: false,
  prerequisiteDocumentType: null,
  prerequisiteLabel: null,
};

export type DocumentContainerLockInfo = {
  /** Always false — containers are never hard-blocked, only flagged with a warning. */
  locked: boolean;
  hasPendingPrerequisite: boolean;
  prerequisiteDocumentType: string | null;
  prerequisiteLabel: string | null;
};

/** Soft gate: container stays open, but flags a warning when the prior document isn't fully accepted. */
export function getDocumentContainerLock(
  priorSectionOrder: readonly string[],
  priorItems: readonly DocumentItemSlot[],
  priorDocumentType: string,
  priorDocumentLabel?: string | null
): DocumentContainerLockInfo {
  if (areAllDocumentSectionsAccepted(priorSectionOrder, priorItems)) {
    return UNLOCKED_CONTAINER;
  }
  return {
    locked: false,
    hasPendingPrerequisite: true,
    prerequisiteDocumentType: priorDocumentType,
    prerequisiteLabel: priorDocumentLabel ?? priorDocumentType.toUpperCase(),
  };
}

export type DocumentSectionLockInfo = {
  /** Always false — sections are never hard-blocked, only flagged with a warning. */
  locked: boolean;
  hasPendingPrerequisite: boolean;
  prerequisiteItemType: string | null;
  prerequisiteLabel: string | null;
};

/**
 * Soft gate: section stays open, but flags a warning when a predecessor section isn't
 * accepted yet, or when `containerLock` reports the prior document isn't done — that
 * warning cascades to every section of this document, including the first one.
 */
export function getDocumentSectionLock(
  sectionOrder: readonly string[],
  items: readonly DocumentItemSlot[],
  itemType: string,
  documentType?: DocumentType | null,
  containerLock?: DocumentContainerLockInfo | null
): DocumentSectionLockInfo {
  const containerWarning: DocumentSectionLockInfo | null =
    containerLock?.hasPendingPrerequisite
      ? {
          locked: false,
          hasPendingPrerequisite: true,
          prerequisiteItemType: null,
          prerequisiteLabel: containerLock.prerequisiteLabel,
        }
      : null;

  if (!isSequentialSectionLockEnabled(documentType)) {
    return containerWarning ?? UNLOCKED_SECTION;
  }

  const index = sectionOrder.indexOf(itemType);
  if (index <= 0) {
    return containerWarning ?? UNLOCKED_SECTION;
  }

  const slotByType = new Map(items.map((item) => [item.artifactType, item]));

  for (let i = 0; i < index; i++) {
    const priorType = sectionOrder[i]!;
    const priorSlot = slotByType.get(priorType);
    if (!priorSlot || !isDocumentSectionAccepted(priorSlot)) {
      return {
        locked: false,
        hasPendingPrerequisite: true,
        prerequisiteItemType: priorType,
        prerequisiteLabel:
          priorSlot?.label ??
          priorType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      };
    }
  }

  return containerWarning ?? UNLOCKED_SECTION;
}

export function buildDocumentSectionLockMap(
  sectionOrder: readonly string[],
  items: readonly DocumentItemSlot[],
  documentType?: DocumentType | null,
  containerLock?: DocumentContainerLockInfo | null
): Map<string, DocumentSectionLockInfo> {
  const map = new Map<string, DocumentSectionLockInfo>();
  for (const itemType of sectionOrder) {
    map.set(
      itemType,
      getDocumentSectionLock(sectionOrder, items, itemType, documentType, containerLock)
    );
  }
  return map;
}
