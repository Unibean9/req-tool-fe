"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCachedGet } from "@/hooks/useCachedGet";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchContextDiagram,
  type ContextDiagramData,
  type CreateContextDiagramFlowRequest,
  type PutContextDiagramLayoutRequest,
  type UpdateContextDiagramFlowRequest,
} from "@/lib/api/services/fetchContextDiagram";
import { projectContextDiagramQueryKey } from "@/lib/query/query-keys";

export type {
  ContextDiagramData,
  CreateContextDiagramFlowRequest,
  PutContextDiagramLayoutRequest,
  UpdateContextDiagramFlowRequest,
};

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/projects/{projectId}/context-diagram
 * `projectId` rỗng thì `enabled: false`.
 */
export function useContextDiagram(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ContextDiagramData, Error, ContextDiagramData>({
    queryKey: projectContextDiagramQueryKey(pid),
    queryFn: () => fetchContextDiagram.get(pid),
    enabled,
  });
}

// ─── POST sync ────────────────────────────────────────────────────────────────

export function useSyncContextDiagram(projectId: string) {
  const queryClient = useQueryClient();
  const pid = projectId.trim();

  return useMutation({
    mutationFn: () => fetchContextDiagram.sync(pid),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectContextDiagramQueryKey(pid),
      });
      toast.success("Context diagram synced");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to sync context diagram"));
    },
  });
}

// ─── PUT layout ───────────────────────────────────────────────────────────────

export function useSaveContextDiagramLayout(projectId: string) {
  return useMutation({
    mutationFn: (layout: PutContextDiagramLayoutRequest) =>
      fetchContextDiagram.putLayout(projectId, layout),
    onSuccess: () => {
      toast.success("Layout saved");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to save layout"));
    },
  });
}

// ─── POST flow ────────────────────────────────────────────────────────────────

export function useCreateContextDiagramFlow(projectId: string) {
  const queryClient = useQueryClient();
  const pid = projectId.trim();

  return useMutation({
    mutationFn: (body: CreateContextDiagramFlowRequest) =>
      fetchContextDiagram.postFlow(pid, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectContextDiagramQueryKey(pid),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create flow"));
    },
  });
}

// ─── PATCH flow label ─────────────────────────────────────────────────────────

type UpdateFlowVariables = { flowId: string; body: UpdateContextDiagramFlowRequest };

export function useUpdateContextDiagramFlow(projectId: string) {
  const queryClient = useQueryClient();
  const pid = projectId.trim();

  return useMutation({
    mutationFn: ({ flowId, body }: UpdateFlowVariables) =>
      fetchContextDiagram.patchFlow(pid, flowId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectContextDiagramQueryKey(pid),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update flow"));
    },
  });
}

// ─── DELETE flow ──────────────────────────────────────────────────────────────

export function useDeleteContextDiagramFlow(projectId: string) {
  const queryClient = useQueryClient();
  const pid = projectId.trim();

  return useMutation({
    mutationFn: (flowId: string) => fetchContextDiagram.deleteFlow(pid, flowId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectContextDiagramQueryKey(pid),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete flow"));
    },
  });
}
