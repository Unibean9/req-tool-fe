"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useCachedGet } from "@/hooks/useCachedGet";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { fetchProject } from "@/lib/api/services/fetchProject";
import { getNextProjectSlugAfterDelete } from "@/lib/project/projectListNav";
import {
  orgProjectQueryKey,
  orgProjectsQueryKey,
} from "@/lib/query/query-keys";

import type {
  CreateOrgProjectRequest,
  CreateOrgProjectResponse,
  GetOrgProjectParams,
  OrgProject,
  OrgProjectDetailResponse,
  OrgProjectsListResponse,
  UpdateOrgProjectRequest,
  UpdateOrgProjectResponse,
} from "@/lib/api/services/fetchProject";

type CreateOrgProjectVariables = {
  orgId: string;
  body: CreateOrgProjectRequest;
};

type UpdateOrgProjectVariables = {
  orgId: string;
  projectId: string;
  body: UpdateOrgProjectRequest;
};

type DeleteOrgProjectVariables = { orgId: string; projectId: string };

export type DeleteOrgProjectMutationContext = {
  previousList: OrgProjectsListResponse | undefined;
  nextSlug: string | null;
};

/** GET /api/v1/orgs/{org_id}/projects */
export function useOrgProjects(
  orgId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const id = orgId?.trim() ?? "";
  const enabled = Boolean(id) && (options?.enabled ?? true);

  return useCachedGet<OrgProjectsListResponse, Error, OrgProject[]>({
    queryKey: orgProjectsQueryKey(id),
    queryFn: async () => fetchProject.listOrgProjects({ orgId: id }),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET list; trả full envelope `{ success, data, message }`. */
export function useOrgProjectsFull(
  orgId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const id = orgId?.trim() ?? "";
  const enabled = Boolean(id) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: orgProjectsQueryKey(id),
    queryFn: () => fetchProject.listOrgProjects({ orgId: id }),
    enabled,
  });
}

type UseOrgProjectArg =
  | string
  | null
  | undefined
  | GetOrgProjectParams
  | { orgId: string | null | undefined; projectId: string | null | undefined };

function resolveUseOrgProjectIds(
  orgIdOrParams: UseOrgProjectArg,
  projectIdArg?: string | null | undefined
): GetOrgProjectParams | null {
  if (orgIdOrParams && typeof orgIdOrParams === "object") {
    if ("projectId" in orgIdOrParams && "orgId" in orgIdOrParams) {
      const orgId = orgIdOrParams.orgId?.trim() ?? "";
      const projectId = orgIdOrParams.projectId?.trim() ?? "";
      if (!orgId || !projectId) return null;
      return { orgId, projectId };
    }
  }
  const orgId =
    typeof orgIdOrParams === "string" ? orgIdOrParams.trim() : "";
  const projectId = projectIdArg?.trim() ?? "";
  if (!orgId || !projectId) return null;
  return { orgId, projectId };
}

/** GET /api/v1/orgs/{org_id}/projects/{project_id} */
export function useOrgProject(
  orgIdOrParams: UseOrgProjectArg,
  projectId?: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const ids = resolveUseOrgProjectIds(orgIdOrParams, projectId);
  const enabled = Boolean(ids) && (options?.enabled ?? true);

  return useCachedGet<OrgProjectDetailResponse, Error, OrgProject>({
    queryKey: orgProjectQueryKey(ids?.orgId ?? "", ids?.projectId ?? ""),
    queryFn: async () =>
      fetchProject.getOrgProject({
        orgId: ids!.orgId,
        projectId: ids!.projectId,
      }),
    select: (res) => res.data,
    enabled,
  });
}

/** Cùng GET detail; trả full envelope. */
export function useOrgProjectFull(
  orgIdOrParams: UseOrgProjectArg,
  projectId?: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const ids = resolveUseOrgProjectIds(orgIdOrParams, projectId);
  const enabled = Boolean(ids) && (options?.enabled ?? true);

  return useCachedGet({
    queryKey: orgProjectQueryKey(ids?.orgId ?? "", ids?.projectId ?? ""),
    queryFn: () =>
      fetchProject.getOrgProject({
        orgId: ids!.orgId,
        projectId: ids!.projectId,
      }),
    enabled,
  });
}

/** POST /api/v1/orgs/{org_id}/projects */
export function useCreateOrgProject(
  options?: Omit<
    UseMutationOptions<
      CreateOrgProjectResponse,
      Error,
      CreateOrgProjectVariables
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      orgId,
      body,
    }: CreateOrgProjectVariables): Promise<CreateOrgProjectResponse> => {
      const result = await fetchProject.createOrgProject(orgId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to create project");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      const key = orgProjectsQueryKey(variables.orgId);
      queryClient.setQueryData<OrgProjectsListResponse>(key, (old) => {
        const created = data.data;
        if (!old?.data?.length) {
          return { success: true, data: [created], message: data.message };
        }
        if (
          old.data.some(
            (p) => p.id === created.id || p.slug === created.slug
          )
        ) {
          return old;
        }
        return { ...old, data: [...old.data, created] };
      });
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success("Project created");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to create project"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/** PATCH /api/v1/orgs/{org_id}/projects/{project_id} */
export function useUpdateOrgProject(
  options?: Omit<
    UseMutationOptions<
      UpdateOrgProjectResponse,
      Error,
      UpdateOrgProjectVariables
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      orgId,
      projectId,
      body,
    }: UpdateOrgProjectVariables): Promise<UpdateOrgProjectResponse> => {
      const result = await fetchProject.updateOrgProject(orgId, projectId, body);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to update project");
      }
      return result;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      const updated = data.data;
      queryClient.setQueryData<OrgProjectDetailResponse>(
        orgProjectQueryKey(variables.orgId, variables.projectId),
        data
      );
      queryClient.setQueryData<OrgProjectsListResponse>(
        orgProjectsQueryKey(variables.orgId),
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((p) => (p.id === updated.id ? updated : p)),
          };
        }
      );
      void queryClient.invalidateQueries({
        queryKey: orgProjectsQueryKey(variables.orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: orgProjectQueryKey(variables.orgId, variables.projectId),
      });
      toast.success("Project updated");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to update project"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

/** DELETE /api/v1/orgs/{org_id}/projects/{project_id} */
export function useDeleteOrgProject(
  options?: Omit<
    UseMutationOptions<
      void,
      Error,
      DeleteOrgProjectVariables,
      DeleteOrgProjectMutationContext
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onMutate: userOnMutate,
    ...rest
  } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({
      orgId,
      projectId,
    }: DeleteOrgProjectVariables): Promise<void> => {
      await fetchProject.deleteOrgProject(orgId, projectId);
    },
    onMutate: async (variables) => {
      const listKey = orgProjectsQueryKey(variables.orgId);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousList =
        queryClient.getQueryData<OrgProjectsListResponse>(listKey);
      const list = previousList?.data ?? [];
      const nextSlug = getNextProjectSlugAfterDelete(list, variables.projectId);

      if (previousList?.data) {
        queryClient.setQueryData<OrgProjectsListResponse>(listKey, {
          ...previousList,
          data: previousList.data.filter((p) => p.id !== variables.projectId),
        });
      }

      await userOnMutate?.(variables, undefined as never);
      return { previousList, nextSlug };
    },
    onSuccess: (data, variables, mutateContext, mutationContext) => {
      userOnSuccess?.(data, variables, mutateContext, mutationContext);
      void queryClient.removeQueries({
        queryKey: orgProjectQueryKey(variables.orgId, variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: orgProjectsQueryKey(variables.orgId),
      });
      toast.success("Project deleted");
    },
    onError: (error, variables, mutateContext, mutationContext) => {
      if (mutateContext?.previousList) {
        queryClient.setQueryData(
          orgProjectsQueryKey(variables.orgId),
          mutateContext.previousList
        );
      }
      toast.error(getApiErrorMessage(error, "Failed to delete project"));
      userOnError?.(error, variables, mutateContext, mutationContext);
    },
  });
}

export type {
  CreateOrgProjectRequest,
  CreateOrgProjectResponse,
  GetOrgProjectParams,
  ListOrgProjectsParams,
  OrgProject,
  OrgProjectDetailResponse,
  OrgProjectsListResponse,
  UpdateOrgProjectRequest,
  UpdateOrgProjectResponse,
} from "@/lib/api/services/fetchProject";
