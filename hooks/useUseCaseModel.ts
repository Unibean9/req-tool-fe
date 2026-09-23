"use client";

import { useCallback, useRef } from "react";
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
  const generate = () => save(async () => {
    const model = await generateUseCaseModel(projectId!, { maxLevel: "L2" });
    client.setQueryData(queryKey, model);
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
  };
}
