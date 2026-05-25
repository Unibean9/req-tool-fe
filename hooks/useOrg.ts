"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useCachedGet } from "@/hooks/useCachedGet";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { fetchOrg } from "@/lib/api/services/fetchOrg";
import { queryKeys } from "@/lib/query/query-keys";

import type {
  CreateOrgRequest,
  CreateOrgResponse,
  Org,
  OrgDetailResponse,
  OrgsMeResponse,
} from "@/lib/api/services/fetchOrg";

export function useOrgMe(
  options?: { enabled?: boolean }
) {
  return useCachedGet<OrgsMeResponse, Error, Org[]>({
    queryKey: queryKeys.orgs.me(),
    queryFn: async () => fetchOrg.getMine(),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useOrgMeFull(
  options?: { enabled?: boolean }
) {
  return useCachedGet({
    queryKey: queryKeys.orgs.me(),
    queryFn: () => fetchOrg.getMine(),
    enabled: options?.enabled ?? true,
  });
}

/**
 * GET /api/v1/orgs/:org_id — chi tiết org; `orgId` rỗng thì `enabled: false`.
 */
export function useOrgDetail(
  orgId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const id = orgId?.trim() ?? "";
  const enabled = Boolean(id) && (options?.enabled ?? true);

  return useCachedGet<OrgDetailResponse, Error, Org>({
    queryKey: queryKeys.orgs.detail(id),
    queryFn: async () => fetchOrg.getById(id),
    select: (res) => res.data,
    enabled,
  });
}

export function useOrgDetailFull(
  orgId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const id = orgId?.trim() ?? "";
  const enabled = Boolean(id) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: queryKeys.orgs.detail(id),
    queryFn: () => fetchOrg.getById(id),
    enabled,
  });
}

/**
 * POST /api/v1/orgs — tạo org; toast + invalidate `queryKeys.orgs.me()`; có thể truyền thêm `onSuccess` / `onError` (chạy sau toast).
 */
export function useCreateOrg(
  options?: Omit<
    UseMutationOptions<CreateOrgResponse, Error, CreateOrgRequest>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async (body: CreateOrgRequest): Promise<CreateOrgResponse> => {
      const result = await fetchOrg.create({ name: body.name.trim() });
      if (!result.success) {
        throw new Error(result.message ?? "Failed to create organization");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs.me() });
      toast.success("Organization created");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to create organization"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type {
  CreateOrgRequest,
  CreateOrgResponse,
  Org,
  OrgDetailResponse,
  OrgsMeResponse,
};
