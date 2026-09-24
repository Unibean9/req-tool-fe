"use client";

import { useCallback, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchUseCaseModel,
  generateGroupUseCases,
  generateUseCaseDiagram,
  generateUseCaseGroups,
  generateUseCaseRelations,
  updateUseCasePlantUml,
  type UseCaseModelResponse,
} from "@/lib/api/services/useCaseModel";

type StageStatus = "pending" | "running" | "completed" | "failed";
type GenerationStages = Record<"source" | "table" | "relationships" | "validation", StageStatus>;

function withProgress(
  response: UseCaseModelResponse,
  patch: {
    status: "running" | "completed" | "failed";
    batchCount: number;
    completedBatchCount: number;
    stages: GenerationStages;
    error?: string;
  },
): UseCaseModelResponse {
  return {
    ...response,
    generation: {
      ...(response.generation ?? {}),
      ...patch,
      generationMode: "module-batch",
    },
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
    // Runs table generation as a sequence of short, independently-timed requests (module
    // extraction, then one request per module, then relationships) instead of a single request
    // that blocks for the whole pipeline. That single long-lived request was the source of
    // "timeout exceeded" failures on projects with several modules -- each step here has its
    // own bounded backend timeout and is persisted as soon as it completes.
    //
    // Deliberately stops at the first failure instead of skipping the failed module and
    // continuing (no silent partial/best-effort table): whatever succeeded before the failure
    // is already saved server-side, but the run itself surfaces as failed so it is obvious
    // something needs attention, and the user re-runs Generate rather than the hook retrying
    // on its own.
    mutationFn: async (): Promise<UseCaseModelResponse> => {
      const pendingStages: GenerationStages = {
        source: "completed",
        table: "running",
        relationships: "pending",
        validation: "pending",
      };
      const groups = await generateUseCaseGroups(projectId!);
      const total = groups.modules.length;
      let current = withProgress(groups, {
        status: "running",
        batchCount: total,
        completedBatchCount: 0,
        stages: { ...pendingStages, table: total > 0 ? "running" : "completed" },
      });
      client.setQueryData(queryKey, current);

      for (let index = 0; index < groups.modules.length; index += 1) {
        const useCaseModule = groups.modules[index];
        const moduleResult = await generateGroupUseCases(projectId!, useCaseModule.id);
        current = withProgress(moduleResult, {
          status: "running",
          batchCount: total,
          completedBatchCount: index + 1,
          stages: { ...pendingStages, table: index + 1 < total ? "running" : "completed" },
        });
        client.setQueryData(queryKey, current);
      }

      current = withProgress(current, {
        status: "running",
        batchCount: total,
        completedBatchCount: total,
        stages: { ...pendingStages, table: "completed", relationships: "running" },
      });
      client.setQueryData(queryKey, current);
      // Always call this, even with zero use cases -- it is table generation's last phase and
      // is what resolves the running marker to a terminal status either way.
      const withRelations = await generateUseCaseRelations(projectId!);
      current = withProgress(withRelations, {
        status: "completed",
        batchCount: total,
        completedBatchCount: total,
        stages: { ...pendingStages, table: "completed", relationships: "completed", validation: "completed" },
      });
      client.setQueryData(queryKey, current);
      return current;
    },
    onMutate: () => {
      client.setQueryData(queryKey, (current: UseCaseModelResponse | undefined) => {
        if (!current) return current;
        return {
          ...current,
          generation: {
            ...(current.generation ?? {}),
            status: "running",
          },
        };
      });
    },
    onSuccess: () => toast.success("Use case table generated from the project BRD and PRD."),
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
    saving: saveMutation.isPending,
    generatingTable: generateTableMutation.isPending,
    generatingDiagram: generateDiagramMutation.isPending,
    generatingRelations: relationMutation.isPending,
  };
}
