"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchStory,
  type UpdateUserStoryRequest,
  type UpdateUserStoryResponse,
} from "@/lib/api/services/fetchStory";
import { invalidateActorWorkspaceQueries } from "@/lib/query/invalidateActorWorkspace";
import { mergeActorRequirementModelCache } from "@/lib/query/patchActorRequirementModelCache";

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
      const result = await fetchStory.update(projectId, userStoryId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Cập nhật user story thất bại");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
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
  UpdateUserStoryAcceptanceCriterion,
  UpdateUserStoryRequest,
  UpdateUserStoryResponse,
} from "@/lib/api/services/fetchStory";

export type {
  ActorEpicPriority,
  ActorEpicStatus,
  ActorUserStory,
} from "@/lib/api/services/fetchActor";
