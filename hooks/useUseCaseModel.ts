"use client";

import { useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { fetchUseCaseModel, generateUseCaseModel } from "@/lib/api/services/useCaseModel";

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
    onSettled: () => client.invalidateQueries({ queryKey }),
  });
  const { mutateAsync } = mutation;
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
  const generate = () => save(async () => {
    const model = await generateUseCaseModel(projectId!, { maxLevel: "L2" });
    client.setQueryData(queryKey, model);
  });
  return {
    ...query, save, generate, saving: mutation.isPending,
    saveError: mutation.error ? getApiErrorMessage(mutation.error, "Could not save use case changes.") : null,
  };
}
