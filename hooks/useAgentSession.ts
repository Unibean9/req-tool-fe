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
  fetchAgentSession,
  type AgentMessage,
  type AgentMessageListResponse,
  type AgentMessageResponse,
  type AgentSession,
  type AgentSessionCreatedResponse,
  type AgentSessionResponse,
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
  projectArtifactsQueryKey,
} from "@/lib/query/query-keys";

export type {
  AgentSession,
  AgentMessage,
  AgentToolCall,
  AgentSessionStatus,
  AgentInterruptType,
  AgentMissingContext,
  AgentToolCallStatus,
  AgentMessageRole,
  CreateAgentSessionRequest,
  SendMessageRequest,
  RequestEditRequest,
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

// ─── GET hooks ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/projects/{project_id}/agent-sessions/{session_id}
 * Polls while the workflow can still transition. Waiting sessions are polled
 * more slowly so batch approvals and user replies cannot leave stale UI.
 */
export function useAgentSession(
  projectId: string | null | undefined,
  sessionId: string | null | undefined,
  options?: { enabled?: boolean }
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
      const raw = query.state.data as AgentSessionResponse | undefined;
      if (raw?.data?.status === "active") return 2000;
      if (raw?.data?.status === "waiting_for_human") return 4000;
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
    refetchInterval: 4000,
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
    refetchInterval: 4000,
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
      toast.error(getApiErrorMessage(error, "Xoá phiên agent thất bại"));
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
      invalidateMessages(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      invalidateMessages(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      toast.error(getApiErrorMessage(error, "Gửi tin nhắn thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type ToolCallActionVariables = {
  projectId: string;
  sessionId: string;
  toolCallId: string;
};

type RequestEditVariables = ToolCallActionVariables & { req: RequestEditRequest };

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
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      void queryClient.invalidateQueries({
        queryKey: projectArtifactsQueryKey(variables.projectId),
        exact: false,
      });
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      toast.error(getApiErrorMessage(error, "Duyệt đề xuất thất bại"));
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
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      toast.error(getApiErrorMessage(error, "Từ chối đề xuất thất bại"));
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
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
  return useMutation({
    ...rest,
    mutationFn: ({ projectId, toolCallId, req }: RequestEditVariables) =>
      fetchAgentSession.requestEdit(projectId, toolCallId, req),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      invalidateToolCalls(queryClient, variables.projectId, variables.sessionId);
      invalidateSession(queryClient, variables.projectId, variables.sessionId);
      toast.error(getApiErrorMessage(error, "Yêu cầu chỉnh sửa thất bại"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}
