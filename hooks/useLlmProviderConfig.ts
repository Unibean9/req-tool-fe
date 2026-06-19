"use client";

import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCachedGet } from "@/hooks/useCachedGet";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchLlmProviderConfig,
  type LLMProviderConfig,
  type LLMProviderConfigListResponse,
  type LLMProviderConfigResponse,
  type HealthCheckResponse,
  type UpsertLLMProviderConfigBody,
} from "@/lib/api/services/fetchLlmProviderConfig";
import { queryKeys } from "@/lib/query/query-keys";

/** GET /api/v1/users/me/llm-provider-configs — trả list (tối đa 1 item). */
export function useLlmProviderConfigList(options?: { enabled?: boolean }) {
  return useCachedGet<LLMProviderConfigListResponse, Error, LLMProviderConfig[]>({
    queryKey: queryKeys.llmProviderConfigs.list(),
    queryFn: async () => fetchLlmProviderConfig.list(),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

/** Convenience hook — trả active config đầu tiên hoặc `null`. */
export function useActiveLlmProviderConfig(options?: { enabled?: boolean }) {
  return useCachedGet<LLMProviderConfigListResponse, Error, LLMProviderConfig | null>({
    queryKey: queryKeys.llmProviderConfigs.list(),
    queryFn: async () => fetchLlmProviderConfig.list(),
    select: (res) => res.data[0] ?? null,
    enabled: options?.enabled ?? true,
  });
}

/** POST /api/v1/users/me/llm-provider-configs — upsert (tạo mới hoặc update in-place). */
export function useUpsertLlmProviderConfig(
  options?: Omit<
    UseMutationOptions<LLMProviderConfigResponse, Error, UpsertLLMProviderConfigBody>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async (body: UpsertLLMProviderConfigBody): Promise<LLMProviderConfigResponse> => {
      const result = await fetchLlmProviderConfig.upsert(body);
      if (!result.success) throw new Error(result.message ?? "Failed to save LLM config");
      return result;
    },
    onSuccess: (data, variables, context, meta) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.llmProviderConfigs.list() });
      toast.success("LLM config saved");
      userOnSuccess?.(data, variables, context, meta);
    },
    onError: (error, variables, context, meta) => {
      toast.error(getApiErrorMessage(error, "Failed to save LLM config"));
      userOnError?.(error, variables, context, meta);
    },
  });
}

/** DELETE /api/v1/users/me/llm-provider-configs/{config_id}. */
export function useDeleteLlmProviderConfig(
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async (configId: string): Promise<void> => {
      await fetchLlmProviderConfig.delete(configId);
    },
    onSuccess: (data, configId, context, meta) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.llmProviderConfigs.list() });
      void queryClient.removeQueries({ queryKey: queryKeys.llmProviderConfigs.detail(configId) });
      toast.success("LLM config removed");
      userOnSuccess?.(data, configId, context, meta);
    },
    onError: (error, variables, context, meta) => {
      toast.error(getApiErrorMessage(error, "Failed to remove LLM config"));
      userOnError?.(error, variables, context, meta);
    },
  });
}

/** POST /api/v1/users/me/llm-provider-configs/{config_id}/health-check. */
export function useHealthCheckLlmProviderConfig(
  options?: Omit<UseMutationOptions<HealthCheckResponse, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async (configId: string): Promise<HealthCheckResponse> => {
      const result = await fetchLlmProviderConfig.healthCheck(configId);
      if (!result.success) throw new Error(result.message ?? "Health check failed");
      return result;
    },
    onSuccess: (data, configId, context, meta) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.llmProviderConfigs.list() });
      const { responseTimeMs, providerReply } = data.data;
      toast.success(
        `Connection OK — ${responseTimeMs}ms${providerReply ? ` · "${providerReply}"` : ""}`
      );
      userOnSuccess?.(data, configId, context, meta);
    },
    onError: (error, variables, context, meta) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.llmProviderConfigs.list() });
      toast.error(getApiErrorMessage(error, "Connection test failed"));
      userOnError?.(error, variables, context, meta);
    },
  });
}

export type {
  LLMProviderConfig,
  LLMProviderConfigListResponse,
  LLMProviderConfigResponse,
  HealthCheckResponse,
  UpsertLLMProviderConfigBody,
} from "@/lib/api/services/fetchLlmProviderConfig";

export type { LLMProviderType, LLMProviderConfigStatus } from "@/lib/api/services/fetchLlmProviderConfig";
