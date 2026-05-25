"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useCallback, type UIEvent } from "react";
import { toast } from "sonner";

import { useCachedGet } from "@/hooks/useCachedGet";
import { DEFAULT_QUERY_GC_MS, DEFAULT_QUERY_STALE_MS } from "@/lib/query/defaults";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { fetchUser } from "@/lib/api/services/fetchUser";
import { queryKeys } from "@/lib/query/query-keys";

import type {
  AddOrgMembersRequest,
  AddOrgMembersResponse,
  OrgMember,
  OrgMembersListParams,
  OrgMembersResponse,
  OrgMemberSearchResponse,
  OrgMemberSearchUser,
  UserMeResponse,
  UserProfile,
  UserSearchResponse,
  UserSearchUser,
} from "@/lib/api/services/fetchUser";

const DEFAULT_ORG_MEMBERS_LIMIT = 20;

/** GET /api/v1/users/me — `data` đã map camelCase. */
export function useUserMe(options?: { enabled?: boolean }) {
  return useCachedGet<UserMeResponse, Error, UserProfile>({
    queryKey: queryKeys.users.me(),
    queryFn: async () => fetchUser.getMe(),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useUserMeFull(options?: { enabled?: boolean }) {
  return useCachedGet({
    queryKey: queryKeys.users.me(),
    queryFn: () => fetchUser.getMe(),
    enabled: options?.enabled ?? true,
  });
}

/**
 * GET /api/v1/orgs/:org_id/members — query `q`, `role`, `limit`, `offset`.
 * `orgId` rỗng thì `enabled: false`.
 */
export function useOrgMembers(
  orgId: string | null | undefined,
  options?: {
    enabled?: boolean;
    q?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }
) {
  const id = orgId?.trim() ?? "";
  const enabled = Boolean(id) && (options?.enabled ?? true);
  const qNorm = options?.q?.trim() ?? "";
  const roleNorm = options?.role?.trim() ?? "";
  const limit = options?.limit ?? DEFAULT_ORG_MEMBERS_LIMIT;
  const offset = options?.offset ?? 0;

  const listParams: OrgMembersListParams = {
    limit,
    offset,
    ...(qNorm ? { q: qNorm } : {}),
    ...(roleNorm ? { role: roleNorm } : {}),
  };

  return useCachedGet<OrgMembersResponse, Error, OrgMember[]>({
    queryKey: queryKeys.orgs.membersPage(id, qNorm, roleNorm, limit, offset),
    queryFn: async () => fetchUser.listOrgMembers(id, listParams),
    select: (res) => res.data,
    enabled,
  });
}

export function useOrgMembersFull(
  orgId: string | null | undefined,
  options?: {
    enabled?: boolean;
    q?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }
) {
  const id = orgId?.trim() ?? "";
  const enabled = Boolean(id) && (options?.enabled ?? true);
  const qNorm = options?.q?.trim() ?? "";
  const roleNorm = options?.role?.trim() ?? "";
  const limit = options?.limit ?? DEFAULT_ORG_MEMBERS_LIMIT;
  const offset = options?.offset ?? 0;

  const listParams: OrgMembersListParams = {
    limit,
    offset,
    ...(qNorm ? { q: qNorm } : {}),
    ...(roleNorm ? { role: roleNorm } : {}),
  };

  return useCachedGet({
    queryKey: queryKeys.orgs.membersPage(id, qNorm, roleNorm, limit, offset),
    queryFn: () => fetchUser.listOrgMembers(id, listParams),
    enabled,
  });
}

/** Một trang trong `useOrgMembersScrollInfinity`. */
export interface OrgMembersInfinitePage {
  offset: number;
  limit: number;
  items: OrgMember[];
}

/**
 * GET `/api/v1/orgs/:org_id/members` với `q`, `role`, `limit`, `offset` — infinite scroll + `onScrollToLoadMore`.
 */
export function useOrgMembersScrollInfinity(
  orgId: string | null | undefined,
  options?: {
    q?: string;
    role?: string;
    limit?: number;
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    scrollOffset?: number;
  }
) {
  const id = orgId?.trim() ?? "";
  const limit = options?.limit ?? DEFAULT_ORG_MEMBERS_LIMIT;
  const qNorm = (options?.q ?? "").trim();
  const roleNorm = (options?.role ?? "").trim();
  const enabled = Boolean(id) && (options?.enabled ?? true);
  const scrollOffset = options?.scrollOffset ?? 16;
  const staleTime = options?.staleTime ?? DEFAULT_QUERY_STALE_MS;
  const gcTime = options?.gcTime ?? DEFAULT_QUERY_GC_MS;
  const refetchOnWindowFocus = options?.refetchOnWindowFocus ?? false;

  const infiniteQuery = useInfiniteQuery({
    queryKey: queryKeys.orgs.membersInfinite(id, qNorm, roleNorm, limit),
    initialPageParam: 0,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    queryFn: async ({ pageParam }): Promise<OrgMembersInfinitePage> => {
      const offset = pageParam;
      const res = await fetchUser.listOrgMembers(id, {
        q: qNorm || undefined,
        role: roleNorm || undefined,
        limit,
        offset,
      });
      if (!res.success) {
        throw new Error(res.message ?? "Failed to load member list");
      }
      return { offset, limit, items: res.data };
    },
    getNextPageParam: (lastPage) =>
      lastPage.items.length < lastPage.limit
        ? undefined
        : lastPage.offset + lastPage.limit,
  });

  const onScrollToLoadMore = useCallback(
    (event: UIEvent<HTMLElement>) => {
      const element = event.currentTarget;
      const reachedBottom =
        element.scrollTop + element.clientHeight >=
        element.scrollHeight - scrollOffset;

      if (
        reachedBottom &&
        infiniteQuery.hasNextPage &&
        !infiniteQuery.isFetchingNextPage
      ) {
        void infiniteQuery.fetchNextPage();
      }
    },
    [infiniteQuery, scrollOffset]
  );

  return {
    ...infiniteQuery,
    onScrollToLoadMore,
  };
}

export function flattenOrgMembersInfinitePages(
  pages: OrgMembersInfinitePage[] | undefined
): OrgMember[] {
  return pages?.flatMap((p) => p.items) ?? [];
}

/**
 * GET /api/v1/orgs/:org_id/members/search?q=
 * `q` rỗng hoặc không có `orgId` thì `enabled: false`.
 */
export function useOrgMemberSearch(
  orgId: string | null | undefined,
  q: string,
  options?: { enabled?: boolean }
) {
  const id = orgId?.trim() ?? "";
  const query = q.trim();
  const enabled =
    Boolean(id && query.length > 0) && (options?.enabled ?? true);

  return useCachedGet<OrgMemberSearchResponse, Error, OrgMemberSearchUser[]>({
    queryKey: queryKeys.orgs.memberSearch(id, query),
    queryFn: async () => fetchUser.searchOrgMembers(id, query),
    select: (res) => res.data,
    enabled,
  });
}

export function useOrgMemberSearchFull(
  orgId: string | null | undefined,
  q: string,
  options?: { enabled?: boolean }
) {
  const id = orgId?.trim() ?? "";
  const query = q.trim();
  const enabled =
    Boolean(id && query.length > 0) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: queryKeys.orgs.memberSearch(id, query),
    queryFn: () => fetchUser.searchOrgMembers(id, query),
    enabled,
  });
}

const DEFAULT_USER_SEARCH_LIMIT = 20;

/**
 * GET /api/v1/users/search — `q`, `limit`, `offset`.
 * `q` rỗng thì `enabled: false` (trừ khi ghi đè `enabled`).
 */
export function useUserSearch(
  q: string,
  options?: {
    limit?: number;
    offset?: number;
    enabled?: boolean;
  }
) {
  const limit = options?.limit ?? DEFAULT_USER_SEARCH_LIMIT;
  const offset = options?.offset ?? 0;
  const query = q.trim();
  const enabled = (options?.enabled ?? true) && query.length > 0;

  return useCachedGet<UserSearchResponse, Error, UserSearchUser[]>({
    queryKey: queryKeys.users.search(query, limit, offset),
    queryFn: async () =>
      fetchUser.searchUsers({ q: query, limit, offset }),
    select: (res) => res.data,
    enabled,
  });
}

export function useUserSearchFull(
  q: string,
  options?: {
    limit?: number;
    offset?: number;
    enabled?: boolean;
  }
) {
  const limit = options?.limit ?? DEFAULT_USER_SEARCH_LIMIT;
  const offset = options?.offset ?? 0;
  const query = q.trim();
  const enabled = (options?.enabled ?? true) && query.length > 0;

  return useCachedGet({
    queryKey: queryKeys.users.search(query, limit, offset),
    queryFn: () => fetchUser.searchUsers({ q: query, limit, offset }),
    enabled,
  });
}

/** Một trang trong `useUserSearchInfiniteScroll` (theo offset + limit). */
export interface UserSearchInfinitePage {
  offset: number;
  limit: number;
  items: UserSearchUser[];
}

/**
 * GET `/api/v1/users/search` với `limit` / `offset` lặp qua `useInfiniteQuery` + handler cuộn tải thêm.
 */
export function useUserSearchInfiniteScroll(
  q: string,
  options?: {
    limit?: number;
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    scrollOffset?: number;
  }
) {
  const limit = options?.limit ?? DEFAULT_USER_SEARCH_LIMIT;
  const query = q.trim();
  const enabled = (options?.enabled ?? true) && query.length > 0;
  const scrollOffset = options?.scrollOffset ?? 16;
  const staleTime = options?.staleTime ?? DEFAULT_QUERY_STALE_MS;
  const gcTime = options?.gcTime ?? DEFAULT_QUERY_GC_MS;
  const refetchOnWindowFocus = options?.refetchOnWindowFocus ?? false;

  const infiniteQuery = useInfiniteQuery({
    queryKey: queryKeys.users.searchInfinite(query, limit),
    initialPageParam: 0,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    queryFn: async ({ pageParam }): Promise<UserSearchInfinitePage> => {
      const offset = pageParam;
      const res = await fetchUser.searchUsers({ q: query, limit, offset });
      if (!res.success) {
        throw new Error(res.message ?? "Failed to load data");
      }
      return { offset, limit, items: res.data };
    },
    getNextPageParam: (lastPage) =>
      lastPage.items.length < lastPage.limit
        ? undefined
        : lastPage.offset + lastPage.limit,
  });

  const onScrollToLoadMore = useCallback(
    (event: UIEvent<HTMLElement>) => {
      const element = event.currentTarget;
      const reachedBottom =
        element.scrollTop + element.clientHeight >=
        element.scrollHeight - scrollOffset;

      if (
        reachedBottom &&
        infiniteQuery.hasNextPage &&
        !infiniteQuery.isFetchingNextPage
      ) {
        void infiniteQuery.fetchNextPage();
      }
    },
    [infiniteQuery, scrollOffset]
  );

  return {
    ...infiniteQuery,
    onScrollToLoadMore,
  };
}

export function flattenUserSearchInfinitePages(
  pages: UserSearchInfinitePage[] | undefined
): UserSearchUser[] {
  return pages?.flatMap((p) => p.items) ?? [];
}

type AddOrgMembersVariables = {
  orgId: string;
  body: AddOrgMembersRequest;
};

export function useAddOrgMember(
  options?: Omit<
    UseMutationOptions<AddOrgMembersResponse, Error, AddOrgMembersVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      orgId,
      body,
    }: AddOrgMembersVariables): Promise<AddOrgMembersResponse> => {
      const result = await fetchUser.addOrgMembers(orgId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to add member");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orgs.members(variables.orgId),
      });
      const { added, skipped, notFound } = data.data;
      if (added.length > 0) {
        const extra: string[] = [];
        if (skipped.length > 0) extra.push(`skipped ${skipped.length}`);
        if (notFound.length > 0) extra.push(`not found ${notFound.length}`);
        toast.success(
          added.length === 1
            ? `Member added${extra.length ? ` (${extra.join(", ")})` : ""}`
            : `Member added ${added.length}${extra.length ? ` (${extra.join(", ")})` : ""}`
        );
      } else {
        toast.warning(
          notFound.length > 0
            ? `Not found: ${notFound.join(", ")}`
            : skipped.length > 0
              ? `Skipped: ${skipped.join(", ")}`
              : "Failed to add member"
        );
      }
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to add member"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type RemoveOrgMemberVariables = { orgId: string; userId: string };

/**
 * DELETE /api/v1/orgs/:org_id/members/:user_id
 */
export function useRemoveOrgMember(
  options?: Omit<
    UseMutationOptions<void, Error, RemoveOrgMemberVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      orgId,
      userId,
    }: RemoveOrgMemberVariables): Promise<void> => {
      await fetchUser.removeOrgMember(orgId, userId);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orgs.members(variables.orgId),
      });
      toast.success("Member deleted");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to delete member"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

export type { UserMeResponse, UserProfile };

export type {
  OrgMember,
  OrgMemberUser,
  OrgMembersListParams,
  OrgMembersResponse,
  AddOrgMembersRequest,
  AddOrgMembersResponse,
  OrgMemberInviteItem,
  OrgMemberDeleteErrorBody,
  OrgMemberDeleteValidationItem,
  OrgMemberSearchUser,
  OrgMemberSearchResponse,
  UserSearchParams,
  UserSearchUser,
  UserSearchResponse,
} from "@/lib/api/services/fetchUser";
