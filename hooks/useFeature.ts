"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchFeature,
  type CreateFeatureUserStoryRequest,
  type CreateFeatureUserStoryResponse,
  type UpdateFeatureRequest,
  type UpdateFeatureResponse,
} from "@/lib/api/services/fetchFeature";
import { invalidateActorWorkspaceQueries } from "@/lib/query/invalidateActorWorkspace";
import { mergeActorRequirementModelCache } from "@/lib/query/patchActorRequirementModelCache";

type UpdateFeatureVariables = {
  projectId: string;
  actorId: string;
  featureId: string;
  body: UpdateFeatureRequest;
};

type DeleteFeatureVariables = {
  projectId: string;
  actorId: string;
  featureId: string;
};

type CreateFeatureUserStoryVariables = {
  projectId: string;
  actorId: string;
  featureId: string;
  body: CreateFeatureUserStoryRequest;
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
 * PATCH /api/v1/projects/:project_id/features/:feature_id
 */
export type UseUpdateFeatureOptions = Omit<
  UseMutationOptions<UpdateFeatureResponse, Error, UpdateFeatureVariables>,
  "mutationFn"
> &
  ActorWorkspaceInvalidateOptions;

export function useUpdateFeature(options?: UseUpdateFeatureOptions) {
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
      featureId,
      body,
    }: UpdateFeatureVariables): Promise<UpdateFeatureResponse> => {
      const result = await fetchFeature.update(projectId, featureId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Cập nhật feature thất bại");
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
          { feature: data.data }
        );
      }
      if (showSuccessToast) {
        toast.success("Đã cập nhật feature");
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Cập nhật feature thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/:project_id/features/:feature_id
 */
export type UseDeleteFeatureOptions = Omit<
  UseMutationOptions<void, Error, DeleteFeatureVariables>,
  "mutationFn"
> &
  ActorWorkspaceInvalidateOptions;

export function useDeleteFeature(options?: UseDeleteFeatureOptions) {
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
      featureId,
    }: DeleteFeatureVariables): Promise<void> => {
      await fetchFeature.delete(projectId, featureId);
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
        toast.success("Đã xóa feature");
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Xóa feature thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * POST /api/v1/projects/:project_id/features/:feature_id/user-stories
 */
export type UseCreateFeatureUserStoryOptions = Omit<
  UseMutationOptions<
    CreateFeatureUserStoryResponse,
    Error,
    CreateFeatureUserStoryVariables
  >,
  "mutationFn"
> &
  ActorWorkspaceInvalidateOptions;

export function useCreateFeatureUserStory(
  options?: UseCreateFeatureUserStoryOptions
) {
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
      featureId,
      body,
    }: CreateFeatureUserStoryVariables): Promise<CreateFeatureUserStoryResponse> => {
      const result = await fetchFeature.createUserStory(
        projectId,
        featureId,
        body
      );
      if (!result.success) {
        throw new Error(result.message ?? "Tạo user story thất bại");
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
        toast.success("Đã tạo user story");
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Tạo user story thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  CreateFeatureUserStoryRequest,
  CreateFeatureUserStoryResponse,
  UpdateFeatureRequest,
  UpdateFeatureResponse,
} from "@/lib/api/services/fetchFeature";

export type {
  ActorEpicPriority,
  ActorEpicStatus,
  ActorFeature,
  ActorUserStory,
} from "@/lib/api/services/fetchActor";
