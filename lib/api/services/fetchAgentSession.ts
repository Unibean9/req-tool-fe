import apiService from "../core";
import {
  mapDocumentViewFromApi,
  type DocumentView,
  type DocumentViewApi,
} from "./fetchDocument";

// ─── Status enums ─────────────────────────────────────────────────────────────

export const AGENT_SESSION_STATUSES = [
  "active",
  "waiting_for_human",
  "completed",
  "failed",
  "turn_failed",
  "expired",
] as const;
export type AgentSessionStatus = (typeof AGENT_SESSION_STATUSES)[number];

export const AGENT_INTERRUPT_TYPES = ["ask_human", "propose_artifacts", "stream_response"] as const;
export type AgentInterruptType = (typeof AGENT_INTERRUPT_TYPES)[number] | null;

export const AGENT_MESSAGE_ROLES = ["user", "agent"] as const;
export type AgentMessageRole = (typeof AGENT_MESSAGE_ROLES)[number];
export const AGENT_SESSION_UI_STATUSES = [
  "processing",
  "waiting_input",
  "waiting_approval",
  "error",
  "idle",
] as const;
export type AgentSessionUiStatus = (typeof AGENT_SESSION_UI_STATUSES)[number];
export type AgentMessagePayloadLocale = "vi" | "en";
export type AgentMessagePayloadOption = {
  id: string;
  label: string;
  value: string;
};
export type AgentMessagePayloadBlock =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: string; [key: string]: unknown };
export type AgentMessagePayload =
  | {
      kind?: string;
      locale?: AgentMessagePayloadLocale;
      queued?: boolean;
      options?: AgentMessagePayloadOption[];
      blocks?: AgentMessagePayloadBlock[];
      [key: string]: unknown;
    }
  | null;

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
  step_key?: string | null;
  status: AgentSessionStatus;
  ui_status?: AgentSessionUiStatus | null;
  interrupt_type: AgentInterruptType;
  missing_context: AgentMissingContext;
  focused_artifact_id?: string | null;
  document?: DocumentViewApi | null;
  agent_role?: string | null;
  provider_config_id?: string | null;
  created_by_id?: string | null;
  created_at?: string | null;
  updated_at: string | null;
}

interface AgentSessionCreateApiData {
  session_id: string;
  missing_context: string[];
  artifact_type?: string;
  focused_artifact_id?: string;
  document_type?: string;
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
  payload?: AgentMessagePayload;
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

interface AgentSessionSnapshotApi {
  type: "snapshot";
  session: AgentSessionApi;
  messages: AgentMessageApi[];
  tool_calls: AgentToolCallApi[];
}

interface AgentSessionStreamClosedApi {
  type: "stream_closed";
  status: Extract<
    AgentSessionStatus,
    "completed" | "failed" | "turn_failed" | "expired"
  >;
}

// ─── Client types (camelCase) ─────────────────────────────────────────────────

export interface AgentSessionCreated {
  sessionId: string;
  missingContext: string[];
  artifactType: string | null;
  focusedArtifactId: string | null;
  documentType: string | null;
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
  uiStatus: AgentSessionUiStatus;
  interruptType: AgentInterruptType;
  missingContext: AgentMissingContext;
  focusedArtifactId: string | null;
  document: DocumentView | null;
  agentRole: string | null;
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
  payload: AgentMessagePayload;
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

export interface AgentSessionSnapshotEvent {
  type: "snapshot";
  session: AgentSession;
  messages: AgentMessage[];
  toolCalls: AgentToolCall[];
}

export interface AgentSessionStreamClosedEvent {
  type: "stream_closed";
  status: Extract<
    AgentSessionStatus,
    "completed" | "failed" | "turn_failed" | "expired"
  >;
}

export type AgentSessionStreamEvent =
  | AgentSessionSnapshotEvent
  | AgentSessionStreamClosedEvent;

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateAgentSessionRequest {
  artifact_type: string;
  focused_artifact_id: string;
  step_key?: string | null;
  workflow_area?: string;
  agent_role?: string | null;
  provider_config_id?: string | null;
}

export const AGENT_MESSAGE_MODE_HINTS = [
  "qa",
  "critique",
  "explore",
  "draft",
] as const;
export type AgentMessageModeHint = (typeof AGENT_MESSAGE_MODE_HINTS)[number];

export interface SendMessageRequest {
  content: string;
  mode_hint?: AgentMessageModeHint | null;
}

export interface RequestEditRequest {
  note: string;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapSession(s: AgentSessionApi): AgentSession {
  const fallbackUiStatus: AgentSessionUiStatus =
    s.status === "active"
      ? s.interrupt_type === "stream_response"
        ? "waiting_input"
        : "processing"
      : s.status === "failed" || s.status === "turn_failed"
        ? "error"
        : s.status === "completed" || s.status === "expired"
          ? "idle"
          : s.interrupt_type === "propose_artifacts"
            ? "waiting_approval"
            : "waiting_input";

  return {
    id: s.id,
    projectId: s.project_id,
    artifactType: s.artifact_type,
    workflowArea: s.workflow_area,
    stepKey: s.step_key ?? null,
    status: s.status,
    uiStatus: s.ui_status ?? fallbackUiStatus,
    interruptType: s.interrupt_type,
    missingContext: s.missing_context,
    focusedArtifactId: s.focused_artifact_id ?? null,
    document: s.document ? mapDocumentViewFromApi(s.document) : null,
    agentRole: s.agent_role ?? null,
    providerConfigId: s.provider_config_id ?? null,
    createdById: s.created_by_id ?? null,
    createdAt: s.created_at ?? null,
    updatedAt: s.updated_at,
  };
}

function mapMessage(m: AgentMessageApi): AgentMessage {
  return {
    id: m.id,
    sessionId: m.session_id,
    role: m.role,
    content: m.content,
    payload: m.payload ?? null,
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

function parseStreamEvent(
  eventName: string,
  data: unknown
): AgentSessionStreamEvent | null {
  if (!data || typeof data !== "object") return null;

  if (
    eventName === "snapshot" ||
    (data as { type?: unknown }).type === "snapshot"
  ) {
    const snapshot = data as AgentSessionSnapshotApi;
    if (!snapshot.session || !Array.isArray(snapshot.messages)) return null;
    return {
      type: "snapshot",
      session: mapSession(snapshot.session),
      messages: snapshot.messages.map(mapMessage),
      toolCalls: Array.isArray(snapshot.tool_calls)
        ? snapshot.tool_calls.map(mapToolCall)
        : [],
    };
  }

  if (
    eventName === "stream_closed" ||
    (data as { type?: unknown }).type === "stream_closed"
  ) {
    const closed = data as AgentSessionStreamClosedApi;
    if (closed.status !== "completed" && closed.status !== "failed") {
      return null;
    }
    return { type: "stream_closed", status: closed.status };
  }

  return null;
}

function parseSseBlock(block: string): AgentSessionStreamEvent | null {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    const separatorIndex = line.indexOf(":");
    const field =
      separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    const rawValue =
      separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

    if (field === "event") eventName = value;
    if (field === "data") dataLines.push(value);
  }

  if (!dataLines.length) return null;

  try {
    return parseStreamEvent(eventName, JSON.parse(dataLines.join("\n")));
  } catch {
    return null;
  }
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
        artifactType: res.data.data.artifact_type ?? null,
        focusedArtifactId: res.data.data.focused_artifact_id ?? null,
        documentType: res.data.data.document_type ?? null,
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

  /**
   * GET /api/v1/projects/{project_id}/agent-sessions/{session_id}/events
   * Uses Axios' fetch adapter because native EventSource cannot attach Bearer auth.
   */
  streamEvents: async (
    projectId: string,
    sessionId: string,
    options: {
      signal: AbortSignal;
      onEvent: (event: AgentSessionStreamEvent) => void;
    }
  ): Promise<"stream_closed" | "ended"> => {
    const res = await apiService.request<ReadableStream<Uint8Array>>({
      method: "GET",
      url: `${sessionPath(projectId, sessionId)}/events`,
      adapter: "fetch",
      responseType: "stream",
      timeout: 0,
      signal: options.signal,
      headers: { Accept: "text/event-stream" },
    });

    const contentType = String(res.headers["content-type"] ?? "");
    if (!contentType.toLowerCase().includes("text/event-stream")) {
      throw new Error("The agent event stream returned an invalid content type");
    }
    if (!res.data || typeof res.data.getReader !== "function") {
      throw new Error("This browser cannot read the agent event stream");
    }

    const reader = res.data.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const emitBlock = (block: string) => {
      const event = parseSseBlock(block);
      if (!event) return false;
      options.onEvent(event);
      return event.type === "stream_closed";
    };

    try {
      while (!options.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let boundary = /\r?\n\r?\n/.exec(buffer);
        while (boundary) {
          const block = buffer.slice(0, boundary.index);
          buffer = buffer.slice(boundary.index + boundary[0].length);
          if (emitBlock(block)) return "stream_closed";
          boundary = /\r?\n\r?\n/.exec(buffer);
        }
      }

      buffer += decoder.decode();
      if (buffer.trim() && emitBlock(buffer)) return "stream_closed";
      return "ended";
    } finally {
      if (options.signal.aborted) {
        await reader.cancel().catch(() => undefined);
      }
    }
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
