import type { QueryClient } from "@tanstack/react-query";

import {
  actorCanvasLayoutQueryKey,
  actorRequirementModelQueryKey,
} from "./query-keys";

export type InvalidateActorWorkspaceOptions = {
  /** Mặc định true */
  requirementModel?: boolean;
  /** Mặc định true */
  canvasLayout?: boolean;
};

/**
 * Làm mới cache workspace actor sau mutation epic / feature / layout.
 * Dùng từ `useActor`, `useEpic` — không gọi `invalidateQueries()` không đối số.
 */
export function invalidateActorWorkspaceQueries(
  queryClient: QueryClient,
  projectId: string,
  actorId: string,
  options?: InvalidateActorWorkspaceOptions
): void {
  const pid = projectId.trim();
  const aid = actorId.trim();
  if (!pid || !aid) return;

  const { requirementModel = true, canvasLayout = true } = options ?? {};

  if (requirementModel) {
    void queryClient.invalidateQueries({
      queryKey: actorRequirementModelQueryKey(pid, aid),
    });
  }
  if (canvasLayout) {
    void queryClient.invalidateQueries({
      queryKey: actorCanvasLayoutQueryKey(pid, aid),
    });
  }
}
