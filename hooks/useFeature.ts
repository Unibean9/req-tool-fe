"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useCallback, type UIEvent } from "react";
import { toast } from "sonner";

import { useCachedGet } from "@/hooks/useCachedGet";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import type { ActorFeature } from "@/lib/api/services/fetchActor";
import {
  fetchFeature,
  type CreateFeatureUserStoryRequest,
  type CreateFeatureUserStoryResponse,
  type ListProjectFeaturesParams,
  type ProjectFeatureDetailResponse,
  type ProjectFeaturesListResponse,
  type UpdateFeatureRequest,
  type UpdateFeatureResponse,
} from "@/lib/api/services/fetchFeature";
import { invalidateActorWorkspaceQueries } from "@/lib/query/invalidateActorWorkspace";
import { invalidateProjectFeatureListCaches } from "@/lib/query/invalidateProjectFeatures";
import { mergeActorRequirementModelCache } from "@/lib/query/patchActorRequirementModelCache";
import { DEFAULT_QUERY_GC_MS, DEFAULT_QUERY_STALE_MS } from "@/lib/query/defaults";
import {
  projectFeatureQueryKey,
  projectFeaturesInfiniteQueryKey,
  projectFeaturesQueryKey,
} from "@/lib/query/query-keys";

const DEFAULT_PROJECT_FEATURES_LIMIT = 20;

/** Bộ filter list feature (không gồm `limit` / `offset`). */
export type ProjectFeaturesInfiniteFilters = Pick<
  ListProjectFeaturesParams,
  "epicId" | "status"
>;

/** Một trang trong `useProjectFeaturesInfinityScroll`. */
export interface ProjectFeaturesInfinitePage {
  offset: number;
  limit: number;
  items: ActorFeature[];
}

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

function invalidateFeatureMutationCaches(
  queryClient: QueryClient,
  projectId: string,
  featureId: string
) {
  invalidateProjectFeatureListCaches(queryClient, projectId);
  void queryClient.invalidateQueries({
    queryKey: projectFeatureQueryKey(projectId, featureId),
  });
}

/**
 * GET /api/v1/projects/{project_id}/features — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectFeatures(
  projectId: string | null | undefined,
  params?: ListProjectFeaturesParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ProjectFeaturesListResponse, Error, ActorFeature[]>({
    queryKey: projectFeaturesQueryKey(pid, params),
    queryFn: async () => fetchFeature.list(pid, params),
    select: (res) => res.data,
    enabled,
  });
}

/**
 * GET /api/v1/projects/{project_id}/features với `limit` / `offset` — infinite scroll + `onScrollToLoadMore`.
 */
export function useProjectFeaturesInfinityScroll(
  projectId: string | null | undefined,
  filters?: ProjectFeaturesInfiniteFilters,
  options?: {
    limit?: number;
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    scrollOffset?: number;
  }
) {
  const pid = projectId?.trim() ?? "";
  const limit = options?.limit ?? DEFAULT_PROJECT_FEATURES_LIMIT;
  const epicId = filters?.epicId?.trim() ?? "";
  const status = filters?.status;
  const enabled = Boolean(pid) && (options?.enabled ?? true);
  const scrollOffset = options?.scrollOffset ?? 16;
  const staleTime = options?.staleTime ?? DEFAULT_QUERY_STALE_MS;
  const gcTime = options?.gcTime ?? DEFAULT_QUERY_GC_MS;
  const refetchOnWindowFocus = options?.refetchOnWindowFocus ?? false;

  const infiniteQuery = useInfiniteQuery({
    queryKey: projectFeaturesInfiniteQueryKey(pid, {
      epicId: epicId || undefined,
      status,
      limit,
    }),
    initialPageParam: 0,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    queryFn: async ({ pageParam }): Promise<ProjectFeaturesInfinitePage> => {
      const offset = pageParam;
      const res = await fetchFeature.list(pid, {
        ...(epicId ? { epicId } : {}),
        ...(status ? { status } : {}),
        limit,
        offset,
      });
      if (!res.success) {
        throw new Error(res.message ?? "Không tải được danh sách feature");
      }
      return { offset, limit, items: res.data };
    },
    getNextPageParam: (lastPage) =>
      lastPage.items.length < lastPage.limit
        ? undefined
        : lastPage.offset + lastPage.limit,
  });

  const onScrollToLoadMore = useCallback(
    (event: UIEvent<HTMLElement>) => {
      const element = event.currentTarget;
      const reachedBottom =
        element.scrollTop + element.clientHeight >=
        element.scrollHeight - scrollOffset;

      if (
        reachedBottom &&
        infiniteQuery.hasNextPage &&
        !infiniteQuery.isFetchingNextPage
      ) {
        void infiniteQuery.fetchNextPage();
      }
    },
    [infiniteQuery, scrollOffset]
  );

  return {
    ...infiniteQuery,
    onScrollToLoadMore,
  };
}

export function flattenProjectFeaturesInfinitePages(
  pages: ProjectFeaturesInfinitePage[] | undefined
): ActorFeature[] {
  return pages?.flatMap((p) => p.items) ?? [];
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectFeaturesFull(
  projectId: string | null | undefined,
  params?: ListProjectFeaturesParams,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectFeaturesQueryKey(pid, params),
    queryFn: () => fetchFeature.list(pid, params),
    enabled,
  });
}

/**
 * GET /api/v1/projects/{project_id}/features/{feature_id}
 */
export function useProjectFeature(
  projectId: string | null | undefined,
  featureId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const fid = featureId?.trim() ?? "";
  const enabled = Boolean(pid) && Boolean(fid) && (options?.enabled ?? true);

  return useCachedGet<ProjectFeatureDetailResponse, Error, ActorFeature>({
    queryKey: projectFeatureQueryKey(pid, fid),
    queryFn: async () => fetchFeature.get(pid, fid),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET detail; trả full envelope `{ success, data, message }`. */
export function useProjectFeatureFull(
  projectId: string | null | undefined,
  featureId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const fid = featureId?.trim() ?? "";
  const enabled = Boolean(pid) && Boolean(fid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectFeatureQueryKey(pid, fid),
    queryFn: () => fetchFeature.get(pid, fid),
    enabled,
  });
}

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
      return fetchFeature.update(projectId, featureId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateFeatureMutationCaches(
        queryClient,
        variables.projectId,
        variables.featureId
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
      invalidateFeatureMutationCaches(
        queryClient,
        variables.projectId,
        variables.featureId
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
      return fetchFeature.createUserStory(projectId, featureId, body);
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
  FeatureStatus,
  ListProjectFeaturesParams,
  ProjectFeatureDetailResponse,
  ProjectFeaturesListResponse,
  UpdateFeatureRequest,
  UpdateFeatureResponse,
} from "@/lib/api/services/fetchFeature";

export { FEATURE_STATUSES } from "@/lib/api/services/fetchFeature";

export type {
  ActorEpicPriority,
  ActorEpicStatus,
  ActorFeature,
  ActorUserStory,
} from "@/lib/api/services/fetchActor";
