"use client";

import { useCallback, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchUseCaseModel,
  finalizeUseCaseGeneration,
  generateModuleCandidates,
  generateUseCaseDetails,
  generateUseCaseDiagram,
  generateUseCaseGroups,
  generateUseCaseRelations,
  selectUseCases,
  updateUseCaseDiagramPositions,
  updateUseCasePlantUml,
  type DiagramNodePosition,
  type GenerationProgress,
  type UseCaseDetailStatus,
  type UseCaseModelResponse,
} from "@/lib/api/services/useCaseModel";

// Parallel provider calls per run. Kept modest so a provider's rate limit is not the new bottleneck.
const GENERATION_CONCURRENCY = 4;
// Use cases per detail request: small enough that each request's output stays short.
const DETAIL_BATCH_SIZE = 2;

/** Runs `worker` over `items` with at most `limit` in flight. After the first failure no new item
 * is started; that failure is rethrown once the in-flight ones settle. */
async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  const state: { next: number; failure?: { error: unknown } } = { next: 0 };
  const lane = async () => {
    while (!state.failure && state.next < items.length) {
      const item = items[state.next];
      state.next += 1;
      try {
        await worker(item);
      } catch (error) {
        state.failure ??= { error };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  if (state.failure) throw state.failure.error;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function withProgress(response: UseCaseModelResponse, progress: GenerationProgress): UseCaseModelResponse {
  return { ...response, generation: { ...(response.generation ?? {}), status: "running", progress } };
}

function withDetailStatus(
  current: UseCaseModelResponse,
  statuses: Record<string, UseCaseDetailStatus | undefined>,
): UseCaseModelResponse {
  const detailStatus = { ...(current.generation?.detailStatus ?? {}) };
  for (const [id, status] of Object.entries(statuses)) if (status) detailStatus[id] = status;
  return { ...current, generation: { ...(current.generation ?? {}), detailStatus } };
}

/** Detail responses can arrive out of order, so take only the rows each one was for. */
function mergeDetailRows(current: UseCaseModelResponse, from: UseCaseModelResponse, ids: string[]) {
  const updated = new Map(from.useCases.filter((item) => ids.includes(item.id)).map((item) => [item.id, item]));
  const merged = {
    ...current,
    useCases: current.useCases.map((item) => {
      const next = updated.get(item.id);
      return next ? { ...next, relationshipIds: item.relationshipIds } : item;
    }),
  };
  return withDetailStatus(merged, Object.fromEntries(ids.map((id) => [id, from.generation?.detailStatus?.[id]])));
}

function mergeRelations(current: UseCaseModelResponse, from: UseCaseModelResponse): UseCaseModelResponse {
  const relationshipIds = new Map(from.useCases.map((item) => [item.id, item.relationshipIds]));
  return {
    ...current,
    relationships: from.relationships,
    useCases: current.useCases.map((item) => ({
      ...item,
      relationshipIds: relationshipIds.get(item.id) ?? item.relationshipIds,
    })),
  };
}

export function useUseCaseModel(projectId: string | undefined) {
  const client = useQueryClient();
  const locked = useRef(false);
  const queryKey = useMemo(() => ["use-case-model", projectId] as const, [projectId]);
  const query = useQuery({
    queryKey,
    queryFn: () => fetchUseCaseModel(projectId!),
    enabled: Boolean(projectId),
    retry: false,
    // Generation state is durable on the backend. Do not let the global five-minute
    // cache hide a running marker after a route change, reload, or browser-tab switch.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    // While generateTableMutation is orchestrating (see below), progress is pushed via
    // setQueryData after every phase; a background GET in the middle of that would read back
    // stale persisted state (module/relationship phases don't persist a "running" status the
    // way this hook synthesizes it) and could stop polling early or make the progress bar
    // flicker. Suppress polling for that window.
    refetchInterval: (currentQuery) =>
      !locked.current && currentQuery.state.data?.generation?.status === "running" ? 2000 : false,
    refetchIntervalInBackground: true,
  });

  const saveMutation = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not save use case changes."));
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });

  const relationMutation = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not generate use case relationships."));
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });

  const generateTableMutation = useMutation({
    // A pipeline of short requests instead of one long one: modules/actors, then a cited shortlist
    // per module (in parallel), a deterministic selection of the final rows, then detail batches
    // (in parallel) alongside relationships, and a final validation step. Every provider call
    // has a small output budget, which is what keeps each request far from its timeout.
    //
    // Failure policy: steps 1-3 are fail-fast (without every shortlist there is nothing complete
    // to select from). A detail batch failing only marks those rows failed -- the rest of the
    // table is independent of them -- and they get a Retry action in the table. Nothing is
    // retried automatically.
    mutationFn: async (): Promise<UseCaseModelResponse> => {
      const id = projectId!;
      const update = (patch: (current: UseCaseModelResponse) => UseCaseModelResponse) =>
        client.setQueryData(queryKey, (current: UseCaseModelResponse | undefined) =>
          current ? patch(current) : current,
        );

      const groups = await generateUseCaseGroups(id);
      let proposed = 0;
      const proposing = (): GenerationProgress => ({
        label: "Proposing use cases",
        current: proposed,
        total: groups.modules.length,
      });
      client.setQueryData(queryKey, withProgress(groups, proposing()));
      await runPool(groups.modules, GENERATION_CONCURRENCY, async (useCaseModule) => {
        await generateModuleCandidates(id, useCaseModule.id);
        proposed += 1;
        update((current) => withProgress(current, proposing()));
      });

      const selected = await selectUseCases(id);
      const ids = selected.useCases.map((item) => item.id);
      let written = 0;
      const writing = (): GenerationProgress => ({
        label: "Writing use-case details",
        current: written,
        total: ids.length,
      });
      client.setQueryData(queryKey, withProgress(selected, writing()));

      const details = runPool(chunk(ids, DETAIL_BATCH_SIZE), GENERATION_CONCURRENCY, async (batch) => {
        try {
          const result = await generateUseCaseDetails(id, batch);
          written += batch.length;
          update((current) => withProgress(mergeDetailRows(current, result, batch), writing()));
        } catch {
          written += batch.length;
          update((current) =>
            withProgress(withDetailStatus(current, Object.fromEntries(batch.map((item) => [item, "failed"]))), writing()),
          );
        }
      });
      // Recorded on the run by the backend and reported by finalize, so not rethrown here.
      const relations = ids.length
        ? generateUseCaseRelations(id).then(
            (result) => update((current) => mergeRelations(current, result)),
            () => undefined,
          )
        : Promise.resolve();
      await Promise.all([details, relations]);

      update((current) => withProgress(current, { label: "Validating model" }));
      const final = await finalizeUseCaseGeneration(id);
      client.setQueryData(queryKey, final);
      return final;
    },
    onMutate: () => {
      client.setQueryData(queryKey, (current: UseCaseModelResponse | undefined) => {
        if (!current) return current;
        return withProgress(current, { label: "Extracting modules and actors" });
      });
    },
    onSuccess: (final) => {
      if (final.generation?.status === "completed_with_errors") {
        toast.warning("Use case table generated, but some parts are missing -- see the note above the table.");
      } else {
        toast.success("Use case table generated from the project BRD and PRD.");
      }
    },
    onError: (error) => {
      // The optimistic running marker is useful while the request is in flight, but it must
      // never leave the Generate button disabled after the request has failed. The server
      // revalidation below remains authoritative and will restore `running` if another worker
      // is genuinely still processing the generation.
      const message = getApiErrorMessage(error, "Could not generate the use case table.");
      client.setQueryData(queryKey, (current: UseCaseModelResponse | undefined) => {
        if (!current) return current;
        return {
          ...current,
          generation: {
            ...(current.generation ?? {}),
            status: "failed",
            error: message,
          },
        };
      });
      toast.error(message);
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });

  const retryDetailMutation = useMutation({
    mutationFn: async (useCaseId: string) => {
      const model = await generateUseCaseDetails(projectId!, [useCaseId]);
      client.setQueryData(queryKey, model);
      return model;
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not write this use case's detail."));
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });

  const generateDiagramMutation = useMutation({
    // Its own step, deliberately kept separate from table generation: no LLM call, and the
    // backend refuses it (409) until the table has at least one use case, so the FE gates the
    // "Generate diagram" action behind that instead of offering it before there is anything to
    // lay out.
    mutationFn: async () => {
      const model = await generateUseCaseDiagram(projectId!);
      client.setQueryData(queryKey, model);
      return model;
    },
    onSuccess: () => toast.success("Use case diagram generated."),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not generate the use case diagram."));
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });

  const savePositionsMutation = useMutation({
    // A separate mutation (rather than routing through the generic `save`) so a failure here
    // gets its own message instead of the generic "Could not save use case changes.", and so
    // its pending state can disable just the diagram's own save affordance.
    mutationFn: async (positions: DiagramNodePosition[]) => {
      const model = await updateUseCaseDiagramPositions(projectId!, positions);
      client.setQueryData(queryKey, model);
      return model;
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not save the diagram layout."));
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });

  const runLocked = useCallback(
    async (operation: () => Promise<unknown>, mutation: typeof saveMutation) => {
      if (!projectId || locked.current) return false;
      locked.current = true;
      try {
        await mutation.mutateAsync(operation);
        return true;
      } catch {
        return false;
      } finally {
        locked.current = false;
      }
    },
    [projectId],
  );

  const save = useCallback(
    (operation: () => Promise<unknown>) => runLocked(operation, saveMutation),
    [runLocked, saveMutation],
  );

  const generateTable = useCallback(async () => {
    if (!projectId || locked.current) return false;
    locked.current = true;
    try {
      await generateTableMutation.mutateAsync();
      return true;
    } catch {
      return false;
    } finally {
      locked.current = false;
    }
  }, [generateTableMutation, projectId]);

  const generateDiagram = useCallback(async () => {
    if (!projectId || locked.current) return false;
    locked.current = true;
    try {
      await generateDiagramMutation.mutateAsync();
      return true;
    } catch {
      return false;
    } finally {
      locked.current = false;
    }
  }, [generateDiagramMutation, projectId]);

  const savePositions = useCallback(
    async (positions: DiagramNodePosition[]) => {
      if (!projectId || locked.current || !positions.length) return false;
      locked.current = true;
      try {
        await savePositionsMutation.mutateAsync(positions);
        return true;
      } catch {
        return false;
      } finally {
        locked.current = false;
      }
    },
    [projectId, savePositionsMutation],
  );

  const retryDetail = useCallback(
    async (useCaseId: string) => {
      if (!projectId || locked.current) return false;
      locked.current = true;
      try {
        await retryDetailMutation.mutateAsync(useCaseId);
        return true;
      } catch {
        return false;
      } finally {
        locked.current = false;
      }
    },
    [projectId, retryDetailMutation],
  );

  const generateRelations = useCallback(
    () =>
      runLocked(
        async () => {
          const model = await generateUseCaseRelations(projectId!);
          client.setQueryData(queryKey, model);
          return model;
        },
        relationMutation,
      ),
    [client, projectId, queryKey, relationMutation, runLocked],
  );

  const savePlantUml = useCallback(
    (source: string) =>
      save(async () => {
        const plantUml = await updateUseCasePlantUml(projectId!, { source });
        client.setQueryData(queryKey, (current: UseCaseModelResponse | undefined) =>
          current ? { ...current, plantUml } : current,
        );
        return plantUml;
      }),
    [client, projectId, queryKey, save],
  );

  return {
    ...query,
    save,
    generateTable,
    generateDiagram,
    generateRelations,
    savePlantUml,
    savePositions,
    retryDetail,
    retryingDetailId: retryDetailMutation.isPending ? retryDetailMutation.variables : undefined,
    saving: saveMutation.isPending,
    generatingTable: generateTableMutation.isPending,
    generatingDiagram: generateDiagramMutation.isPending,
    generatingRelations: relationMutation.isPending,
    savingPositions: savePositionsMutation.isPending,
  };
}
