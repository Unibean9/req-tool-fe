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
  fetchBR,
  type BusinessRequirement,
  type BusinessRequirementsListResponse,
  type CreateBusinessRequirementRequest,
  type CreateBusinessRequirementResponse,
  type UpdateBusinessRequirementRequest,
  type UpdateBusinessRequirementResponse,
} from "@/lib/api/services/fetchBR";
import {
  projectBRQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";

type CreateBRVariables = {
  projectId: string;
  item: CreateBusinessRequirementRequest;
};

type UpdateBRVariables = {
  projectId: string;
  brId: string;
  body: UpdateBusinessRequirementRequest;
};

type DeleteBRVariables = {
  projectId: string;
  brId: string;
};

function invalidateBRMutationCaches(
  queryClient: QueryClient,
  projectId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectBRQueryKey(projectId),
  });
  void queryClient.invalidateQueries({
    queryKey: projectSetupProgressQueryKey(projectId),
  });
}

/**
 * GET /api/v1/projects/{project_id}/business-requirements — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectBR(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<BusinessRequirementsListResponse, Error, BusinessRequirement[]>({
    queryKey: projectBRQueryKey(pid),
    queryFn: async () => fetchBR.list(pid),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectBRFull(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectBRQueryKey(pid),
    queryFn: () => fetchBR.list(pid),
    enabled,
  });
}

/**
 * POST /api/v1/projects/{project_id}/business-requirements
 * Invalidate danh sách BR + setup progress.
 */
export function useCreateProjectBR(
  options?: Omit<
    UseMutationOptions<
      CreateBusinessRequirementResponse,
      Error,
      CreateBRVariables
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
    }: CreateBRVariables): Promise<CreateBusinessRequirementResponse> => {
      return fetchBR.create(projectId, item);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateBRMutationCaches(queryClient, variables.projectId);
      toast.success("Đã tạo business requirement");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(
        getApiErrorMessage(error, "Tạo business requirement thất bại")
      );
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/{project_id}/business-requirements/{br_id}
 * Invalidate danh sách BR + setup progress.
 */
export function useUpdateProjectBR(
  options?: Omit<
    UseMutationOptions<
      UpdateBusinessRequirementResponse,
      Error,
      UpdateBRVariables
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
      brId,
      body,
    }: UpdateBRVariables): Promise<UpdateBusinessRequirementResponse> => {
      return fetchBR.update(projectId, brId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateBRMutationCaches(queryClient, variables.projectId);
      toast.success("Đã cập nhật business requirement");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(
        getApiErrorMessage(error, "Cập nhật business requirement thất bại")
      );
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/{project_id}/business-requirements/{br_id}
 * Invalidate danh sách BR + setup progress.
 */
export function useDeleteProjectBR(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteBRVariables>,
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
      brId,
    }: DeleteBRVariables): Promise<void> => {
      await fetchBR.delete(projectId, brId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateBRMutationCaches(queryClient, variables.projectId);
      toast.success("Đã xóa business requirement");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(
        getApiErrorMessage(error, "Xóa business requirement thất bại")
      );
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  BRPriority,
  BusinessRequirement,
  BusinessRequirementResponse,
  BusinessRequirementsListResponse,
  BusinessRequirementWriteRequest,
  CreateBusinessRequirementRequest,
  CreateBusinessRequirementResponse,
  UpdateBusinessRequirementRequest,
  UpdateBusinessRequirementResponse,
} from "@/lib/api/services/fetchBR";

export { BR_PRIORITIES } from "@/lib/api/services/fetchBR";
