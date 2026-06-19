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
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import {
  fetchArtifact,
  type Artifact,
  type ArtifactEvidence,
  type ArtifactEvidenceListResponse,
  type ArtifactEvidenceResponse,
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
  projectArtifactEvidenceQueryKey,
  projectArtifactsQueryKey,
  projectArtifactsQueryRoot,
} from "@/lib/query/query-keys";

// ─── Invalidation helpers ─────────────────────────────────────────────────────

function invalidateArtifacts(queryClient: QueryClient, projectId: string) {
  void queryClient.invalidateQueries({
    queryKey: projectArtifactsQueryRoot(projectId),
    exact: false,
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
      toast.success("Artifact đã được tạo");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Tạo artifact thất bại"));
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
      toast.success("Artifact đã được cập nhật");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Cập nhật artifact thất bại"));
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
      toast.success("Artifact đã được xóa");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Xóa artifact thất bại"));
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
      toast.success("Review artifact đã được ghi nhận");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Review artifact thất bại"));
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
      toast.success("Artifact đã được khôi phục về version cũ");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Khôi phục artifact thất bại"));
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
      toast.success("Evidence đã được gắn vào artifact");
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(getApiErrorMessage(error, "Gắn evidence thất bại"));
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
  ARTIFACT_PHASES,
  ARTIFACT_PRIORITIES,
  ARTIFACT_STATUSES,
  ARTIFACT_TYPES,
  ARTIFACT_VERSION_REVIEW_STATUSES,
  EVIDENCE_SOURCE_TYPES,
  WORKFLOW_STEP_KEYS,
} from "@/lib/api/services/fetchArtifact";
