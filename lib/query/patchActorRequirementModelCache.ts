import type { QueryClient } from "@tanstack/react-query";

import type {
  ActorEpic,
  ActorFeature,
  ActorUserStory,
  RequirementModelPayload,
  RequirementModelResponse,
} from "@/lib/api/services/fetchActor";

import { actorRequirementModelQueryKey } from "./query-keys";

export type MergeActorRequirementModelPatch = {
  epic?: ActorEpic;
  feature?: ActorFeature;
  userStory?: ActorUserStory;
};

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((row) => row.id === item.id);
  if (index === -1) return [...list, item];
  const next = [...list];
  next[index] = item;
  return next;
}

function applyMerge(
  payload: RequirementModelPayload,
  merge: MergeActorRequirementModelPatch
): RequirementModelPayload {
  return {
    ...payload,
    epics: merge.epic ? upsertById(payload.epics, merge.epic) : payload.epics,
    features: merge.feature
      ? upsertById(payload.features, merge.feature)
      : payload.features,
    userStories: merge.userStory
      ? upsertById(payload.userStories, merge.userStory)
      : payload.userStories,
  };
}

/**
 * Ghi epic / feature / story mới (hoặc PATCH) vào cache requirement-model
 * khi mutation tắt invalidate — tránh mất node khi rời tab rồi quay lại.
 */
export function mergeActorRequirementModelCache(
  queryClient: QueryClient,
  projectId: string,
  actorId: string,
  merge: MergeActorRequirementModelPatch
): void {
  const pid = projectId.trim();
  const aid = actorId.trim();
  if (!pid || !aid) return;
  if (!merge.epic && !merge.feature && !merge.userStory) return;

  queryClient.setQueryData<RequirementModelResponse>(
    actorRequirementModelQueryKey(pid, aid),
    (old) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: applyMerge(old.data, merge),
      };
    }
  );
}
