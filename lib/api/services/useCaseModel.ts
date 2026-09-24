import apiService from "@/lib/api/core";

export type EvidenceType = "explicit" | "inferred";
export type UseCasePriority = "required" | "recommended" | "optional";
export type ActorKind = "human" | "external_system" | "scheduler";
export type ActorSide = "left" | "right";
export type UseCaseRelationshipType = "include" | "extend" | "generalization";
export type FlowParticipantType = "actor" | "system" | "external_system";
export type RequirementType = "functional" | "business_rule" | "non_functional";
export type RelationshipReviewState = "accepted" | "review_required" | "rejected";

export type UseCaseFlowStepResponse = {
  step: number;
  participantType: FlowParticipantType;
  participantId: string | null;
  action: string;
};

export type UseCaseFlowResponse = {
  flowType: "alternative" | "exception";
  label: string;
  branchAtStep: number | null;
  steps: UseCaseFlowStepResponse[];
};

export type UseCaseRequirementLinkResponse = {
  id: string;
  type: RequirementType;
  title: string | null;
  sourceTrace: string[];
};

export type UseCaseActorResponse = {
  id: string;
  name: string;
  kind: ActorKind;
  side: ActorSide | null;
};

export type UseCaseSystemResponse = {
  id: string;
  name: string;
  description: string | null;
  sourceTrace: string[];
};

export type UseCaseModuleResponse = {
  id: string;
  name: string;
  goal: string | null;
  sourceTrace: string[];
};

export type UseCaseItemResponse = {
  id: string;
  name: string;
  moduleId: string;
  primaryActorId: string;
  secondaryActorIds: string[];
  relationshipIds: string[];
  evidence: EvidenceType;
  priority: UseCasePriority;
  description: string;
  trigger: string | null;
  preconditions: string[];
  mainFlow: UseCaseFlowStepResponse[];
  alternativeFlows: UseCaseFlowResponse[];
  exceptionFlows: UseCaseFlowResponse[];
  postconditionsSuccess: string[];
  postconditionsFailure: string[];
  businessRules: string[];
  relatedRequirements: UseCaseRequirementLinkResponse[];
  sourceTrace: string[];
  note: string | null;
};

export type UseCaseRelationshipResponse = {
  id: string;
  sourceId: string;
  targetId: string;
  type: UseCaseRelationshipType;
  condition: string | null;
  reason: string | null;
  confidence: number | null;
  reviewState: RelationshipReviewState | null;
  sourceTrace: string[];
};

export type DiagramLayoutPoint = { x: number; y: number };
export type DiagramLayoutNode = {
  id: string;
  kind: "system_boundary" | "actor" | "use_case";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  moduleId: string | null;
  moduleName: string | null;
  priority: UseCasePriority | null;
  actorKind: ActorKind | null;
  side: ActorSide | "inside" | null;
};
export type DiagramLayoutEdge = {
  id: string;
  source: string;
  target: string;
  kind: "association" | UseCaseRelationshipType;
  label: string | null;
  lineStyle: "solid" | "dashed";
  directed: boolean;
  sourceHandle: string | null;
  targetHandle: string | null;
  points: DiagramLayoutPoint[];
};
export type DiagramLayout = {
  engine: "elk";
  version: string;
  system: {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  nodes: DiagramLayoutNode[];
  edges: DiagramLayoutEdge[];
  diagnostics: { warnings: string[]; overlapCount: number };
};

export type UseCaseValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  path: string | null;
};

export type UseCaseValidation = {
  issues: UseCaseValidationIssue[];
  eligibleForSrs: boolean;
  eligibleDiagramIds: string[];
  confirmedUseCaseIds: string[];
};

export type UseCasePlantUml = {
  language: "plantuml";
  source: string;
  editable: boolean;
  stale: boolean;
  generatedFrom: "use-case-table" | "manual";
};

export type UseCaseModelResponse = {
  projectId: string;
  projectName: string;
  system: UseCaseSystemResponse;
  actors: UseCaseActorResponse[];
  modules: UseCaseModuleResponse[];
  useCases: UseCaseItemResponse[];
  relationships: UseCaseRelationshipResponse[];
  sourceHash: string | null;
  validation: UseCaseValidation | null;
  generation:
    | (Record<string, unknown> & {
        relationsGenerated?: boolean;
        status?: "running" | "completed" | "completed_with_errors" | "failed";
        batchCount?: number | null;
        completedBatchCount?: number;
        generationMode?: string;
        stages?: Record<string, "pending" | "running" | "completed" | "failed" | "skipped">;
      })
    | null;
  diagramLayout: DiagramLayout | null;
  plantUml: UseCasePlantUml | null;
};

export type UseCaseModelQuery = {
  includeActors?: boolean;
  includeRelationships?: boolean;
};

export type GenerateUseCaseModelRequest = { providerConfigId?: string };
export type UpdateUseCasePlantUmlRequest = { source: string };

/*
 * Deprecated request types are retained so an old client module can still type-check while the
 * generated model is migrated. The current screen never calls the manual Use Case endpoints.
 */
export type UseCaseLevel = "L0" | "L1" | "L2";
export type UseCaseStatus = "Confirmed" | "Inferred" | "Suggested";
export type UseCaseActorKind = ActorKind | "Primary actor" | "Supporting actor";
export type UseCaseActorCreateRequest = { name: string; kind?: UseCaseActorKind };
export type UseCaseCreateRequest = {
  level?: UseCaseLevel;
  title?: string;
  name?: string;
  primaryActorId: string;
  supportingActorIds?: string[];
  secondaryActorIds?: string[];
  subsystem?: string;
  moduleId?: string;
  status?: UseCaseStatus;
  evidence?: EvidenceType;
  priority?: UseCasePriority | "Must" | "Should" | "Could";
  parentUseCaseId?: string | null;
  description: string;
  precondition?: string;
  preconditions?: string[];
  sourceTrace: string[];
};
export type UseCaseUpdateRequest = Partial<UseCaseCreateRequest>;
export type UseCaseRelationshipCreateRequest = Omit<UseCaseRelationshipResponse, "id">;

type ApiEnvelope<T> = { success: boolean; data: T | null; message: string | null };

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === null) {
    throw new Error(envelope.message || "The use case API returned no data.");
  }
  return envelope.data;
}

const projectPath = (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}`;

export async function fetchUseCaseModel(
  projectId: string,
  query: UseCaseModelQuery = {},
): Promise<UseCaseModelResponse> {
  const response = await apiService.get<ApiEnvelope<UseCaseModelResponse>>(
    `${projectPath(projectId)}/use-case-model`,
    {
      includeActors: query.includeActors ?? true,
      includeRelationships: query.includeRelationships ?? true,
    },
  );
  return unwrap(response.data);
}

/**
 * Monolithic generation: extracts modules, generates every module's use cases, and resolves
 * relationships inside a single request. On a project with several modules this can run long
 * enough to exceed a client/proxy timeout before any response comes back. `useUseCaseModel`
 * drives `generateUseCaseGroups` + `generateGroupUseCases` + `generateUseCaseRelations` instead
 * so each phase is its own bounded request with visible progress. Kept for callers that
 * genuinely want one blocking call.
 */
export async function generateUseCaseModel(
  projectId: string,
  body: GenerateUseCaseModelRequest = {},
): Promise<UseCaseModelResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseModelResponse>, GenerateUseCaseModelRequest>(
    `${projectPath(projectId)}/use-case-model/generate`,
    body,
  );
  return unwrap(response.data);
}

export async function generateUseCaseRelations(
  projectId: string,
  body: GenerateUseCaseModelRequest = {},
): Promise<UseCaseModelResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseModelResponse>, GenerateUseCaseModelRequest>(
    `${projectPath(projectId)}/use-case-model/relations/generate`,
    body,
  );
  return unwrap(response.data);
}

/** Recomputes the ELK diagram layout from the already-generated table. No LLM call; the
 * backend rejects this with 409 if the table has no use cases yet. */
export async function generateUseCaseDiagram(projectId: string): Promise<UseCaseModelResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseModelResponse>, Record<string, never>>(
    `${projectPath(projectId)}/use-case-model/diagram/generate`,
    {},
  );
  return unwrap(response.data);
}

/** Phase 1 of split generation: extracts modules/actors only (`useCases` is always empty). */
export async function generateUseCaseGroups(
  projectId: string,
  body: GenerateUseCaseModelRequest = {},
): Promise<UseCaseModelResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseModelResponse>, GenerateUseCaseModelRequest>(
    `${projectPath(projectId)}/use-case-model/groups/generate`,
    body,
  );
  return unwrap(response.data);
}

/** Phase 2 of split generation: generates one module's use cases; idempotently replaces that
 * module's previously generated rows. */
export async function generateGroupUseCases(
  projectId: string,
  groupId: string,
  body: GenerateUseCaseModelRequest = {},
): Promise<UseCaseModelResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseModelResponse>, GenerateUseCaseModelRequest>(
    `${projectPath(projectId)}/use-case-model/groups/${encodeURIComponent(groupId)}/use-cases/generate`,
    body,
  );
  return unwrap(response.data);
}

export async function updateUseCasePlantUml(
  projectId: string,
  body: UpdateUseCasePlantUmlRequest,
): Promise<UseCasePlantUml> {
  const response = await apiService.patch<ApiEnvelope<UseCasePlantUml>, UpdateUseCasePlantUmlRequest>(
    `${projectPath(projectId)}/use-case-model/uml`,
    body,
  );
  return unwrap(response.data);
}

export async function createUseCaseActor(
  projectId: string,
  body: UseCaseActorCreateRequest,
): Promise<UseCaseActorResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseActorResponse>, UseCaseActorCreateRequest>(
    `${projectPath(projectId)}/actors`,
    body,
  );
  return unwrap(response.data);
}

export async function updateUseCaseActor(
  projectId: string,
  actorId: string,
  body: { name: string },
): Promise<UseCaseActorResponse> {
  const response = await apiService.patch<ApiEnvelope<UseCaseActorResponse>, { name: string }>(
    `${projectPath(projectId)}/actors/${encodeURIComponent(actorId)}`,
    body,
  );
  return unwrap(response.data);
}

export async function deleteUseCaseActor(projectId: string, actorId: string): Promise<void> {
  const response = await apiService.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(
    `${projectPath(projectId)}/actors/${encodeURIComponent(actorId)}`,
  );
  unwrap(response.data);
}

/** Deprecated manual CRUD wrappers. The backend rejects these for generated use cases. */
export async function createUseCase(
  projectId: string,
  body: UseCaseCreateRequest,
): Promise<UseCaseItemResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseItemResponse>, UseCaseCreateRequest>(
    `${projectPath(projectId)}/use-cases`,
    body,
  );
  return unwrap(response.data);
}

export async function updateUseCase(
  projectId: string,
  useCaseId: string,
  body: UseCaseUpdateRequest,
): Promise<UseCaseItemResponse> {
  const response = await apiService.patch<ApiEnvelope<UseCaseItemResponse>, UseCaseUpdateRequest>(
    `${projectPath(projectId)}/use-cases/${encodeURIComponent(useCaseId)}`,
    body,
  );
  return unwrap(response.data);
}

export async function deleteUseCase(projectId: string, useCaseId: string): Promise<void> {
  const response = await apiService.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(
    `${projectPath(projectId)}/use-cases/${encodeURIComponent(useCaseId)}`,
  );
  unwrap(response.data);
}

export async function createUseCaseRelationship(
  projectId: string,
  body: UseCaseRelationshipCreateRequest,
): Promise<UseCaseRelationshipResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseRelationshipResponse>, UseCaseRelationshipCreateRequest>(
    `${projectPath(projectId)}/use-case-relationships`,
    body,
  );
  return unwrap(response.data);
}

export async function deleteUseCaseRelationship(projectId: string, relationshipId: string): Promise<void> {
  const response = await apiService.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(
    `${projectPath(projectId)}/use-case-relationships/${encodeURIComponent(relationshipId)}`,
  );
  unwrap(response.data);
}
