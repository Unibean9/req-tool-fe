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
  fetchRule,
  type CreateProjectRuleRequest,
  type CreateProjectRuleResponse,
  type ProjectRule,
  type ProjectRulesListResponse,
  type UpdateProjectRuleRequest,
  type UpdateProjectRuleResponse,
} from "@/lib/api/services/fetchRule";
import {
  projectRulesQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";

type CreateProjectRuleVariables = {
  projectId: string;
  body: CreateProjectRuleRequest;
};

type UpdateProjectRuleVariables = {
  projectId: string;
  ruleId: string;
  body: UpdateProjectRuleRequest;
};

type DeleteProjectRuleVariables = {
  projectId: string;
  ruleId: string;
};

function invalidateRuleMutationCaches(
  queryClient: QueryClient,
  projectId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectRulesQueryKey(projectId),
  });
  void queryClient.invalidateQueries({
    queryKey: projectSetupProgressQueryKey(projectId),
  });
}

/**
 * GET /api/v1/projects/{project_id}/rules — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectRules(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ProjectRulesListResponse, Error, ProjectRule[]>({
    queryKey: projectRulesQueryKey(pid),
    queryFn: async () => fetchRule.list(pid),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectRulesFull(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectRulesQueryKey(pid),
    queryFn: () => fetchRule.list(pid),
    enabled,
  });
}

/**
 * POST /api/v1/projects/{project_id}/rules
 * Invalidate danh sách rules + setup progress.
 */
export function useCreateProjectRule(
  options?: Omit<
    UseMutationOptions<
      CreateProjectRuleResponse,
      Error,
      CreateProjectRuleVariables
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
    }: CreateProjectRuleVariables): Promise<CreateProjectRuleResponse> => {
      return fetchRule.create(projectId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateRuleMutationCaches(queryClient, variables.projectId);
      toast.success("Đã tạo rule");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Tạo rule thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/{project_id}/rules/{rule_id}
 * Invalidate danh sách rules + setup progress.
 */
export function useUpdateProjectRule(
  options?: Omit<
    UseMutationOptions<
      UpdateProjectRuleResponse,
      Error,
      UpdateProjectRuleVariables
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
      ruleId,
      body,
    }: UpdateProjectRuleVariables): Promise<UpdateProjectRuleResponse> => {
      return fetchRule.update(projectId, ruleId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateRuleMutationCaches(queryClient, variables.projectId);
      toast.success("Đã cập nhật rule");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Cập nhật rule thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/{project_id}/rules/{rule_id}
 * Invalidate danh sách rules + setup progress.
 */
export function useDeleteProjectRule(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteProjectRuleVariables>,
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
      ruleId,
    }: DeleteProjectRuleVariables): Promise<void> => {
      await fetchRule.delete(projectId, ruleId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateRuleMutationCaches(queryClient, variables.projectId);
      toast.success("Đã xóa rule");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Xóa rule thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  CreateProjectRuleRequest,
  CreateProjectRuleResponse,
  ProjectRule,
  ProjectRuleResponse,
  ProjectRulesListResponse,
  ProjectRuleType,
  ProjectRuleWriteRequest,
  UpdateProjectRuleRequest,
  UpdateProjectRuleResponse,
} from "@/lib/api/services/fetchRule";

export { PROJECT_RULE_TYPES } from "@/lib/api/services/fetchRule";
