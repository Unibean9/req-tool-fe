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
  fetchGoal,
  type CreateProjectGoalRequest,
  type CreateProjectGoalResponse,
  type ProjectGoal,
  type ProjectGoalsListResponse,
  type UpdateProjectGoalRequest,
  type UpdateProjectGoalResponse,
} from "@/lib/api/services/fetchGoal";
import {
  projectBrdExportQueryKey,
  projectGoalsQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";

type CreateProjectGoalVariables = {
  projectId: string;
  body: CreateProjectGoalRequest;
};

type UpdateProjectGoalVariables = {
  projectId: string;
  goalId: string;
  body: UpdateProjectGoalRequest;
};

type DeleteProjectGoalVariables = {
  projectId: string;
  goalId: string;
};

function invalidateGoalMutationCaches(
  queryClient: QueryClient,
  projectId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectGoalsQueryKey(projectId),
  });
  void queryClient.invalidateQueries({
    queryKey: projectSetupProgressQueryKey(projectId),
  });
  void queryClient.invalidateQueries({
    queryKey: projectBrdExportQueryKey(projectId),
  });
}

/**
 * GET /api/v1/projects/{project_id}/goals — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectGoals(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ProjectGoalsListResponse, Error, ProjectGoal[]>({
    queryKey: projectGoalsQueryKey(pid),
    queryFn: async () => fetchGoal.list(pid),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectGoalsFull(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectGoalsQueryKey(pid),
    queryFn: () => fetchGoal.list(pid),
    enabled,
  });
}

/**
 * POST /api/v1/projects/{project_id}/goals
 * Invalidate danh sách goals + setup progress.
 */
export function useCreateProjectGoal(
  options?: Omit<
    UseMutationOptions<
      CreateProjectGoalResponse,
      Error,
      CreateProjectGoalVariables
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
    }: CreateProjectGoalVariables): Promise<CreateProjectGoalResponse> => {
      return fetchGoal.create(projectId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateGoalMutationCaches(queryClient, variables.projectId);
      toast.success("Goal created");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to create goal"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/{project_id}/goals/{goal_id}
 * Invalidate danh sách goals + setup progress.
 */
export function useUpdateProjectGoal(
  options?: Omit<
    UseMutationOptions<
      UpdateProjectGoalResponse,
      Error,
      UpdateProjectGoalVariables
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
      goalId,
      body,
    }: UpdateProjectGoalVariables): Promise<UpdateProjectGoalResponse> => {
      return fetchGoal.update(projectId, goalId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateGoalMutationCaches(queryClient, variables.projectId);
      toast.success("Goal updated");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to update goal"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/{project_id}/goals/{goal_id}
 * Invalidate danh sách goals + setup progress.
 */
export function useDeleteProjectGoal(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteProjectGoalVariables>,
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
      goalId,
    }: DeleteProjectGoalVariables): Promise<void> => {
      await fetchGoal.delete(projectId, goalId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateGoalMutationCaches(queryClient, variables.projectId);
      toast.success("Goal deleted");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to delete goal"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  CreateProjectGoalRequest,
  CreateProjectGoalResponse,
  Objective,
  ProjectGoal,
  ProjectGoalPriority,
  ProjectGoalResponse,
  ProjectGoalsListResponse,
  ProjectGoalWriteRequest,
  UpdateProjectGoalRequest,
  UpdateProjectGoalResponse,
} from "@/lib/api/services/fetchGoal";
