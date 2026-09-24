"use client";

import { useCallback, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchUseCaseModel,
  generateUseCaseModel,
  generateUseCaseRelations,
  updateUseCasePlantUml,
} from "@/lib/api/services/useCaseModel";

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
    refetchInterval: (currentQuery) =>
      currentQuery.state.data?.generation?.status === "running" ? 2000 : false,
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

  const generateMutation = useMutation({
    mutationFn: async () => {
      const model = await generateUseCaseModel(projectId!);
      client.setQueryData(queryKey, model);
      return model;
    },
    onMutate: () => {
      client.setQueryData(queryKey, (current: Awaited<ReturnType<typeof fetchUseCaseModel>> | undefined) => {
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
    onSuccess: () => toast.success("Use case table and diagram generated from the project BRD and PRD."),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not generate the use case table."));
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

  const generate = useCallback(async () => {
    if (!projectId || locked.current) return false;
    locked.current = true;
    try {
      await generateMutation.mutateAsync();
      return true;
    } catch {
      return false;
    } finally {
      locked.current = false;
    }
  }, [generateMutation, projectId]);

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
        client.setQueryData(queryKey, (current: Awaited<ReturnType<typeof fetchUseCaseModel>> | undefined) =>
          current ? { ...current, plantUml } : current,
        );
        return plantUml;
      }),
    [client, projectId, queryKey, save],
  );

  return {
    ...query,
    save,
    generate,
    generateRelations,
    savePlantUml,
    saving: saveMutation.isPending,
    generating: generateMutation.isPending,
    generatingRelations: relationMutation.isPending,
  };
}
