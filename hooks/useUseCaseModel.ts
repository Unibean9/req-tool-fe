"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchUseCaseModel,
  generateGroupUseCases,
  generateUseCaseGroups,
  generateUseCaseRelations,
  updateUseCasePlantUml,
} from "@/lib/api/services/useCaseModel";

export type UseCaseGroupProgress = { current: number; total: number; groupName: string };

export function useUseCaseModel(projectId: string | undefined) {
  const client = useQueryClient();
  const locked = useRef(false);
  const [groupProgress, setGroupProgress] = useState<UseCaseGroupProgress | null>(null);
  const queryKey = ["use-case-model", projectId] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => fetchUseCaseModel(projectId!),
    enabled: Boolean(projectId),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onSuccess: () => { toast.success("Use case model saved."); },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not save use case changes."));
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });
  const relationsMutation = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onSuccess: () => { toast.success("Use case relationships generated."); },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not generate use case relationships."));
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });
  const { mutateAsync } = mutation;
  const { mutateAsync: mutateRelationsAsync } = relationsMutation;
  const save = useCallback(async (operation: () => Promise<unknown>) => {
    if (!projectId || locked.current) return false;
    locked.current = true;
    try {
      await mutateAsync(operation);
      return true;
    } catch {
      return false;
    } finally {
      locked.current = false;
    }
  }, [mutateAsync, projectId]);
  const saveRelations = useCallback(async (operation: () => Promise<unknown>) => {
    if (!projectId || locked.current) return false;
    locked.current = true;
    try {
      await mutateRelationsAsync(operation);
      return true;
    } catch {
      return false;
    } finally {
      locked.current = false;
    }
  }, [mutateRelationsAsync, projectId]);
  // Split-generation flow: a fast deterministic groups pass, then one small LLM call per group
  // for L2 detail -- replaces the old single call that generated the whole project's use cases
  // at once (the thing that used to time out on a larger project). The model updates in the
  // query cache after every group, and groupProgress drives a "Generating group X/N…" indicator
  // instead of one long, silent wait.
  const generate = () => save(async () => {
    setGroupProgress(null);
    const groupsModel = await generateUseCaseGroups(projectId!, { maxLevel: "L2" });
    client.setQueryData(queryKey, groupsModel);
    const groups = groupsModel.useCases.filter((item) => item.level === "L0");
    try {
      for (let index = 0; index < groups.length; index += 1) {
        const group = groups[index];
        setGroupProgress({ current: index + 1, total: groups.length, groupName: group.title });
        const model = await generateGroupUseCases(projectId!, group.id, { maxLevel: "L2" });
        client.setQueryData(queryKey, model);
      }
    } finally {
      setGroupProgress(null);
    }
  });
  const generateRelations = () => saveRelations(async () => {
    const model = await generateUseCaseRelations(projectId!, { maxLevel: "L2" });
    client.setQueryData(queryKey, model);
  });
  const savePlantUml = (source: string) => save(async () => {
    const plantUml = await updateUseCasePlantUml(projectId!, { source });
    client.setQueryData(queryKey, (current: Awaited<ReturnType<typeof fetchUseCaseModel>> | undefined) => current ? { ...current, plantUml } : current);
  });
  return {
    ...query,
    save,
    generate,
    generateRelations,
    savePlantUml,
    saving: mutation.isPending,
    generatingRelations: relationsMutation.isPending,
    groupProgress,
  };
}
