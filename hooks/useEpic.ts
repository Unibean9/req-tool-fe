"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchEpic,
  type CreateEpicFeatureRequest,
  type CreateEpicFeatureResponse,
  type UpdateEpicRequest,
  type UpdateEpicResponse,
} from "@/lib/api/services/fetchEpic";
import { invalidateActorWorkspaceQueries } from "@/lib/query/invalidateActorWorkspace";
import { invalidateProjectFeatureListCaches } from "@/lib/query/invalidateProjectFeatures";
import { mergeActorRequirementModelCache } from "@/lib/query/patchActorRequirementModelCache";

type UpdateEpicVariables = {
  projectId: string;
  actorId: string;
  epicId: string;
  body: UpdateEpicRequest;
};

type DeleteEpicVariables = {
  projectId: string;
  actorId: string;
  epicId: string;
};

type CreateEpicFeatureVariables = {
  projectId: string;
  actorId: string;
  epicId: string;
  body: CreateEpicFeatureRequest;
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
 * PATCH /api/v1/projects/:project_id/epics/:epic_id
 */
export type UseUpdateEpicOptions = Omit<
  UseMutationOptions<UpdateEpicResponse, Error, UpdateEpicVariables>,
  "mutationFn"
> &
  ActorWorkspaceInvalidateOptions;

export function useUpdateEpic(options?: UseUpdateEpicOptions) {
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
      epicId,
      body,
    }: UpdateEpicVariables): Promise<UpdateEpicResponse> => {
      const result = await fetchEpic.update(projectId, epicId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to update epic");
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
          { epic: data.data }
        );
      }
      if (showSuccessToast) {
        toast.success("Epic updated");
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to update epic"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/:project_id/epics/:epic_id
 */
export type UseDeleteEpicOptions = Omit<
  UseMutationOptions<void, Error, DeleteEpicVariables>,
  "mutationFn"
> &
  ActorWorkspaceInvalidateOptions;

export function useDeleteEpic(options?: UseDeleteEpicOptions) {
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
      epicId,
    }: DeleteEpicVariables): Promise<void> => {
      await fetchEpic.delete(projectId, epicId);
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
        toast.success("Epic deleted");
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to delete epic"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * POST /api/v1/projects/:project_id/epics/:epic_id/features
 */
export type UseCreateEpicFeatureOptions = Omit<
  UseMutationOptions<
    CreateEpicFeatureResponse,
    Error,
    CreateEpicFeatureVariables
  >,
  "mutationFn"
> &
  ActorWorkspaceInvalidateOptions;

export function useCreateEpicFeature(options?: UseCreateEpicFeatureOptions) {
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
      epicId,
      body,
    }: CreateEpicFeatureVariables): Promise<CreateEpicFeatureResponse> => {
      const result = await fetchEpic.createFeature(projectId, epicId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to create feature");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateProjectFeatureListCaches(queryClient, variables.projectId);
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
        toast.success("Feature created");
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to create feature"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  CreateEpicFeatureRequest,
  CreateEpicFeatureResponse,
  UpdateEpicRequest,
  UpdateEpicResponse,
} from "@/lib/api/services/fetchEpic";

export type {
  ActorEpic,
  ActorEpicPriority,
  ActorEpicStatus,
  ActorFeature,
} from "@/lib/api/services/fetchActor";
