import apiService from "../core";

// ─── Status enums ─────────────────────────────────────────────────────────────

export const AGENT_SESSION_STATUSES = [
  "active",
  "waiting_for_human",
  "completed",
  "failed",
] as const;
export type AgentSessionStatus = (typeof AGENT_SESSION_STATUSES)[number];

export const AGENT_INTERRUPT_TYPES = ["ask_human", "propose_artifacts"] as const;
export type AgentInterruptType = (typeof AGENT_INTERRUPT_TYPES)[number] | null;

export const AGENT_MESSAGE_ROLES = ["user", "agent"] as const;
export type AgentMessageRole = (typeof AGENT_MESSAGE_ROLES)[number];

export const AGENT_TOOL_CALL_STATUSES = [
  "proposed",
  "approved",
  "rejected",
  "executed",
  "superseded",
] as const;
export type AgentToolCallStatus = (typeof AGENT_TOOL_CALL_STATUSES)[number];
export type AgentMissingContext =
  | unknown[]
  | Record<string, unknown>
  | null;

// ─── Wire types (snake_case from backend) ─────────────────────────────────────

interface AgentSessionApi {
  id: string;
  project_id: string;
  artifact_type: string;
  workflow_area: string;
  step_key: string | null;
  status: AgentSessionStatus;
  interrupt_type: AgentInterruptType;
  missing_context: AgentMissingContext;
  provider_config_id: string | null;
  created_by_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AgentSessionCreateApiData {
  session_id: string;
  missing_context: string[];
}

interface AgentSessionCreateApiResponse {
  success: boolean;
  data: AgentSessionCreateApiData;
  message: string | null;
}

interface AgentSessionApiResponse {
  success: boolean;
  data: AgentSessionApi;
  message: string | null;
}

interface AgentMessageApi {
  id: string;
  session_id: string;
  role: AgentMessageRole;
  content: string;
  created_at: string | null;
  updated_at: string | null;
}

interface AgentMessageApiResponse {
  success: boolean;
  data: AgentMessageApi;
  message: string | null;
}

interface AgentMessageListApiResponse {
  success: boolean;
  data: AgentMessageApi[];
  message: string | null;
}

interface AgentToolCallApi {
  id: string;
  run_id: string;
  tool_name: string;
  input_snapshot: Record<string, unknown>;
  status: AgentToolCallStatus;
  created_artifact_id: string | null;
  created_version_id: string | null;
  resolved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AgentToolCallApiResponse {
  success: boolean;
  data: AgentToolCallApi;
  message: string | null;
}

interface AgentToolCallListApiResponse {
  success: boolean;
  data: AgentToolCallApi[];
  message: string | null;
}

// ─── Client types (camelCase) ─────────────────────────────────────────────────

export interface AgentSessionCreated {
  sessionId: string;
  missingContext: string[];
}

export interface AgentSessionCreatedResponse {
  success: boolean;
  data: AgentSessionCreated;
  message: string | null;
}

export interface AgentSession {
  id: string;
  projectId: string;
  artifactType: string;
  workflowArea: string;
  stepKey: string | null;
  status: AgentSessionStatus;
  interruptType: AgentInterruptType;
  missingContext: AgentMissingContext;
  providerConfigId: string | null;
  createdById: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AgentSessionResponse {
  success: boolean;
  data: AgentSession;
  message: string | null;
}

export interface AgentMessage {
  id: string;
  sessionId: string;
  role: AgentMessageRole;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AgentMessageResponse {
  success: boolean;
  data: AgentMessage;
  message: string | null;
}

export interface AgentMessageListResponse {
  success: boolean;
  data: AgentMessage[];
  message: string | null;
}

export interface AgentToolCall {
  id: string;
  runId: string;
  toolName: string;
  inputSnapshot: Record<string, unknown>;
  status: AgentToolCallStatus;
  createdArtifactId: string | null;
  createdVersionId: string | null;
  resolvedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AgentToolCallResponse {
  success: boolean;
  data: AgentToolCall;
  message: string | null;
}

export interface AgentToolCallListResponse {
  success: boolean;
  data: AgentToolCall[];
  message: string | null;
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateAgentSessionRequest {
  artifact_type: string;
  step_key?: string | null;
  workflow_area?: string;
  provider_config_id?: string | null;
}

export interface SendMessageRequest {
  content: string;
}

export interface RequestEditRequest {
  note: string;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapSession(s: AgentSessionApi): AgentSession {
  return {
    id: s.id,
    projectId: s.project_id,
    artifactType: s.artifact_type,
    workflowArea: s.workflow_area,
    stepKey: s.step_key,
    status: s.status,
    interruptType: s.interrupt_type,
    missingContext: s.missing_context,
    providerConfigId: s.provider_config_id,
    createdById: s.created_by_id,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

function mapMessage(m: AgentMessageApi): AgentMessage {
  return {
    id: m.id,
    sessionId: m.session_id,
    role: m.role,
    content: m.content,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  };
}

function mapToolCall(t: AgentToolCallApi): AgentToolCall {
  return {
    id: t.id,
    runId: t.run_id,
    toolName: t.tool_name,
    inputSnapshot: t.input_snapshot,
    status: t.status,
    createdArtifactId: t.created_artifact_id,
    createdVersionId: t.created_version_id,
    resolvedAt: t.resolved_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

// ─── Path builders ────────────────────────────────────────────────────────────

function sessionsBase(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/agent-sessions`;
}

function sessionPath(projectId: string, sessionId: string) {
  return `${sessionsBase(projectId)}/${encodeURIComponent(sessionId)}`;
}

function toolCallPath(projectId: string, toolCallId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/agent-tool-calls/${encodeURIComponent(toolCallId)}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const fetchAgentSession = {
  /** POST /api/v1/projects/{project_id}/agent-sessions */
  create: async (
    projectId: string,
    req: CreateAgentSessionRequest
  ): Promise<AgentSessionCreatedResponse> => {
    const res = await apiService.post<AgentSessionCreateApiResponse>(
      sessionsBase(projectId),
      req
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: {
        sessionId: res.data.data.session_id,
        missingContext: res.data.data.missing_context ?? [],
      },
    };
  },

  /** GET /api/v1/projects/{project_id}/agent-sessions/{session_id} */
  getById: async (
    projectId: string,
    sessionId: string
  ): Promise<AgentSessionResponse> => {
    const res = await apiService.get<AgentSessionApiResponse>(
      sessionPath(projectId, sessionId)
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapSession(res.data.data),
    };
  },

  /** DELETE /api/v1/projects/{project_id}/agent-sessions/{session_id} */
  delete: async (projectId: string, sessionId: string): Promise<void> => {
    await apiService.delete<unknown>(sessionPath(projectId, sessionId));
  },

  /** POST /api/v1/projects/{project_id}/agent-sessions/{session_id}/messages */
  sendMessage: async (
    projectId: string,
    sessionId: string,
    req: SendMessageRequest
  ): Promise<AgentMessageResponse> => {
    const res = await apiService.post<AgentMessageApiResponse>(
      `${sessionPath(projectId, sessionId)}/messages`,
      req
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapMessage(res.data.data),
    };
  },

  /** GET /api/v1/projects/{project_id}/agent-sessions/{session_id}/messages */
  listMessages: async (
    projectId: string,
    sessionId: string
  ): Promise<AgentMessageListResponse> => {
    const res = await apiService.get<AgentMessageListApiResponse>(
      `${sessionPath(projectId, sessionId)}/messages`
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: res.data.data.map(mapMessage),
    };
  },

  /** GET /api/v1/projects/{project_id}/agent-sessions/{session_id}/tool-calls */
  listToolCalls: async (
    projectId: string,
    sessionId: string
  ): Promise<AgentToolCallListResponse> => {
    const res = await apiService.get<AgentToolCallListApiResponse>(
      `${sessionPath(projectId, sessionId)}/tool-calls`
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: res.data.data.map(mapToolCall),
    };
  },

  /** POST /api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/approve */
  approve: async (
    projectId: string,
    toolCallId: string
  ): Promise<AgentToolCallResponse> => {
    const res = await apiService.post<AgentToolCallApiResponse>(
      `${toolCallPath(projectId, toolCallId)}/approve`,
      {}
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapToolCall(res.data.data),
    };
  },

  /** POST /api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/reject */
  reject: async (
    projectId: string,
    toolCallId: string
  ): Promise<AgentToolCallResponse> => {
    const res = await apiService.post<AgentToolCallApiResponse>(
      `${toolCallPath(projectId, toolCallId)}/reject`,
      {}
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapToolCall(res.data.data),
    };
  },

  /** POST /api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/request-edit */
  requestEdit: async (
    projectId: string,
    toolCallId: string,
    req: RequestEditRequest
  ): Promise<AgentToolCallResponse> => {
    const res = await apiService.post<AgentToolCallApiResponse>(
      `${toolCallPath(projectId, toolCallId)}/request-edit`,
      req
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapToolCall(res.data.data),
    };
  },
};
