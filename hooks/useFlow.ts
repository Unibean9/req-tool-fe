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
  fetchFlow,
  type CreateProjectFlowActionItem,
  type CreateProjectFlowRequest,
  type CreateProjectFlowResponse,
  type PatchProjectFlowActionItem,
  type ProjectFlow,
  type ProjectFlowActionsResponse,
  type ProjectFlowResponse,
  type ProjectFlowsListResponse,
  type ProjectFlowSwimlane,
  type ListProjectFlowTemplatesParams,
  type ProjectFlowTemplate,
  type ProjectFlowTemplateStep,
  type ProjectFlowTemplatesListResponse,
  type UpdateProjectFlowRequest,
  type UpdateProjectFlowResponse,
} from "@/lib/api/services/fetchFlow";
import {
  projectFlowQueryKey,
  projectFlowTemplatesQueryKey,
  projectFlowsQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";

/** Ghi `swimlane` vào cache GET flow (chi tiết + list), không refetch. */
export function patchProjectFlowSwimlaneInCaches(
  queryClient: QueryClient,
  projectId: string,
  flowId: string,
  nextSwimlane: ProjectFlowSwimlane
) {
  queryClient.setQueryData<ProjectFlowResponse>(
    projectFlowQueryKey(projectId, flowId),
    (old) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: {
          ...old.data,
          swimlane: nextSwimlane,
        },
      };
    }
  );
  queryClient.setQueryData<ProjectFlowsListResponse>(
    projectFlowsQueryKey(projectId),
    (old) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: old.data.map((f) =>
          f.id === flowId ? { ...f, swimlane: nextSwimlane } : f
        ),
      };
    }
  );
}

/** Sau PUT swimlane — đồng bộ full flow từ BE (`updated_at`, actions, swimlane). */
export function patchProjectFlowAfterSwimlanePut(
  queryClient: QueryClient,
  projectId: string,
  flowResponse: ProjectFlowResponse
) {
  const flow = flowResponse.data;
  queryClient.setQueryData<ProjectFlowResponse>(
    projectFlowQueryKey(projectId, flow.id),
    flowResponse
  );
  queryClient.setQueryData<ProjectFlowsListResponse>(
    projectFlowsQueryKey(projectId),
    (old) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: old.data.map((f) => (f.id === flow.id ? flow : f)),
      };
    }
  );
}

type CreateProjectFlowVariables = {
  projectId: string;
  body: CreateProjectFlowRequest;
};

type UpdateProjectFlowVariables = {
  projectId: string;
  flowId: string;
  body: UpdateProjectFlowRequest;
};

type DeleteProjectFlowVariables = {
  projectId: string;
  flowId: string;
};

type UpdateProjectFlowSwimlaneVariables = {
  projectId: string;
  flowId: string;
  diagram: ProjectFlowSwimlane;
};

type PostProjectFlowActionsVariables = {
  projectId: string;
  flowId: string;
  items: CreateProjectFlowActionItem[];
};

type PatchProjectFlowActionsVariables = {
  projectId: string;
  flowId: string;
  items: PatchProjectFlowActionItem[];
};

function invalidateFlowMutationCaches(
  queryClient: QueryClient,
  projectId: string,
  flowId?: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectFlowsQueryKey(projectId),
  });
  void queryClient.invalidateQueries({
    queryKey: projectSetupProgressQueryKey(projectId),
  });
  if (flowId) {
    void queryClient.invalidateQueries({
      queryKey: projectFlowQueryKey(projectId, flowId),
    });
  }
}

/**
 * GET /api/v1/projects/{project_id}/flows — thiếu `projectId` thì `enabled: false`.
 */
export function useProjectFlows(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ProjectFlowsListResponse, Error, ProjectFlow[]>({
    queryKey: projectFlowsQueryKey(pid),
    queryFn: async () => fetchFlow.list(pid),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useProjectFlowsFull(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectFlowsQueryKey(pid),
    queryFn: () => fetchFlow.list(pid),
    enabled,
  });
}

/**
 * GET /api/v1/projects/{project_id}/flows/{flow_id} — đầy đủ gồm swimlane.
 */
export function useProjectFlow(
  projectId: string | null | undefined,
  flowId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const fid = flowId?.trim() ?? "";
  const enabled = Boolean(pid && fid) && (options?.enabled ?? true);

  return useCachedGet<ProjectFlowResponse, Error, ProjectFlow>({
    queryKey: projectFlowQueryKey(pid, fid),
    queryFn: async () => fetchFlow.get(pid, fid),
    select: (res) => res.data,
    enabled,
  });
}

export function useProjectFlowFull(
  projectId: string | null | undefined,
  flowId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const fid = flowId?.trim() ?? "";
  const enabled = Boolean(pid && fid) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: projectFlowQueryKey(pid, fid),
    queryFn: () => fetchFlow.get(pid, fid),
    enabled,
  });
}

/**
 * GET /api/v1/projects/{project_id}/flows/{flow_id}/templates
 *
 * `data[]`: `{ flowId, code, name, actors, steps }` — `steps[]` gồm `rules`.
 */
export function useProjectFlowTemplates(
  projectId: ListProjectFlowTemplatesParams["projectId"] | null | undefined,
  flowId: ListProjectFlowTemplatesParams["flowId"] | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const fid = flowId?.trim() ?? "";
  const enabled = Boolean(pid && fid) && (options?.enabled ?? true);

  return useCachedGet<
    ProjectFlowTemplatesListResponse,
    Error,
    ProjectFlowTemplate[]
  >({
    queryKey: projectFlowTemplatesQueryKey(pid, fid),
    queryFn: () => fetchFlow.listTemplates(pid, fid),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET templates; trả envelope `{ success, data, message }`. */
export function useProjectFlowTemplatesFull(
  projectId: ListProjectFlowTemplatesParams["projectId"] | null | undefined,
  flowId: ListProjectFlowTemplatesParams["flowId"] | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const fid = flowId?.trim() ?? "";
  const enabled = Boolean(pid && fid) && (options?.enabled ?? true);

  return useCachedGet<ProjectFlowTemplatesListResponse>({
    queryKey: projectFlowTemplatesQueryKey(pid, fid),
    queryFn: () => fetchFlow.listTemplates(pid, fid),
    enabled,
  });
}

export type {
  ListProjectFlowTemplatesParams,
  ProjectFlowTemplate,
  ProjectFlowTemplateStep,
  ProjectFlowTemplatesListResponse,
};

/**
 * POST /api/v1/projects/{project_id}/flows
 */
export function useCreateProjectFlow(
  options?: Omit<
    UseMutationOptions<
      CreateProjectFlowResponse,
      Error,
      CreateProjectFlowVariables
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
    }: CreateProjectFlowVariables): Promise<CreateProjectFlowResponse> => {
      return fetchFlow.create(projectId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateFlowMutationCaches(queryClient, variables.projectId);
      toast.success("Đã tạo flow");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Tạo flow thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/{project_id}/flows/{flow_id}
 */
export function useUpdateProjectFlow(
  options?: Omit<
    UseMutationOptions<
      UpdateProjectFlowResponse,
      Error,
      UpdateProjectFlowVariables
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
      flowId,
      body,
    }: UpdateProjectFlowVariables): Promise<UpdateProjectFlowResponse> => {
      return fetchFlow.update(projectId, flowId, body);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateFlowMutationCaches(
        queryClient,
        variables.projectId,
        variables.flowId
      );
      toast.success("Đã cập nhật flow");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Cập nhật flow thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * DELETE /api/v1/projects/{project_id}/flows/{flow_id}
 */
export function useDeleteProjectFlow(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteProjectFlowVariables>,
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
      flowId,
    }: DeleteProjectFlowVariables): Promise<void> => {
      await fetchFlow.delete(projectId, flowId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateFlowMutationCaches(
        queryClient,
        variables.projectId,
        variables.flowId
      );
      void queryClient.removeQueries({
        queryKey: projectFlowQueryKey(variables.projectId, variables.flowId),
      });
      toast.success("Đã xóa flow");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Xóa flow thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PUT /api/v1/projects/{project_id}/flows/{flow_id}/swimlane
 */
export function useUpdateProjectFlowSwimlane(
  options?: Omit<
    UseMutationOptions<
      ProjectFlowResponse,
      Error,
      UpdateProjectFlowSwimlaneVariables
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
      flowId,
      diagram,
    }: UpdateProjectFlowSwimlaneVariables): Promise<ProjectFlowResponse> => {
      return fetchFlow.putSwimlane(projectId, flowId, diagram);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      patchProjectFlowAfterSwimlanePut(
        queryClient,
        variables.projectId,
        data
      );
      void queryClient.invalidateQueries({
        queryKey: projectSetupProgressQueryKey(variables.projectId),
      });
      toast.success("Đã lưu layout");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Lưu layout thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * POST /api/v1/projects/{project_id}/flows/{flow_id}/actions
 */
export function useCreateProjectFlowActions(
  options?: Omit<
    UseMutationOptions<
      ProjectFlowActionsResponse,
      Error,
      PostProjectFlowActionsVariables
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
      flowId,
      items,
    }: PostProjectFlowActionsVariables): Promise<ProjectFlowActionsResponse> => {
      return fetchFlow.postActions(projectId, flowId, items);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateFlowMutationCaches(
        queryClient,
        variables.projectId,
        variables.flowId
      );
      toast.success("Đã thêm actions");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Thêm actions thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/**
 * PATCH /api/v1/projects/{project_id}/flows/{flow_id}/actions
 */
export function usePatchProjectFlowActions(
  options?: Omit<
    UseMutationOptions<
      ProjectFlowActionsResponse,
      Error,
      PatchProjectFlowActionsVariables
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
      flowId,
      items,
    }: PatchProjectFlowActionsVariables): Promise<ProjectFlowActionsResponse> => {
      return fetchFlow.patchActions(projectId, flowId, items);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateFlowMutationCaches(
        queryClient,
        variables.projectId,
        variables.flowId
      );
      toast.success("Đã cập nhật actions");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Cập nhật actions thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  CreateProjectFlowActionItem,
  CreateProjectFlowRequest,
  CreateProjectFlowResponse,
  PatchProjectFlowActionItem,
  ProjectFlow,
  ProjectFlowActionItem,
  ProjectFlowActionsResponse,
  ProjectFlowResponse,
  ProjectFlowsListResponse,
  ProjectFlowSwimlane,
  ProjectFlowSwimlaneAction,
  ProjectFlowSwimlaneEvent,
  ProjectFlowSwimlaneFlow,
  ProjectFlowSwimlaneLane,
  UpdateProjectFlowRequest,
  UpdateProjectFlowResponse,
} from "@/lib/api/services/fetchFlow";

export { mapSwimlaneFromWire, normalizeProjectFlowSwimlaneForPut, toProjectFlowSwimlanePutWire } from "@/lib/api/services/fetchFlow";
