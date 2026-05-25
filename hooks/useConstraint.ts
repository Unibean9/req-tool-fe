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
  fetchConstraint,
  type CreateProjectConstraintRequest,
  type CreateProjectConstraintResponse,
  type ListProjectConstraintsParams,
  type ProjectConstraint,
  type ProjectConstraintsListResponse,
  type UpdateProjectConstraintRequest,
  type UpdateProjectConstraintResponse,
} from "@/lib/api/services/fetchConstraint";
import {
  projectConstraintsQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";

type CreateProjectConstraintVariables = {
  projectId: string;
  body: CreateProjectConstraintRequest;
};

type UpdateProjectConstraintVariables = {
  projectId: string;
  constraintId: string;
  body: UpdateProjectConstraintRequest;
};

type DeleteProjectConstraintVariables = {
  projectId: string;
  constraintId: string;
};

function invalidateConstraintMutationCaches(
  queryClient: QueryClient,
  projectId: string
) {
  void queryClient.invalidateQueries({
    queryKey: ["projects", "constraints", projectId] as const,
  });
  void queryClient.invalidateQueries({
    queryKey: projectSetupProgressQueryKey(projectId),
  });
}

/**
 * GET /api/v1/projects/{project_id}/constraints — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectConstraints(
  projectId: string | null | undefined,
  params?: ListProjectConstraintsParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<
    ProjectConstraintsListResponse,
    Error,
    ProjectConstraint[]
  >({
    queryKey: projectConstraintsQueryKey(pid, params),
    queryFn: async () => fetchConstraint.list(pid, params),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectConstraintsFull(
  projectId: string | null | undefined,
  params?: ListProjectConstraintsParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectConstraintsQueryKey(pid, params),
    queryFn: () => fetchConstraint.list(pid, params),
    enabled,
  });
}

/**
 * POST /api/v1/projects/{project_id}/constraints
 * Invalidate danh sách constraints + setup progress.
 */
export function useCreateProjectConstraint(
  options?: Omit<
    UseMutationOptions<
      CreateProjectConstraintResponse,
      Error,
      CreateProjectConstraintVariables
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
    }: CreateProjectConstraintVariables): Promise<CreateProjectConstraintResponse> => {
      return fetchConstraint.create(projectId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateConstraintMutationCaches(queryClient, variables.projectId);
      toast.success("Constraint created");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to create constraint"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/{project_id}/constraints/{constraint_id}
 * Invalidate danh sách constraints + setup progress.
 */
export function useUpdateProjectConstraint(
  options?: Omit<
    UseMutationOptions<
      UpdateProjectConstraintResponse,
      Error,
      UpdateProjectConstraintVariables
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
      constraintId,
      body,
    }: UpdateProjectConstraintVariables): Promise<UpdateProjectConstraintResponse> => {
      return fetchConstraint.update(projectId, constraintId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateConstraintMutationCaches(queryClient, variables.projectId);
      toast.success("Constraint updated");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to update constraint"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/{project_id}/constraints/{constraint_id}
 * Invalidate danh sách constraints + setup progress.
 */
export function useDeleteProjectConstraint(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteProjectConstraintVariables>,
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
      constraintId,
    }: DeleteProjectConstraintVariables): Promise<void> => {
      await fetchConstraint.delete(projectId, constraintId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateConstraintMutationCaches(queryClient, variables.projectId);
      toast.success("Constraint deleted");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to delete constraint"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  ConstraintSeverity,
  ConstraintType,
  CreateProjectConstraintRequest,
  CreateProjectConstraintResponse,
  ListProjectConstraintsParams,
  ProjectConstraint,
  ProjectConstraintResponse,
  ProjectConstraintsListResponse,
  ProjectConstraintWriteRequest,
  UpdateProjectConstraintRequest,
  UpdateProjectConstraintResponse,
} from "@/lib/api/services/fetchConstraint";

export {
  CONSTRAINT_SEVERITIES,
  CONSTRAINT_TYPES,
} from "@/lib/api/services/fetchConstraint";
