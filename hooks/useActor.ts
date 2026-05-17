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
  fetchActor,
  type CreateActorEpicRequest,
  type CreateActorEpicResponse,
  type CanvasLayoutPayload,
  type GetCanvasLayoutResponse,
  type SaveCanvasLayoutRequest,
  type CreateProjectActorRequest,
  type CreateProjectActorResponse,
  type ProjectActor,
  type ProjectActorsListResponse,
  type RequirementModelPayload,
  type RequirementModelResponse,
  type UpdateProjectActorRequest,
  type UpdateProjectActorResponse,
} from "@/lib/api/services/fetchActor";
import { invalidateActorWorkspaceQueries } from "@/lib/query/invalidateActorWorkspace";
import { mergeActorRequirementModelCache } from "@/lib/query/patchActorRequirementModelCache";
import {
  actorCanvasLayoutQueryKey,
  actorRequirementModelQueryKey,
  projectActorsQueryKey,
} from "@/lib/query/query-keys";

type CreateProjectActorVariables = {
  projectId: string;
  body: CreateProjectActorRequest;
};

type UpdateProjectActorVariables = {
  projectId: string;
  actorId: string;
  body: UpdateProjectActorRequest;
};

type DeleteProjectActorVariables = { projectId: string; actorId: string };

type CreateActorEpicVariables = {
  projectId: string;
  actorId: string;
  body: CreateActorEpicRequest;
};

type SaveCanvasLayoutVariables = {
  projectId: string;
  actorId: string;
  body: SaveCanvasLayoutRequest;
};

/**
 * GET /api/v1/projects/:project_id/actors — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectActors(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ProjectActorsListResponse, Error, ProjectActor[]>({
    queryKey: projectActorsQueryKey(pid),
    queryFn: async () => fetchActor.list(pid),
    select: (res) => res.data,
    enabled,
  });
}

export function useProjectActorsFull(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectActorsQueryKey(pid),
    queryFn: () => fetchActor.list(pid),
    enabled,
  });
}

/**
 * GET /api/v1/projects/:project_id/actors/:actor_id/requirement-model
 */
export function useActorRequirementModel(
  projectId: string | null | undefined,
  actorId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const aid = actorId?.trim() ?? "";
  const enabled = Boolean(pid && aid) && (options?.enabled ?? true);

  return useCachedGet<
    RequirementModelResponse,
    Error,
    RequirementModelPayload
  >({
    queryKey: actorRequirementModelQueryKey(pid, aid),
    queryFn: async () => {
      const res = await fetchActor.getRequirementModel(pid, aid);
      if (!res.success) {
        throw new Error(res.message ?? "Không tải được mô hình yêu cầu");
      }
      return res;
    },
    select: (res) => res.data,
    enabled,
  });
}

export function useActorRequirementModelFull(
  projectId: string | null | undefined,
  actorId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const aid = actorId?.trim() ?? "";
  const enabled = Boolean(pid && aid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: actorRequirementModelQueryKey(pid, aid),
    queryFn: () => fetchActor.getRequirementModel(pid, aid),
    enabled,
  });
}

/**
 * POST /api/v1/projects/:project_id/actors — invalidate cache actors theo dự án.
 */
export function useCreateProjectActor(
  options?: Omit<
    UseMutationOptions<
      CreateProjectActorResponse,
      Error,
      CreateProjectActorVariables
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
    }: CreateProjectActorVariables): Promise<CreateProjectActorResponse> => {
      const result = await fetchActor.create(projectId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Tạo actor thất bại");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: projectActorsQueryKey(variables.projectId),
      });
      toast.success("Đã tạo actor");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Tạo actor thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/:project_id/actors/:actor_id — invalidate danh sách actors.
 */
export function useUpdateProjectActor(
  options?: Omit<
    UseMutationOptions<
      UpdateProjectActorResponse,
      Error,
      UpdateProjectActorVariables
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
      actorId,
      body,
    }: UpdateProjectActorVariables): Promise<UpdateProjectActorResponse> => {
      const result = await fetchActor.update(projectId, actorId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Cập nhật actor thất bại");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: projectActorsQueryKey(variables.projectId),
      });
      toast.success("Đã cập nhật actor");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Cập nhật actor thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/:project_id/actors/:actor_id — invalidate danh sách actors.
 */
export function useDeleteProjectActor(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteProjectActorVariables>,
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
      actorId,
    }: DeleteProjectActorVariables): Promise<void> => {
      await fetchActor.delete(projectId, actorId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: projectActorsQueryKey(variables.projectId),
      });
      toast.success("Đã xóa actor");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Xóa actor thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * POST /api/v1/projects/:project_id/actors/:actor_id/epics
 */
export type UseCreateActorEpicOptions = Omit<
  UseMutationOptions<CreateActorEpicResponse, Error, CreateActorEpicVariables>,
  "mutationFn"
> & {
  /** Mặc định true — tắt khi merge epic vào canvas local để giữ layout. */
  invalidateRequirementModel?: boolean;
  /**
   * Mặc định theo `invalidateRequirementModel` — tắt khi chỉ merge node local.
   */
  invalidateCanvasLayout?: boolean;
  /** Mặc định true */
  showSuccessToast?: boolean;
};

export function useCreateActorEpic(options?: UseCreateActorEpicOptions) {
  const queryClient = useQueryClient();
  const {
    invalidateRequirementModel = true,
    invalidateCanvasLayout,
    showSuccessToast = true,
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = options ?? {};

  const shouldInvalidateCanvasLayout =
    invalidateCanvasLayout ?? invalidateRequirementModel;

  return useMutation({
    ...rest,
    mutationFn: async ({
      projectId,
      actorId,
      body,
    }: CreateActorEpicVariables): Promise<CreateActorEpicResponse> => {
      const result = await fetchActor.createEpic(projectId, actorId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Tạo epic thất bại");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      if (invalidateRequirementModel || shouldInvalidateCanvasLayout) {
        invalidateActorWorkspaceQueries(
          queryClient,
          variables.projectId,
          variables.actorId,
          {
            requirementModel: invalidateRequirementModel,
            canvasLayout: shouldInvalidateCanvasLayout,
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
        toast.success("Đã tạo epic");
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Tạo epic thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * GET /api/v1/projects/:project_id/actors/:actor_id/canvas-layout
 */
export function useActorCanvasLayout(
  projectId: string | null | undefined,
  actorId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const aid = actorId?.trim() ?? "";
  const enabled = Boolean(pid && aid) && (options?.enabled ?? true);

  return useCachedGet<GetCanvasLayoutResponse, Error, CanvasLayoutPayload>({
    queryKey: actorCanvasLayoutQueryKey(pid, aid),
    queryFn: async () => {
      const res = await fetchActor.getCanvasLayout(pid, aid);
      if (!res.success) {
        throw new Error(res.message ?? "Không tải được layout canvas");
      }
      return res;
    },
    select: (res) => res.data,
    enabled,
  });
}

export function useActorCanvasLayoutFull(
  projectId: string | null | undefined,
  actorId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const aid = actorId?.trim() ?? "";
  const enabled = Boolean(pid && aid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: actorCanvasLayoutQueryKey(pid, aid),
    queryFn: () => fetchActor.getCanvasLayout(pid, aid),
    enabled,
  });
}

/**
 * PUT /api/v1/projects/:project_id/actors/:actor_id/canvas-layout
 */
export function useSaveActorCanvasLayout(
  options?: Omit<
    UseMutationOptions<void, Error, SaveCanvasLayoutVariables>,
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
      actorId,
      body,
    }: SaveCanvasLayoutVariables): Promise<void> => {
      await fetchActor.saveCanvasLayout(projectId, actorId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: actorCanvasLayoutQueryKey(
          variables.projectId,
          variables.actorId
        ),
      });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code: unknown }).code === "number"
          ? (error as { code: number }).code
          : undefined;
      // Backend có thể trả 501 khi route chưa implement — không spam toast.
      if (code !== 501) {
        toast.error(getApiErrorMessage(error, "Lưu layout thất bại"));
      }
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  ActorAcceptanceCriterion,
  ActorEpic,
  ActorEpicPriority,
  ActorEpicStatus,
  ActorFeature,
  ActorUserStory,
  CanvasLayoutNode,
  CanvasLayoutNodeKind,
  CanvasLayoutPayload,
  GetCanvasLayoutResponse,
  CreateActorEpicRequest,
  CreateActorEpicResponse,
  CreateProjectActorRequest,
  CreateProjectActorResponse,
  ProjectActor,
  ProjectActorsListResponse,
  RequirementModelActor,
  RequirementModelPayload,
  RequirementModelResponse,
  SaveCanvasLayoutRequest,
  UpdateProjectActorRequest,
  UpdateProjectActorResponse,
} from "@/lib/api/services/fetchActor";

export { invalidateActorWorkspaceQueries } from "@/lib/query/invalidateActorWorkspace";
export type { InvalidateActorWorkspaceOptions } from "@/lib/query/invalidateActorWorkspace";
