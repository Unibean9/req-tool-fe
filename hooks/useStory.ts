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
import type { ActorUserStory } from "@/lib/api/services/fetchActor";
import {
  fetchStory,
  type ListProjectStoriesParams,
  type ProjectStoriesListResponse,
  type ProjectUserStoryDetailResponse,
  type UpdateUserStoryRequest,
  type UpdateUserStoryResponse,
} from "@/lib/api/services/fetchStory";
import { invalidateActorWorkspaceQueries } from "@/lib/query/invalidateActorWorkspace";
import { mergeActorRequirementModelCache } from "@/lib/query/patchActorRequirementModelCache";
import {
  projectStoriesQueryKey,
  projectStoryQueryKey,
} from "@/lib/query/query-keys";

const PROJECTS_ROOT = ["projects"] as const;

type UpdateUserStoryVariables = {
  projectId: string;
  actorId: string;
  userStoryId: string;
  body: UpdateUserStoryRequest;
};

type DeleteUserStoryVariables = {
  projectId: string;
  actorId: string;
  userStoryId: string;
};

type ActorWorkspaceInvalidateOptions = {
  /** Mặc định true */
  invalidateRequirementModel?: boolean;
  /** Mặc định true */
  invalidateCanvasLayout?: boolean;
  /** Mặc định true */
  showSuccessToast?: boolean;
};

function invalidateProjectStoryListCaches(
  queryClient: QueryClient,
  projectId: string
) {
  void queryClient.invalidateQueries({
    queryKey: [...PROJECTS_ROOT, "stories", projectId],
  });
}

function invalidateUserStoryMutationCaches(
  queryClient: QueryClient,
  projectId: string,
  userStoryId: string
) {
  invalidateProjectStoryListCaches(queryClient, projectId);
  void queryClient.invalidateQueries({
    queryKey: projectStoryQueryKey(projectId, userStoryId),
  });
}

/**
 * GET /api/v1/projects/{project_id}/stories — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectStories(
  projectId: string | null | undefined,
  params?: ListProjectStoriesParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ProjectStoriesListResponse, Error, ActorUserStory[]>({
    queryKey: projectStoriesQueryKey(pid, params),
    queryFn: async () => fetchStory.list(pid, params),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectStoriesFull(
  projectId: string | null | undefined,
  params?: ListProjectStoriesParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectStoriesQueryKey(pid, params),
    queryFn: () => fetchStory.list(pid, params),
    enabled,
  });
}

/**
 * GET /api/v1/projects/{project_id}/stories/{user_story_id}
 */
export function useProjectStory(
  projectId: string | null | undefined,
  userStoryId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const sid = userStoryId?.trim() ?? "";
  const enabled = Boolean(pid) && Boolean(sid) && (options?.enabled ?? true);

  return useCachedGet<ProjectUserStoryDetailResponse, Error, ActorUserStory>({
    queryKey: projectStoryQueryKey(pid, sid),
    queryFn: async () => fetchStory.get(pid, sid),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET detail; trả full envelope `{ success, data, message }`. */
export function useProjectStoryFull(
  projectId: string | null | undefined,
  userStoryId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const sid = userStoryId?.trim() ?? "";
  const enabled = Boolean(pid) && Boolean(sid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectStoryQueryKey(pid, sid),
    queryFn: () => fetchStory.get(pid, sid),
    enabled,
  });
}

/**
 * PATCH /api/v1/projects/:project_id/user-stories/:user_story_id
 */
export type UseUpdateUserStoryOptions = Omit<
  UseMutationOptions<UpdateUserStoryResponse, Error, UpdateUserStoryVariables>,
  "mutationFn"
> &
  ActorWorkspaceInvalidateOptions;

export function useUpdateUserStory(options?: UseUpdateUserStoryOptions) {
  const queryClient = useQueryClient();
  const {
    invalidateRequirementModel = true,
    invalidateCanvasLayout = true,
    showSuccessToast = true,
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      projectId,
      userStoryId,
      body,
    }: UpdateUserStoryVariables): Promise<UpdateUserStoryResponse> => {
      return fetchStory.update(projectId, userStoryId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateUserStoryMutationCaches(
        queryClient,
        variables.projectId,
        variables.userStoryId
      );
      if (invalidateRequirementModel || invalidateCanvasLayout) {
        invalidateActorWorkspaceQueries(
          queryClient,
          variables.projectId,
          variables.actorId,
          {
            requirementModel: invalidateRequirementModel,
            canvasLayout: invalidateCanvasLayout,
          }
        );
      } else {
        mergeActorRequirementModelCache(
          queryClient,
          variables.projectId,
          variables.actorId,
          { userStory: data.data }
        );
      }
      if (showSuccessToast) {
        toast.success("Đã cập nhật user story");
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Cập nhật user story thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/:project_id/user-stories/:user_story_id
 */
export type UseDeleteUserStoryOptions = Omit<
  UseMutationOptions<void, Error, DeleteUserStoryVariables>,
  "mutationFn"
> &
  ActorWorkspaceInvalidateOptions;

export function useDeleteUserStory(options?: UseDeleteUserStoryOptions) {
  const queryClient = useQueryClient();
  const {
    invalidateRequirementModel = true,
    invalidateCanvasLayout = true,
    showSuccessToast = true,
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      projectId,
      userStoryId,
    }: DeleteUserStoryVariables): Promise<void> => {
      await fetchStory.delete(projectId, userStoryId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateUserStoryMutationCaches(
        queryClient,
        variables.projectId,
        variables.userStoryId
      );
      if (invalidateRequirementModel || invalidateCanvasLayout) {
        invalidateActorWorkspaceQueries(
          queryClient,
          variables.projectId,
          variables.actorId,
          {
            requirementModel: invalidateRequirementModel,
            canvasLayout: invalidateCanvasLayout,
          }
        );
      }
      if (showSuccessToast) {
        toast.success("Đã xóa user story");
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Xóa user story thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  FeatureStatus,
  ListProjectStoriesParams,
  ProjectStoriesListResponse,
  ProjectUserStoryDetailResponse,
  UpdateUserStoryAcceptanceCriterion,
  UpdateUserStoryRequest,
  UpdateUserStoryResponse,
} from "@/lib/api/services/fetchStory";

export type {
  ActorEpicPriority,
  ActorUserStory,
} from "@/lib/api/services/fetchActor";
