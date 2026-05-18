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
  fetchFlow,
  type CreateProjectFlowRequest,
  type CreateProjectFlowResponse,
  type ProjectFlow,
  type ProjectFlowsListResponse,
  type UpdateProjectFlowRequest,
  type UpdateProjectFlowResponse,
} from "@/lib/api/services/fetchFlow";
import {
  projectFlowsQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";

type CreateProjectFlowVariables = {
  projectId: string;
  body: CreateProjectFlowRequest;
};

type UpdateProjectFlowVariables = {
  projectId: string;
  flowId: string;
  body: UpdateProjectFlowRequest;
};

type DeleteProjectFlowVariables = {
  projectId: string;
  flowId: string;
};

function invalidateFlowMutationCaches(
  queryClient: QueryClient,
  projectId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectFlowsQueryKey(projectId),
  });
  void queryClient.invalidateQueries({
    queryKey: projectSetupProgressQueryKey(projectId),
  });
}

/**
 * GET /api/v1/projects/{project_id}/flows — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectFlows(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ProjectFlowsListResponse, Error, ProjectFlow[]>({
    queryKey: projectFlowsQueryKey(pid),
    queryFn: async () => fetchFlow.list(pid),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectFlowsFull(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectFlowsQueryKey(pid),
    queryFn: () => fetchFlow.list(pid),
    enabled,
  });
}

/**
 * POST /api/v1/projects/{project_id}/flows
 * Invalidate danh sách flows + setup progress.
 */
export function useCreateProjectFlow(
  options?: Omit<
    UseMutationOptions<
      CreateProjectFlowResponse,
      Error,
      CreateProjectFlowVariables
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
    }: CreateProjectFlowVariables): Promise<CreateProjectFlowResponse> => {
      return fetchFlow.create(projectId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateFlowMutationCaches(queryClient, variables.projectId);
      toast.success("Đã tạo flow");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Tạo flow thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/{project_id}/flows/{flow_id}
 * Invalidate danh sách flows + setup progress.
 */
export function useUpdateProjectFlow(
  options?: Omit<
    UseMutationOptions<
      UpdateProjectFlowResponse,
      Error,
      UpdateProjectFlowVariables
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
      flowId,
      body,
    }: UpdateProjectFlowVariables): Promise<UpdateProjectFlowResponse> => {
      return fetchFlow.update(projectId, flowId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateFlowMutationCaches(queryClient, variables.projectId);
      toast.success("Đã cập nhật flow");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Cập nhật flow thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/{project_id}/flows/{flow_id}
 * Invalidate danh sách flows + setup progress.
 */
export function useDeleteProjectFlow(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteProjectFlowVariables>,
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
      flowId,
    }: DeleteProjectFlowVariables): Promise<void> => {
      await fetchFlow.delete(projectId, flowId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateFlowMutationCaches(queryClient, variables.projectId);
      toast.success("Đã xóa flow");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Xóa flow thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  CreateProjectFlowRequest,
  CreateProjectFlowResponse,
  ProjectFlow,
  ProjectFlowResponse,
  ProjectFlowsListResponse,
  ProjectFlowWriteRequest,
  UpdateProjectFlowRequest,
  UpdateProjectFlowResponse,
} from "@/lib/api/services/fetchFlow";
