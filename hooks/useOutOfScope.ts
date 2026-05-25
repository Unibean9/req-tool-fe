"use client";

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
  fetchOutOfScope,
  type CreateOutOfScopeItemRequest,
  type CreateOutOfScopeItemResponse,
  type ListOutOfScopeItemsParams,
  type OutOfScopeItem,
  type OutOfScopeItemsListResponse,
  type UpdateOutOfScopeItemRequest,
  type UpdateOutOfScopeItemResponse,
} from "@/lib/api/services/fetchOutOfScope";
import {
  projectOutOfScopeQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";

type CreateOutOfScopeItemVariables = {
  projectId: string;
  item: CreateOutOfScopeItemRequest;
};

type UpdateOutOfScopeItemVariables = {
  projectId: string;
  itemId: string;
  body: UpdateOutOfScopeItemRequest;
};

type DeleteOutOfScopeItemVariables = {
  projectId: string;
  itemId: string;
};

function invalidateOutOfScopeMutationCaches(
  queryClient: QueryClient,
  projectId: string
) {
  void queryClient.invalidateQueries({
    queryKey: ["projects", "out-of-scope", projectId] as const,
  });
  void queryClient.invalidateQueries({
    queryKey: projectSetupProgressQueryKey(projectId),
  });
}

/**
 * GET /api/v1/projects/{project_id}/out-of-scope — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectOutOfScope(
  projectId: string | null | undefined,
  params?: ListOutOfScopeItemsParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<OutOfScopeItemsListResponse, Error, OutOfScopeItem[]>({
    queryKey: projectOutOfScopeQueryKey(pid, params),
    queryFn: async () => fetchOutOfScope.list(pid, params),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectOutOfScopeFull(
  projectId: string | null | undefined,
  params?: ListOutOfScopeItemsParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectOutOfScopeQueryKey(pid, params),
    queryFn: () => fetchOutOfScope.list(pid, params),
    enabled,
  });
}

/**
 * POST /api/v1/projects/{project_id}/out-of-scope
 * Invalidate danh sách out-of-scope + setup progress.
 */
export function useCreateProjectOutOfScope(
  options?: Omit<
    UseMutationOptions<
      CreateOutOfScopeItemResponse,
      Error,
      CreateOutOfScopeItemVariables
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      projectId,
      item,
    }: CreateOutOfScopeItemVariables): Promise<CreateOutOfScopeItemResponse> => {
      return fetchOutOfScope.create(projectId, item);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateOutOfScopeMutationCaches(queryClient, variables.projectId);
      toast.success("Out-of-scope created");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to create out-of-scope"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/{project_id}/out-of-scope/{item_id}
 * Invalidate danh sách out-of-scope + setup progress.
 */
export function useUpdateProjectOutOfScope(
  options?: Omit<
    UseMutationOptions<
      UpdateOutOfScopeItemResponse,
      Error,
      UpdateOutOfScopeItemVariables
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      projectId,
      itemId,
      body,
    }: UpdateOutOfScopeItemVariables): Promise<UpdateOutOfScopeItemResponse> => {
      return fetchOutOfScope.update(projectId, itemId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateOutOfScopeMutationCaches(queryClient, variables.projectId);
      toast.success("Out-of-scope updated");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to update out-of-scope"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/{project_id}/out-of-scope/{item_id}
 * Invalidate danh sách out-of-scope + setup progress.
 */
export function useDeleteProjectOutOfScope(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteOutOfScopeItemVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      projectId,
      itemId,
    }: DeleteOutOfScopeItemVariables): Promise<void> => {
      await fetchOutOfScope.delete(projectId, itemId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateOutOfScopeMutationCaches(queryClient, variables.projectId);
      toast.success("Out-of-scope deleted");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to delete out-of-scope"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  OutOfScopeCategory,
  OutOfScopeItem,
  OutOfScopeItemResponse,
  OutOfScopeItemsListResponse,
  OutOfScopeItemWriteRequest,
  CreateOutOfScopeItemRequest,
  CreateOutOfScopeItemResponse,
  ListOutOfScopeItemsParams,
  UpdateOutOfScopeItemRequest,
  UpdateOutOfScopeItemResponse,
} from "@/lib/api/services/fetchOutOfScope";

export { OUT_OF_SCOPE_CATEGORIES } from "@/lib/api/services/fetchOutOfScope";
