import type { DocumentType } from "@/lib/api/services/fetchDocument";

/** Tạm thời khóa — bỏ type khỏi set khi mở lại. */
export const LOCKED_DOCUMENT_TYPES = new Set<DocumentType>(["prd", "sad"]);

export function isLockedDocumentType(
  documentType: DocumentType | null | undefined
): boolean {
  return Boolean(documentType && LOCKED_DOCUMENT_TYPES.has(documentType));
}
