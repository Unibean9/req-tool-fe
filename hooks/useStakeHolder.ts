"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useCachedGet } from "@/hooks/useCachedGet";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchStakeHolder,
  type CreateProjectStakeholderRequest,
  type CreateProjectStakeholderResponse,
  type ProjectStakeholder,
  type ProjectStakeholderResponse,
  type ProjectStakeholdersListResponse,
  type UpdateProjectStakeholderRequest,
  type UpdateProjectStakeholderResponse,
} from "@/lib/api/services/fetchStakeHolder";
import {
  projectStakeholderQueryKey,
  projectStakeholdersQueryKey,
} from "@/lib/query/query-keys";

type CreateProjectStakeholderVariables = {
  projectId: string;
  body: CreateProjectStakeholderRequest;
};

type UpdateProjectStakeholderVariables = {
  projectId: string;
  stakeholderId: string;
  body: UpdateProjectStakeholderRequest;
};

type DeleteProjectStakeholderVariables = {
  projectId: string;
  stakeholderId: string;
};

/**
 * GET /api/v1/projects/:project_id/stakeholders — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectStakeholders(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<
    ProjectStakeholdersListResponse,
    Error,
    ProjectStakeholder[]
  >({
    queryKey: projectStakeholdersQueryKey(pid),
    queryFn: async () => fetchStakeHolder.list(pid),
    select: (res) => res.data,
    enabled,
  });
}

export function useProjectStakeholdersFull(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectStakeholdersQueryKey(pid),
    queryFn: () => fetchStakeHolder.list(pid),
    enabled,
  });
}

/**
 * GET /api/v1/projects/:project_id/stakeholders/:stakeholder_id
 */
export function useProjectStakeholder(
  projectId: string | null | undefined,
  stakeholderId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const sid = stakeholderId?.trim() ?? "";
  const enabled = Boolean(pid && sid) && (options?.enabled ?? true);

  return useCachedGet<ProjectStakeholderResponse, Error, ProjectStakeholder>({
    queryKey: projectStakeholderQueryKey(pid, sid),
    queryFn: async () => {
      const res = await fetchStakeHolder.get(pid, sid);
      if (!res.success) {
        throw new Error(res.message ?? "Không tải được stakeholder");
      }
      return res;
    },
    select: (res) => res.data,
    enabled,
  });
}

export function useProjectStakeholderFull(
  projectId: string | null | undefined,
  stakeholderId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const sid = stakeholderId?.trim() ?? "";
  const enabled = Boolean(pid && sid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectStakeholderQueryKey(pid, sid),
    queryFn: () => fetchStakeHolder.get(pid, sid),
    enabled,
  });
}

/**
 * POST /api/v1/projects/:project_id/stakeholders
 */
export function useCreateProjectStakeholder(
  options?: Omit<
    UseMutationOptions<
      CreateProjectStakeholderResponse,
      Error,
      CreateProjectStakeholderVariables
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
    }: CreateProjectStakeholderVariables): Promise<CreateProjectStakeholderResponse> => {
      const result = await fetchStakeHolder.create(projectId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Tạo stakeholder thất bại");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: projectStakeholdersQueryKey(variables.projectId),
      });
      toast.success("Đã tạo stakeholder");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Tạo stakeholder thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/:project_id/stakeholders/:stakeholder_id
 */
export function useUpdateProjectStakeholder(
  options?: Omit<
    UseMutationOptions<
      UpdateProjectStakeholderResponse,
      Error,
      UpdateProjectStakeholderVariables
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
      stakeholderId,
      body,
    }: UpdateProjectStakeholderVariables): Promise<UpdateProjectStakeholderResponse> => {
      const result = await fetchStakeHolder.update(
        projectId,
        stakeholderId,
        body
      );
      if (!result.success) {
        throw new Error(result.message ?? "Cập nhật stakeholder thất bại");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: projectStakeholdersQueryKey(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectStakeholderQueryKey(
          variables.projectId,
          variables.stakeholderId
        ),
      });
      toast.success("Đã cập nhật stakeholder");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Cập nhật stakeholder thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/:project_id/stakeholders/:stakeholder_id
 */
export function useDeleteProjectStakeholder(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteProjectStakeholderVariables>,
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
      stakeholderId,
    }: DeleteProjectStakeholderVariables): Promise<void> => {
      await fetchStakeHolder.delete(projectId, stakeholderId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: projectStakeholdersQueryKey(variables.projectId),
      });
      void queryClient.removeQueries({
        queryKey: projectStakeholderQueryKey(
          variables.projectId,
          variables.stakeholderId
        ),
      });
      toast.success("Đã xóa stakeholder");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Xóa stakeholder thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  CreateProjectStakeholderRequest,
  CreateProjectStakeholderResponse,
  ProjectStakeholder,
  ProjectStakeholderResponse,
  ProjectStakeholdersListResponse,
  ProjectStakeholderWriteRequest,
  StakeholderInfluenceLevel,
  UpdateProjectStakeholderRequest,
  UpdateProjectStakeholderResponse,
} from "@/lib/api/services/fetchStakeHolder";

export { STAKEHOLDER_INFLUENCE_LEVELS } from "@/lib/api/services/fetchStakeHolder";
