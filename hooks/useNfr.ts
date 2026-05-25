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
  fetchNfr,
  type CreateProjectNfrRequest,
  type CreateProjectNfrResponse,
  type ListProjectNfrsParams,
  type ProjectNfr,
  type ProjectNfrResponse,
  type ProjectNfrsListResponse,
  type UpdateProjectNfrRequest,
  type UpdateProjectNfrResponse,
} from "@/lib/api/services/fetchNfr";
import {
  projectNfrQueryKey,
  projectNfrsQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";

type CreateProjectNfrVariables = {
  projectId: string;
  body: CreateProjectNfrRequest;
};

type UpdateProjectNfrVariables = {
  projectId: string;
  nfrId: string;
  body: UpdateProjectNfrRequest;
};

type DeleteProjectNfrVariables = {
  projectId: string;
  nfrId: string;
};

function invalidateNfrMutationCaches(
  queryClient: QueryClient,
  projectId: string
) {
  void queryClient.invalidateQueries({
    queryKey: ["projects", "nfrs", projectId] as const,
  });
  void queryClient.invalidateQueries({
    queryKey: projectSetupProgressQueryKey(projectId),
  });
}

/**
 * GET /api/v1/projects/{project_id}/setup-progress
 * Dùng cùng trang NFR để hiển thị tiến độ workspace.
 */
export {
  useProjectSetupProgress,
  useProjectSetupProgressFull,
} from "@/hooks/useProject";

/**
 * GET /api/v1/projects/{project_id}/nfrs — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectNfrs(
  projectId: string | null | undefined,
  params?: ListProjectNfrsParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ProjectNfrsListResponse, Error, ProjectNfr[]>({
    queryKey: projectNfrsQueryKey(pid, params),
    queryFn: async () => fetchNfr.list(pid, params),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectNfrsFull(
  projectId: string | null | undefined,
  params?: ListProjectNfrsParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectNfrsQueryKey(pid, params),
    queryFn: () => fetchNfr.list(pid, params),
    enabled,
  });
}

/**
 * GET /api/v1/projects/{project_id}/nfrs/{nfr_id}
 */
export function useProjectNfr(
  projectId: string | null | undefined,
  nfrId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const nid = nfrId?.trim() ?? "";
  const enabled =
    Boolean(pid) && Boolean(nid) && (options?.enabled ?? true);

  return useCachedGet<ProjectNfrResponse, Error, ProjectNfr>({
    queryKey: projectNfrQueryKey(pid, nid),
    queryFn: async () => fetchNfr.get(pid, nid),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET detail; trả full envelope `{ success, data, message }`. */
export function useProjectNfrFull(
  projectId: string | null | undefined,
  nfrId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const nid = nfrId?.trim() ?? "";
  const enabled =
    Boolean(pid) && Boolean(nid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectNfrQueryKey(pid, nid),
    queryFn: () => fetchNfr.get(pid, nid),
    enabled,
  });
}

/**
 * POST /api/v1/projects/{project_id}/nfrs
 * Invalidate danh sách NFR + setup progress.
 */
export function useCreateProjectNfr(
  options?: Omit<
    UseMutationOptions<
      CreateProjectNfrResponse,
      Error,
      CreateProjectNfrVariables
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
      body,
    }: CreateProjectNfrVariables): Promise<CreateProjectNfrResponse> => {
      return fetchNfr.create(projectId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateNfrMutationCaches(queryClient, variables.projectId);
      toast.success("NFR created");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to create NFR"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/{project_id}/nfrs/{nfr_id}
 * Invalidate danh sách NFR + detail + setup progress.
 */
export function useUpdateProjectNfr(
  options?: Omit<
    UseMutationOptions<
      UpdateProjectNfrResponse,
      Error,
      UpdateProjectNfrVariables
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
      nfrId,
      body,
    }: UpdateProjectNfrVariables): Promise<UpdateProjectNfrResponse> => {
      return fetchNfr.update(projectId, nfrId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateNfrMutationCaches(queryClient, variables.projectId);
      toast.success("NFR updated");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to update NFR"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/{project_id}/nfrs/{nfr_id}
 * Invalidate danh sách NFR + detail + setup progress.
 */
export function useDeleteProjectNfr(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteProjectNfrVariables>,
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
      nfrId,
    }: DeleteProjectNfrVariables): Promise<void> => {
      await fetchNfr.delete(projectId, nfrId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateNfrMutationCaches(queryClient, variables.projectId);
      toast.success("NFR deleted");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to delete NFR"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  CreateProjectNfrRequest,
  CreateProjectNfrResponse,
  ListProjectNfrsParams,
  NfrCategory,
  NfrPriority,
  ProjectNfr,
  ProjectNfrResponse,
  ProjectNfrsListResponse,
  ProjectNfrWriteRequest,
  UpdateProjectNfrRequest,
  UpdateProjectNfrResponse,
} from "@/lib/api/services/fetchNfr";

export { NFR_CATEGORIES } from "@/lib/api/services/fetchNfr";
