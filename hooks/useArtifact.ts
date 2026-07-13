"use client";

import {
  keepPreviousData,
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useCachedGet } from "@/hooks/useCachedGet";
import {
  getApiErrorMessage,
  getDependencyConflictArtifactIds,
} from "@/lib/api/getApiErrorMessage";
import {
  fetchArtifact,
  type Artifact,
  type ArtifactEvidence,
  type ArtifactEvidenceListResponse,
  type ArtifactEvidenceResponse,
  type ArtifactGraphResponse,
  type ArtifactListResponse,
  type ArtifactResponse,
  type ArtifactVersionReviewResponse,
  type CreateArtifactEvidenceRequest,
  type CreateArtifactRequest,
  type ListArtifactsParams,
  type ReviewArtifactVersionRequest,
  type UpdateArtifactRequest,
} from "@/lib/api/services/fetchArtifact";
import {
  projectArtifactGraphQueryKey,
  projectArtifactQueryKey,
  projectArtifactEvidenceQueryKey,
  projectArtifactsQueryKey,
  projectArtifactsQueryRoot,
  projectBrdExportQueryRoot,
  projectPrdExportQueryRoot,
} from "@/lib/query/query-keys";

// ─── Invalidation helpers ─────────────────────────────────────────────────────

function invalidateArtifacts(queryClient: QueryClient, projectId: string) {
  void queryClient.invalidateQueries({
    queryKey: projectArtifactsQueryRoot(projectId),
    exact: false,
  });
}

function invalidateArtifactDetail(
  queryClient: QueryClient,
  projectId: string,
  artifactId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectArtifactQueryKey(projectId, artifactId),
  });
}

function invalidateArtifactGraph(queryClient: QueryClient, projectId: string) {
  void queryClient.invalidateQueries({
    queryKey: projectArtifactGraphQueryKey(projectId),
  });
}

function invalidateBrdExport(queryClient: QueryClient, projectId: string) {
  void queryClient.invalidateQueries({
    queryKey: projectBrdExportQueryRoot(projectId),
    exact: false,
    refetchType: "active",
  });
}

function invalidatePrdExport(queryClient: QueryClient, projectId: string) {
  void queryClient.invalidateQueries({
    queryKey: projectPrdExportQueryRoot(projectId),
    exact: false,
    refetchType: "active",
  });
}

function invalidateArtifactEvidence(
  queryClient: QueryClient,
  projectId: string,
  artifactId: string
) {
  void queryClient.invalidateQueries({
    queryKey: projectArtifactEvidenceQueryKey(projectId, artifactId),
  });
}

// ─── GET hooks ────────────────────────────────────────────────────────────────

/** GET /api/v1/projects/{project_id}/artifacts */
export function useProjectArtifacts(
  projectId: string | null | undefined,
  params?: ListArtifactsParams,
  options?: { enabled?: boolean; keepPreviousData?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ArtifactListResponse, Error, Artifact[]>({
    queryKey: projectArtifactsQueryKey(pid, params),
    queryFn: () => fetchArtifact.list(pid, params),
    select: (res) => res.data,
    enabled,
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
  });
}

/** GET /api/v1/projects/{project_id}/artifacts/{artifact_id} */
export function useProjectArtifact(
  projectId: string | null | undefined,
  artifactId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const aid = artifactId?.trim() ?? "";
  const enabled = Boolean(pid) && Boolean(aid) && (options?.enabled ?? true);

  return useCachedGet<ArtifactResponse, Error, Artifact>({
    queryKey: projectArtifactQueryKey(pid, aid),
    queryFn: () => fetchArtifact.getById(pid, aid),
    select: (res) => res.data,
    enabled,
    staleTime: 0,
  });
}

/** GET /api/v1/projects/{project_id}/artifact-graph */
export function useProjectArtifactGraph(
  projectId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<ArtifactGraphResponse, Error, ArtifactGraphResponse["data"]>({
    queryKey: projectArtifactGraphQueryKey(pid),
    queryFn: () => fetchArtifact.getGraph(pid),
    select: (res) => res.data,
    enabled,
    staleTime: 0,
  });
}

/** GET /api/v1/projects/{project_id}/artifacts/{artifact_id}/evidence */
export function useProjectArtifactEvidence(
  projectId: string | null | undefined,
  artifactId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const aid = artifactId?.trim() ?? "";
  const enabled = Boolean(pid) && Boolean(aid) && (options?.enabled ?? true);

  return useCachedGet<ArtifactEvidenceListResponse, Error, ArtifactEvidence[]>({
    queryKey: projectArtifactEvidenceQueryKey(pid, aid),
    queryFn: () => fetchArtifact.listEvidence(pid, aid),
    select: (res) => res.data,
    enabled,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

type CreateArtifactVariables = {
  projectId: string;
  req: CreateArtifactRequest;
};

/** POST /api/v1/projects/{project_id}/artifacts */
export function useCreateArtifact(
  options?: Omit<
    UseMutationOptions<ArtifactResponse, Error, CreateArtifactVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: ({ projectId, req }: CreateArtifactVariables) =>
      fetchArtifact.create(projectId, req),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateArtifacts(queryClient, variables.projectId);
      invalidateArtifactDetail(queryClient, variables.projectId, data.data.id);
      invalidateArtifactGraph(queryClient, variables.projectId);
      invalidateBrdExport(queryClient, variables.projectId);
      invalidatePrdExport(queryClient, variables.projectId);
      toast.success("Artifact created");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to create artifact"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type UpdateArtifactVariables = {
  projectId: string;
  artifactId: string;
  req: UpdateArtifactRequest;
};

/** PATCH /api/v1/projects/{project_id}/artifacts/{artifact_id} */
export function useUpdateArtifact(
  options?: Omit<
    UseMutationOptions<ArtifactResponse, Error, UpdateArtifactVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: ({ projectId, artifactId, req }: UpdateArtifactVariables) =>
      fetchArtifact.update(projectId, artifactId, req),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateArtifacts(queryClient, variables.projectId);
      invalidateArtifactDetail(
        queryClient,
        variables.projectId,
        variables.artifactId
      );
      invalidateArtifactGraph(queryClient, variables.projectId);
      toast.success("Artifact updated");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to update artifact"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type DeleteArtifactVariables = {
  projectId: string;
  artifactId: string;
};

/** DELETE /api/v1/projects/{project_id}/artifacts/{artifact_id} */
export function useDeleteArtifact(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteArtifactVariables>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: ({ projectId, artifactId }: DeleteArtifactVariables) =>
      fetchArtifact.delete(projectId, artifactId),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateArtifacts(queryClient, variables.projectId);
      invalidateArtifactDetail(
        queryClient,
        variables.projectId,
        variables.artifactId
      );
      invalidateArtifactGraph(queryClient, variables.projectId);
      toast.success("Artifact archived");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      const blockers = getDependencyConflictArtifactIds(error);
      toast.error(
        blockers.length
          ? `Cannot archive artifact — it still has ${blockers.length} downstream blocker(s)`
          : getApiErrorMessage(error, "Failed to archive artifact")
      );
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type ReviewArtifactVersionVariables = {
  projectId: string;
  artifactId: string;
  versionId: string;
  req: ReviewArtifactVersionRequest;
};

/** POST .../versions/{version_id}/review */
export function useReviewArtifactVersion(
  options?: Omit<
    UseMutationOptions<
      ArtifactVersionReviewResponse,
      Error,
      ReviewArtifactVersionVariables
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: ({
      projectId,
      artifactId,
      versionId,
      req,
    }: ReviewArtifactVersionVariables) =>
      fetchArtifact.reviewVersion(projectId, artifactId, versionId, req),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateArtifacts(queryClient, variables.projectId);
      invalidateArtifactDetail(
        queryClient,
        variables.projectId,
        variables.artifactId
      );
      invalidateArtifactGraph(queryClient, variables.projectId);
      toast.success("Artifact review recorded");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to review artifact"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type RestoreArtifactVersionVariables = {
  projectId: string;
  artifactId: string;
  versionId: string;
};

/** POST .../versions/{version_id}/restore */
export function useRestoreArtifactVersion(
  options?: Omit<
    UseMutationOptions<
      ArtifactResponse,
      Error,
      RestoreArtifactVersionVariables
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: ({
      projectId,
      artifactId,
      versionId,
    }: RestoreArtifactVersionVariables) =>
      fetchArtifact.restoreVersion(projectId, artifactId, versionId),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateArtifacts(queryClient, variables.projectId);
      invalidateArtifactDetail(
        queryClient,
        variables.projectId,
        variables.artifactId
      );
      invalidateArtifactGraph(queryClient, variables.projectId);
      toast.success("Artifact restored to a previous version");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to restore artifact"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

type CreateArtifactEvidenceVariables = {
  projectId: string;
  artifactId: string;
  req: CreateArtifactEvidenceRequest;
};

/** POST /api/v1/projects/{project_id}/artifacts/{artifact_id}/evidence */
export function useCreateArtifactEvidence(
  options?: Omit<
    UseMutationOptions<
      ArtifactEvidenceResponse,
      Error,
      CreateArtifactEvidenceVariables
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } =
    options ?? {};

  return useMutation({
    ...rest,
    mutationFn: ({
      projectId,
      artifactId,
      req,
    }: CreateArtifactEvidenceVariables) =>
      fetchArtifact.createEvidence(projectId, artifactId, req),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateArtifactEvidence(
        queryClient,
        variables.projectId,
        variables.artifactId
      );
      toast.success("Evidence attached to artifact");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Failed to attach evidence"));
      userOnError?.(error, variables, onMutateResult, context);
    },
  });
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  Artifact,
  ArtifactCurrentVersionStatus,
  ArtifactEvidence,
  ArtifactEvidenceListResponse,
  ArtifactEvidenceResponse,
  ArtifactGraphEdge,
  ArtifactGraphNode,
  ArtifactGraphResponse,
  ArtifactLifecycleState,
  ArtifactListResponse,
  ArtifactPhase,
  ArtifactPriority,
  ArtifactResponse,
  ArtifactStatus,
  ArtifactType,
  ArtifactVersion,
  ArtifactVersionReview,
  ArtifactVersionReviewResponse,
  ArtifactVersionReviewStatus,
  CreateArtifactEvidenceRequest,
  CreateArtifactRequest,
  EvidenceSourceType,
  ListArtifactsParams,
  ReviewArtifactVersionRequest,
  UpdateArtifactRequest,
  WorkflowStepKey,
} from "@/lib/api/services/fetchArtifact";

export {
  ARTIFACT_CHANGE_SOURCES,
  ARTIFACT_CURRENT_VERSION_STATUSES,
  ARTIFACT_LIFECYCLE_STATES,
  ARTIFACT_PHASES,
  ARTIFACT_PRIORITIES,
  ARTIFACT_STATUSES,
  ARTIFACT_TYPES,
  ARTIFACT_VERSION_REVIEW_STATUSES,
  EVIDENCE_SOURCE_TYPES,
  WORKFLOW_STEP_KEYS,
} from "@/lib/api/services/fetchArtifact";
