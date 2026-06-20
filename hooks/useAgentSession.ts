"use client";

import {
  useEffect,
  useState,
} from "react";
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
  fetchAgentSession,
  type AgentMessage,
  type AgentMessageListResponse,
  type AgentMessageResponse,
  type AgentSession,
  type AgentSessionCreatedResponse,
  type AgentSessionResponse,
  type AgentSessionStreamEvent,
  type AgentToolCall,
  type AgentToolCallListResponse,
  type AgentToolCallResponse,
  type CreateAgentSessionRequest,
  type RequestEditRequest,
  type SendMessageRequest,
} from "@/lib/api/services/fetchAgentSession";
import {
  projectAgentSessionMessagesQueryKey,
  projectAgentSessionQueryKey,
  projectAgentSessionToolCallsQueryKey,
  projectArtifactsByTypeQueryKey,
} from "@/lib/query/query-keys";
import type { ArtifactType } from "@/lib/api/services/fetchArtifact";

export type {
  AgentSession,
  AgentMessage,
  AgentMessagePayload,
  AgentMessagePayloadLocale,
  AgentMessagePayloadBlock,
  AgentMessagePayloadOption,
  AgentToolCall,
  AgentSessionStatus,
  AgentSessionUiStatus,
  AgentInterruptType,
  AgentMissingContext,
  AgentToolCallStatus,
  AgentMessageRole,
  CreateAgentSessionRequest,
  RequestEditRequest,
  SendMessageRequest,
} from "@/lib/api/services/fetchAgentSession";

// ─── Invalidation helpers ─────────────────────────────────────────────────────

function invalidateSession(
  queryClient: QueryClient,
  projectId: string,
  sessionId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectAgentSessionQueryKey(projectId, sessionId),
  });
}

function invalidateMessages(
  queryClient: QueryClient,
  projectId: string,
  sessionId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectAgentSessionMessagesQueryKey(projectId, sessionId),
  });
}

function invalidateToolCalls(
  queryClient: QueryClient,
  projectId: string,
  sessionId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectAgentSessionToolCallsQueryKey(projectId, sessionId),
  });
}

function invalidateArtifactsByType(
  queryClient: QueryClient,
  projectId: string,
  artifactType: ArtifactType
) {
  void queryClient.invalidateQueries({
    queryKey: projectArtifactsByTypeQueryKey(projectId, artifactType),
    exact: false,
  });
}

function markSessionActive(
  queryClient: QueryClient,
  projectId: string,
  sessionId: string
) {
  queryClient.setQueryData<AgentSessionResponse>(
    projectAgentSessionQueryKey(projectId, sessionId),
    (current) =>
      current
        ? {
            ...current,
            data: {
              ...current.data,
              status: "active",
              uiStatus: "processing",
              interruptType: null,
            },
          }
        : current
  );
}

function upsertMessage(
  queryClient: QueryClient,
  projectId: string,
  sessionId: string,
  message: AgentMessage
) {
  queryClient.setQueryData<AgentMessageListResponse>(
    projectAgentSessionMessagesQueryKey(projectId, sessionId),
    (current) => {
      if (!current) {
        return {
          success: true,
          message: null,
          data: [message],
        };
      }

      const exists = current.data.some((item) => item.id === message.id);
      return {
        ...current,
        data: exists
          ? current.data.map((item) =>
              item.id === message.id ? message : item
            )
          : [...current.data, message],
      };
    }
  );
}

function upsertToolCall(
  queryClient: QueryClient,
  projectId: string,
  sessionId: string,
  toolCall: AgentToolCall
) {
  queryClient.setQueryData<AgentToolCallListResponse>(
    projectAgentSessionToolCallsQueryKey(projectId, sessionId),
    (current) => {
      if (!current) {
        return {
          success: true,
          message: null,
          data: [toolCall],
        };
      }

      const exists = current.data.some((item) => item.id === toolCall.id);
      return {
        ...current,
        data: exists
          ? current.data.map((item) =>
              item.id === toolCall.id ? toolCall : item
            )
          : [...current.data, toolCall],
      };
    }
  );
}

function refreshSessionSnapshot(
  queryClient: QueryClient,
  projectId: string,
  sessionId: string
) {
  void queryClient.fetchQuery({
    queryKey: projectAgentSessionQueryKey(projectId, sessionId),
    queryFn: () => fetchAgentSession.getById(projectId, sessionId),
  });
  void queryClient.fetchQuery({
    queryKey: projectAgentSessionMessagesQueryKey(projectId, sessionId),
    queryFn: () => fetchAgentSession.listMessages(projectId, sessionId),
  });
  void queryClient.fetchQuery({
    queryKey: projectAgentSessionToolCallsQueryKey(projectId, sessionId),
    queryFn: () => fetchAgentSession.listToolCalls(projectId, sessionId),
  });
}

function refreshSessionSnapshotAfterAction(
  queryClient: QueryClient,
  projectId: string,
  sessionId: string
) {
  refreshSessionSnapshot(queryClient, projectId, sessionId);
  window.setTimeout(() => {
    refreshSessionSnapshot(queryClient, projectId, sessionId);
  }, 750);
  window.setTimeout(() => {
    refreshSessionSnapshot(queryClient, projectId, sessionId);
  }, 2000);
}

function applyStreamEvent(
  queryClient: QueryClient,
  projectId: string,
  sessionId: string,
  event: AgentSessionStreamEvent
) {
  if (event.type === "stream_closed") {
    queryClient.setQueryData<AgentSessionResponse>(
      projectAgentSessionQueryKey(projectId, sessionId),
      (current) =>
        current
          ? {
              ...current,
              data: {
                ...current.data,
                status: event.status,
                uiStatus: event.status === "failed" ? "error" : "idle",
              },
            }
          : current
    );
    refreshSessionSnapshot(queryClient, projectId, sessionId);
    return;
  }

  queryClient.setQueryData<AgentSessionResponse>(
    projectAgentSessionQueryKey(projectId, sessionId),
    {
      success: true,
      message: null,
      data: event.session,
    }
  );
  queryClient.setQueryData<AgentMessageListResponse>(
    projectAgentSessionMessagesQueryKey(projectId, sessionId),
    {
      success: true,
      message: null,
      data: event.messages,
    }
  );
  queryClient.setQueryData<AgentToolCallListResponse>(
    projectAgentSessionToolCallsQueryKey(projectId, sessionId),
    {
      success: true,
      message: null,
      data: event.toolCalls,
    }
  );

  if (
    event.toolCalls.some(
      (toolCall) =>
        Boolean(toolCall.createdArtifactId) ||
        Boolean(toolCall.createdVersionId)
    )
  ) {
    invalidateArtifactsByType(
      queryClient,
      projectId,
      event.session.artifactType
    );
  }
}

// ─── GET hooks ────────────────────────────────────────────────────────────────

export type AgentSessionRealtimeMode =
  | "idle"
  | "connecting"
  | "live"
  | "fallback"
  | "closed";

/**
 * Snapshot SSE is the primary source of truth. When streaming is unavailable
 * or closes before a terminal event, callers can enable their existing polling
 * queries as a rollout fallback.
 */
export function useAgentSessionRealtime(
  projectId: string | null | undefined,
  sessionId: string | null | undefined
) {
  const queryClient = useQueryClient();
  const pid = projectId?.trim() ?? "";
  const sid = sessionId?.trim() ?? "";
  const sessionKey = pid && sid ? `${pid}:${sid}` : "";
  const supportsStreaming = typeof ReadableStream !== "undefined";
  const [connection, setConnection] = useState<{
    key: string;
    mode: AgentSessionRealtimeMode;
    snapshotCount: number;
  }>({
    key: "",
    mode: "idle",
    snapshotCount: 0,
  });

  const mode: AgentSessionRealtimeMode = !sessionKey
    ? "idle"
    : !supportsStreaming
      ? "fallback"
      : connection.key === sessionKey
        ? connection.mode
        : "connecting";
  const snapshotCount =
    connection.key === sessionKey ? connection.snapshotCount : 0;

  useEffect(() => {
    if (!sessionKey || !supportsStreaming) return;

    const controller = new AbortController();
    let active = true;

    void fetchAgentSession
      .streamEvents(pid, sid, {
        signal: controller.signal,
        onEvent: (event) => {
          if (!active) return;
          applyStreamEvent(queryClient, pid, sid, event);
          if (event.type === "snapshot") {
            setConnection((current) => ({
              key: sessionKey,
              mode: "live",
              snapshotCount:
                current.key === sessionKey ? current.snapshotCount + 1 : 1,
            }));
          } else {
            setConnection((current) => ({
              key: sessionKey,
              mode: "closed",
              snapshotCount:
                current.key === sessionKey ? current.snapshotCount : 0,
            }));
          }
        },
      })
      .then((result) => {
        if (!active || controller.signal.aborted) return;
        setConnection((current) => ({
          key: sessionKey,
          mode: result === "stream_closed" ? "closed" : "fallback",
          snapshotCount:
            current.key === sessionKey ? current.snapshotCount : 0,
        }));
      })
      .catch(() => {
        if (!active || controller.signal.aborted) return;
        setConnection((current) => ({
          key: sessionKey,
          mode: "fallback",
          snapshotCount:
            current.key === sessionKey ? current.snapshotCount : 0,
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [pid, queryClient, sessionKey, sid, supportsStreaming]);

  return {
    mode,
    snapshotCount,
    isFallback: mode === "fallback",
    isStreaming: mode === "connecting" || mode === "live",
  };
}

/**
 * GET /api/v1/projects/{project_id}/agent-sessions/{session_id}
 * Polls only while the agent is processing. Waiting states are stable user
 * input boundaries and stop polling until the next mutation.
 */
export function useAgentSession(
  projectId: string | null | undefined,
  sessionId: string | null | undefined,
  options?: { enabled?: boolean; pollingEnabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const sid = sessionId?.trim() ?? "";
  const enabled = Boolean(pid) && Boolean(sid) && (options?.enabled ?? true);

  return useCachedGet<AgentSessionResponse, Error, AgentSession>({
    queryKey: projectAgentSessionQueryKey(pid, sid),
    queryFn: () => fetchAgentSession.getById(pid, sid),
    select: (res) => res.data,
    enabled,
    staleTime: 0,
    refetchInterval: (query) => {
      if (!(options?.pollingEnabled ?? true)) return false;
      const raw = query.state.data as AgentSessionResponse | undefined;
      if (raw?.data?.uiStatus === "processing") return 2000;
      return false;
    },
  });
}

/** GET /api/v1/projects/{project_id}/agent-sessions/{session_id}/messages */
export function useAgentSessionMessages(
  projectId: string | null | undefined,
  sessionId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const sid = sessionId?.trim() ?? "";
  const enabled = Boolean(pid) && Boolean(sid) && (options?.enabled ?? true);

  return useCachedGet<AgentMessageListResponse, Error, AgentMessage[]>({
    queryKey: projectAgentSessionMessagesQueryKey(pid, sid),
    queryFn: () => fetchAgentSession.listMessages(pid, sid),
    select: (res) => res.data,
    enabled,
    staleTime: 0,
  });
}

/** GET /api/v1/projects/{project_id}/agent-sessions/{session_id}/tool-calls */
export function useAgentSessionToolCalls(
  projectId: string | null | undefined,
  sessionId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const sid = sessionId?.trim() ?? "";
  const enabled = Boolean(pid) && Boolean(sid) && (options?.enabled ?? true);

  return useCachedGet<AgentToolCallListResponse, Error, AgentToolCall[]>({
    queryKey: projectAgentSessionToolCallsQueryKey(pid, sid),
    queryFn: () => fetchAgentSession.listToolCalls(pid, sid),
    select: (res) => res.data,
    enabled,
    staleTime: 0,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

type CreateSessionVariables = {
  projectId: string;
  req: CreateAgentSessionRequest;
};

/** POST /api/v1/projects/{project_id}/agent-sessions */
export function useCreateAgentSession(
  options?: Omit<
    UseMutationOptions<AgentSessionCreatedResponse, Error, CreateSessionVariables>,
    "mutationFn"
  >
) {
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
  return useMutation({
    ...rest,
    mutationFn: ({ projectId, req }: CreateSessionVariables) =>
      fetchAgentSession.create(projectId, req),
    onSuccess: (data, variables, onMutateResult, context) => {
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type DeleteSessionVariables = { projectId: string; sessionId: string };

/** DELETE /api/v1/projects/{project_id}/agent-sessions/{session_id} */
export function useDeleteAgentSession(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteSessionVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
  return useMutation({
    ...rest,
    mutationFn: ({ projectId, sessionId }: DeleteSessionVariables) =>
      fetchAgentSession.delete(projectId, sessionId),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.removeQueries({
        queryKey: projectAgentSessionQueryKey(variables.projectId, variables.sessionId),
      });
      queryClient.removeQueries({
        queryKey: projectAgentSessionMessagesQueryKey(
          variables.projectId,
          variables.sessionId
        ),
      });
      queryClient.removeQueries({
        queryKey: projectAgentSessionToolCallsQueryKey(
          variables.projectId,
          variables.sessionId
        ),
      });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Could not delete agent session"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type SendMessageVariables = {
  projectId: string;
  sessionId: string;
  req: SendMessageRequest;
};

/** POST /api/v1/projects/{project_id}/agent-sessions/{session_id}/messages */
export function useSendAgentMessage(
  options?: Omit<
    UseMutationOptions<AgentMessageResponse, Error, SendMessageVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
  return useMutation({
    ...rest,
    mutationFn: ({ projectId, sessionId, req }: SendMessageVariables) =>
      fetchAgentSession.sendMessage(projectId, sessionId, req),
    onSuccess: (data, variables, onMutateResult, context) => {
      upsertMessage(
        queryClient,
        variables.projectId,
        variables.sessionId,
        data.data
      );
      if (data.data.payload?.queued !== true) {
        markSessionActive(queryClient, variables.projectId, variables.sessionId);
      }
      invalidateMessages(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      invalidateMessages(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      toast.error(getApiErrorMessage(error, "Could not send message"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type ToolCallActionVariables = {
  projectId: string;
  sessionId: string;
  toolCallId: string;
  artifactType: ArtifactType;
};

type RequestEditVariables = ToolCallActionVariables & {
  req: RequestEditRequest;
};

/** POST /api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/approve */
export function useApproveToolCall(
  options?: Omit<
    UseMutationOptions<AgentToolCallResponse, Error, ToolCallActionVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
  return useMutation({
    ...rest,
    mutationFn: ({ projectId, toolCallId }: ToolCallActionVariables) =>
      fetchAgentSession.approve(projectId, toolCallId),
    onSuccess: (data, variables, onMutateResult, context) => {
      upsertToolCall(
        queryClient,
        variables.projectId,
        variables.sessionId,
        data.data
      );
      refreshSessionSnapshotAfterAction(
        queryClient,
        variables.projectId,
        variables.sessionId
      );
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      invalidateArtifactsByType(
        queryClient,
        variables.projectId,
        variables.artifactType
      );
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      toast.error(getApiErrorMessage(error, "Could not approve proposal"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/** POST /api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/reject */
export function useRejectToolCall(
  options?: Omit<
    UseMutationOptions<AgentToolCallResponse, Error, ToolCallActionVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
  return useMutation({
    ...rest,
    mutationFn: ({ projectId, toolCallId }: ToolCallActionVariables) =>
      fetchAgentSession.reject(projectId, toolCallId),
    onSuccess: (data, variables, onMutateResult, context) => {
      upsertToolCall(
        queryClient,
        variables.projectId,
        variables.sessionId,
        data.data
      );
      refreshSessionSnapshotAfterAction(
        queryClient,
        variables.projectId,
        variables.sessionId
      );
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      invalidateArtifactsByType(
        queryClient,
        variables.projectId,
        variables.artifactType
      );
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      toast.error(getApiErrorMessage(error, "Could not reject proposal"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/** POST /api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/request-edit */
export function useRequestEditToolCall(
  options?: Omit<
    UseMutationOptions<AgentToolCallResponse, Error, RequestEditVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};
  return useMutation({
    ...rest,
    mutationFn: ({
      projectId,
      toolCallId,
      req,
    }: RequestEditVariables) =>
      fetchAgentSession.requestEdit(projectId, toolCallId, req),
    onSuccess: (data, variables, onMutateResult, context) => {
      upsertToolCall(
        queryClient,
        variables.projectId,
        variables.sessionId,
        data.data
      );
      refreshSessionSnapshotAfterAction(
        queryClient,
        variables.projectId,
        variables.sessionId
      );
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      toast.error(getApiErrorMessage(error, "Could not request a revision"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}
