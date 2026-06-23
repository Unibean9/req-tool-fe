"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useCachedGet } from "@/hooks/useCachedGet";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  buildDocumentItemResponseFromSlot,
  fetchDocument,
  isHydratedDocumentItemCache,
  type DocumentItemView,
  type DocumentItemViewResponse,
  type DocumentRegistry,
  type DocumentRegistryResponse,
  type DocumentType,
  type DocumentView,
  type DocumentViewResponse,
  type UpsertDocumentItemRequest,
} from "@/lib/api/services/fetchDocument";
import { DEFAULT_QUERY_STALE_MS } from "@/lib/query/defaults";
import {
  documentTypesQueryKey,
  projectBrdExportQueryRoot,
  projectDocumentItemQueryKey,
  projectDocumentQueryKey,
} from "@/lib/query/query-keys";

// ─── Invalidation helpers ─────────────────────────────────────────────────────

function invalidateDocument(
  queryClient: QueryClient,
  projectId: string,
  documentType: DocumentType
) {
  void queryClient.invalidateQueries({
    queryKey: projectDocumentQueryKey(projectId, documentType),
    refetchType: "active",
  });
}

function invalidateDocumentItem(
  queryClient: QueryClient,
  projectId: string,
  documentType: DocumentType,
  itemType: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectDocumentItemQueryKey(projectId, documentType, itemType),
    refetchType: "active",
  });
  invalidateDocument(queryClient, projectId, documentType);
}

/** Agent approve/reject — drop stale item snapshot so list + detail refetch. */
export function refreshDocumentItemAfterExternalChange(
  queryClient: QueryClient,
  projectId: string,
  documentType: DocumentType,
  itemType: string
) {
  const itemKey = projectDocumentItemQueryKey(projectId, documentType, itemType);
  queryClient.removeQueries({ queryKey: itemKey });
  invalidateDocument(queryClient, projectId, documentType);
}

function invalidateBrdExport(queryClient: QueryClient, projectId: string) {
  void queryClient.invalidateQueries({
    queryKey: projectBrdExportQueryRoot(projectId),
    exact: false,
    refetchType: "active",
  });
}

/** Write item cache from document list so detail pages skip redundant GETs. */
export function syncDocumentItemCachesFromDocument(
  queryClient: QueryClient,
  projectId: string,
  documentType: DocumentType,
  document: DocumentView
) {
  for (const slot of document.items) {
    if (!slot.artifactId) continue;

    const key = projectDocumentItemQueryKey(
      projectId,
      documentType,
      slot.artifactType
    );
    const existing = queryClient.getQueryData<DocumentItemViewResponse>(key);
    if (existing && !isHydratedDocumentItemCache(existing)) continue;

    queryClient.setQueryData(key, buildDocumentItemResponseFromSlot(slot));
  }
}

// ─── GET hooks ────────────────────────────────────────────────────────────────

/** GET /api/v1/documents/types */
export function useDocumentTypes(options?: { enabled?: boolean }) {
  return useCachedGet<DocumentRegistryResponse, Error, DocumentRegistry>({
    queryKey: documentTypesQueryKey(),
    queryFn: () => fetchDocument.getTypes(),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 30,
  });
}

/** GET /api/v1/projects/{project_id}/documents/{document_type} */
export function useDocument(
  projectId: string | null | undefined,
  documentType: DocumentType | null | undefined,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const pid = projectId?.trim() ?? "";
  const docType = documentType ?? "brd";
  const enabled =
    Boolean(pid) && Boolean(documentType) && (options?.enabled ?? true);

  const result = useCachedGet<DocumentViewResponse, Error, DocumentView>({
    queryKey: projectDocumentQueryKey(pid, docType),
    queryFn: () => fetchDocument.get(pid, docType),
    select: (res) => res.data,
    enabled,
  });

  useEffect(() => {
    if (!result.data || !enabled) return;
    syncDocumentItemCachesFromDocument(queryClient, pid, docType, result.data);
  }, [enabled, pid, docType, queryClient, result.data, result.dataUpdatedAt]);

  return result;
}

/** GET /api/v1/projects/{project_id}/documents/{document_type}/{item_type} */
export function useDocumentItem(
  projectId: string | null | undefined,
  documentType: DocumentType | null | undefined,
  itemType: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const docType = documentType ?? "brd";
  const item = itemType?.trim() ?? "";
  const enabled =
    Boolean(pid) &&
    Boolean(documentType) &&
    Boolean(item) &&
    (options?.enabled ?? true);

  return useCachedGet<DocumentItemViewResponse, Error, DocumentItemView>({
    queryKey: projectDocumentItemQueryKey(pid, docType, item),
    queryFn: () => fetchDocument.getItem(pid, docType, item),
    select: (res) => res.data,
    enabled,
  });
}

/** Warm item cache before navigation (sidebar hover/focus). */
export function prefetchDocumentItem(
  queryClient: QueryClient,
  projectId: string,
  documentType: DocumentType,
  itemType: string
) {
  const pid = projectId.trim();
  const item = itemType.trim();
  if (!pid || !item) return;

  const key = projectDocumentItemQueryKey(pid, documentType, item);
  const cached = queryClient.getQueryData<DocumentItemViewResponse>(key);
  if (cached && !isHydratedDocumentItemCache(cached)) return;

  void queryClient.prefetchQuery({
    queryKey: key,
    queryFn: () => fetchDocument.getItem(pid, documentType, item),
    staleTime: DEFAULT_QUERY_STALE_MS,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

type EnsureDocumentVariables = {
  projectId: string;
  documentType: DocumentType;
};

/** POST /api/v1/projects/{project_id}/documents/{document_type} */
export function useEnsureDocument(
  options?: Omit<
    UseMutationOptions<DocumentViewResponse, Error, EnsureDocumentVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: ({ projectId, documentType }: EnsureDocumentVariables) =>
      fetchDocument.create(projectId, documentType),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(
        projectDocumentQueryKey(variables.projectId, variables.documentType),
        data
      );
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Could not create document"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type UpsertDocumentItemVariables = {
  projectId: string;
  documentType: DocumentType;
  itemType: string;
  req: UpsertDocumentItemRequest;
};

/** POST /api/v1/projects/{project_id}/documents/{document_type}/{item_type} */
export function useUpsertDocumentItem(
  options?: Omit<
    UseMutationOptions<
      DocumentItemViewResponse,
      Error,
      UpsertDocumentItemVariables
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: ({
      projectId,
      documentType,
      itemType,
      req,
    }: UpsertDocumentItemVariables) =>
      fetchDocument.upsertItem(projectId, documentType, itemType, req),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(
        projectDocumentItemQueryKey(
          variables.projectId,
          variables.documentType,
          variables.itemType
        ),
        data
      );
      invalidateDocument(
        queryClient,
        variables.projectId,
        variables.documentType
      );
      invalidateBrdExport(queryClient, variables.projectId);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Could not save section"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export { invalidateDocument, invalidateDocumentItem };
