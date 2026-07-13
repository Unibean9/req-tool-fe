import { QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, type UIEvent } from "react";

import { DEFAULT_QUERY_GC_MS, DEFAULT_QUERY_STALE_MS } from "@/lib/query/defaults";
import type { ApiResponse, ListPageMetadata, RequestParams } from "@/types/api";

export interface InfinitePageResult<TItem> {
  pageIndex: number;
  totalPages: number;
  totalItems: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  items: TItem[];
}

interface UseInfinityScrollOptions<TItem, TFilters extends RequestParams = RequestParams> {
  queryKey: QueryKey;
  fetchPage: (
    params: TFilters & { pageNumber: number; pageSize: number }
  ) => Promise<ApiResponse<TItem[], ListPageMetadata>>;
  filters?: TFilters;
  pageSize?: number;
  scrollOffset?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  errorMessage?: string;
  mapItems?: (response: ApiResponse<TItem[], ListPageMetadata>) => TItem[];
}

export function useInfinityScroll<TItem, TFilters extends RequestParams = RequestParams>({
  queryKey,
  fetchPage,
  filters,
  pageSize = 20,
  scrollOffset = 16,
  enabled = true,
  staleTime = DEFAULT_QUERY_STALE_MS,
  gcTime = DEFAULT_QUERY_GC_MS,
  refetchOnWindowFocus = false,
  errorMessage = "Unable to load data",
  mapItems,
}: UseInfinityScrollOptions<TItem, TFilters>) {
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...queryKey, filters ?? {}, pageSize],
    initialPageParam: 1,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    queryFn: async ({ pageParam }): Promise<InfinitePageResult<TItem>> => {
      const response = await fetchPage({
        ...(filters ?? ({} as TFilters)),
        pageNumber: pageParam,
        pageSize,
      });

      if (!response.isSuccess) {
        throw new Error(response.message || errorMessage);
      }

      const pageIndex = response.metadata?.pageNumber ?? pageParam;
      const totalPages = response.metadata?.totalPages ?? pageIndex;
      const totalItems = response.metadata?.totalItems ?? response.data.length;

      return {
        pageIndex,
        totalPages,
        totalItems,
        hasPreviousPage: response.metadata?.hasPreviousPage ?? pageIndex > 1,
        hasNextPage: response.metadata?.hasNextPage ?? pageIndex < totalPages,
        items: mapItems ? mapItems(response) : response.data,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.pageIndex + 1 : undefined),
  });

  const onScrollToLoadMore = useCallback(
    (event: UIEvent<HTMLElement>) => {
      const element = event.currentTarget;
      const reachedBottom =
        element.scrollTop + element.clientHeight >= element.scrollHeight - scrollOffset;

      if (reachedBottom && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
        infiniteQuery.fetchNextPage();
      }
    },
    [infiniteQuery, scrollOffset]
  );

  return {
    ...infiniteQuery,
    onScrollToLoadMore,
  };
}

export const flattenInfinitePages = <TItem,>(pages?: InfinitePageResult<TItem>[]) =>
  pages?.flatMap((page) => page.items) ?? [];
