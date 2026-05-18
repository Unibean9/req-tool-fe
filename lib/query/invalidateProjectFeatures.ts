import type { QueryClient } from "@tanstack/react-query";

const PROJECTS_ROOT = ["projects"] as const;

/** Prefix mọi query GET list features (có/không filter `limit`/`offset`). */
export function projectFeaturesListQueryKeyPrefix(projectId: string) {
  return [...PROJECTS_ROOT, "features", projectId] as const;
}

/** Prefix `useProjectFeaturesInfinityScroll` — mọi filter `epicId` / `status` / `limit`. */
export function projectFeaturesInfiniteQueryKeyPrefix(projectId: string) {
  return [...PROJECTS_ROOT, "features", projectId, "infinite"] as const;
}

/**
 * Làm mới cache list + infinite scroll features sau mutation.
 * Dùng từ `useFeature`, `useEpic` (create feature) — không `invalidateQueries()` không đối số.
 */
export function invalidateProjectFeatureListCaches(
  queryClient: QueryClient,
  projectId: string
): void {
  const pid = projectId.trim();
  if (!pid) return;

  void queryClient.invalidateQueries({
    queryKey: projectFeaturesListQueryKeyPrefix(pid),
  });
  void queryClient.invalidateQueries({
    queryKey: projectFeaturesInfiniteQueryKeyPrefix(pid),
  });
}
