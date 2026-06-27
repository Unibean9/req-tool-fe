import apiService from "../core";

export type LLMProviderType = "openai" | "anthropic" | "google" | "bedrock";
export type LLMProviderConfigStatus = "draft" | "active" | "error" | "disabled";

// ─── API types (snake_case from backend) ────────────────────────────────────

interface LLMProviderConfigApi {
  id: string;
  user_id: string;
  provider_type: LLMProviderType;
  name: string;
  base_url: string | null;
  region: string | null;
  model_name: string | null;
  strong_model_name: string | null;
  status: LLMProviderConfigStatus;
  is_default: boolean;
  api_key_set: boolean;
  secret_key_set: boolean;
  last_checked_at: string | null;
  last_check_error: string | null;
  created_at: string;
  updated_at: string;
}

interface LLMProviderConfigListApiResponse {
  success: boolean;
  data: LLMProviderConfigApi[];
  message: string | null;
}

interface LLMProviderConfigSingleApiResponse {
  success: boolean;
  data: LLMProviderConfigApi;
  message: string | null;
}

interface HealthCheckApiResponse {
  success: boolean;
  data: {
    config: LLMProviderConfigApi;
    response_time_ms: number;
    provider_reply: string | null;
    tool_calling_supported: boolean | null;
  };
  message: string | null;
}

// ─── Client types (camelCase) ────────────────────────────────────────────────

export interface LLMProviderConfig {
  id: string;
  userId: string;
  providerType: LLMProviderType;
  name: string;
  baseUrl: string | null;
  region: string | null;
  modelName: string | null;
  strongModelName: string | null;
  status: LLMProviderConfigStatus;
  isDefault: boolean;
  apiKeySet: boolean;
  secretKeySet: boolean;
  lastCheckedAt: string | null;
  lastCheckError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LLMProviderConfigListResponse {
  success: boolean;
  data: LLMProviderConfig[];
  message: string | null;
}

export interface LLMProviderConfigResponse {
  success: boolean;
  data: LLMProviderConfig;
  message: string | null;
}

export interface HealthCheckResult {
  config: LLMProviderConfig;
  responseTimeMs: number;
  providerReply: string | null;
  toolCallingSupported: boolean | null;
}

export interface HealthCheckResponse {
  success: boolean;
  data: HealthCheckResult;
  message: string | null;
}

export interface CreateLLMProviderConfigBody {
  provider_type?: LLMProviderType;
  api_key: string;
  secret_key?: string | null;
  region?: string | null;
  model_name?: string;
  strong_model_name?: string;
}

/** @deprecated use CreateLLMProviderConfigBody */
export type UpsertLLMProviderConfigBody = CreateLLMProviderConfigBody;

export interface UpdateLLMProviderConfigBody {
  region?: string | null;
  model_name?: string | null;
  strong_model_name?: string | null;
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

function mapConfig(c: LLMProviderConfigApi): LLMProviderConfig {
  return {
    id: c.id,
    userId: c.user_id,
    providerType: c.provider_type,
    name: c.name,
    baseUrl: c.base_url,
    region: c.region,
    modelName: c.model_name,
    strongModelName: c.strong_model_name,
    status: c.status,
    isDefault: c.is_default,
    apiKeySet: c.api_key_set,
    secretKeySet: c.secret_key_set,
    lastCheckedAt: c.last_checked_at,
    lastCheckError: c.last_check_error,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const fetchLlmProviderConfig = {
  /** GET /api/v1/users/me/llm-provider-configs */
  list: async (): Promise<LLMProviderConfigListResponse> => {
    const res = await apiService.get<LLMProviderConfigListApiResponse>(
      "/api/v1/users/me/llm-provider-configs"
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: res.data.data.map(mapConfig),
    };
  },

  /** GET /api/v1/users/me/llm-provider-configs/{config_id} */
  getById: async (configId: string): Promise<LLMProviderConfigResponse> => {
    const res = await apiService.get<LLMProviderConfigSingleApiResponse>(
      `/api/v1/users/me/llm-provider-configs/${encodeURIComponent(configId)}`
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapConfig(res.data.data),
    };
  },

  /** POST /api/v1/users/me/llm-provider-configs */
  create: async (body: CreateLLMProviderConfigBody): Promise<LLMProviderConfigResponse> => {
    const res = await apiService.post<LLMProviderConfigSingleApiResponse>(
      "/api/v1/users/me/llm-provider-configs",
      body
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapConfig(res.data.data),
    };
  },

  /** @deprecated use create */
  upsert: async (body: CreateLLMProviderConfigBody): Promise<LLMProviderConfigResponse> => {
    const res = await apiService.post<LLMProviderConfigSingleApiResponse>(
      "/api/v1/users/me/llm-provider-configs",
      body
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapConfig(res.data.data),
    };
  },

  /** PATCH /api/v1/users/me/llm-provider-configs/{config_id} — model fields only */
  update: async (
    configId: string,
    body: UpdateLLMProviderConfigBody
  ): Promise<LLMProviderConfigResponse> => {
    const res = await apiService.patch<LLMProviderConfigSingleApiResponse>(
      `/api/v1/users/me/llm-provider-configs/${encodeURIComponent(configId)}`,
      body
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapConfig(res.data.data),
    };
  },

  /** DELETE /api/v1/users/me/llm-provider-configs/{config_id} */
  delete: async (configId: string): Promise<void> => {
    await apiService.delete<unknown>(
      `/api/v1/users/me/llm-provider-configs/${encodeURIComponent(configId)}`
    );
  },

  /** POST /api/v1/users/me/llm-provider-configs/{config_id}/health-check */
  healthCheck: async (configId: string): Promise<HealthCheckResponse> => {
    const res = await apiService.post<HealthCheckApiResponse>(
      `/api/v1/users/me/llm-provider-configs/${encodeURIComponent(configId)}/health-check`,
      {}
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: {
        config: mapConfig(res.data.data.config),
        responseTimeMs: res.data.data.response_time_ms,
        providerReply: res.data.data.provider_reply,
        toolCallingSupported: res.data.data.tool_calling_supported,
      },
    };
  },
};
