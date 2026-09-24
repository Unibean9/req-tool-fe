import apiService from "@/lib/api/core";

export type UseCaseLevel = "L0" | "L1" | "L2";
export type UseCaseStatus = "Confirmed" | "Inferred" | "Suggested";
export type UseCasePriority = "Must" | "Should" | "Could";
export type UseCaseActorKind = "Primary actor" | "Supporting actor";
export type UseCaseRelationshipType = "association" | "part-of" | "include" | "extend" | "generalization";

export type UseCaseActorResponse = { id: string; name: string; kind: UseCaseActorKind };
export type UseCaseItemResponse = {
  id: string;
  level: UseCaseLevel;
  title: string;
  primaryActorId: string;
  supportingActorIds: string[];
  subsystem: string;
  status: UseCaseStatus;
  priority: UseCasePriority;
  parentUseCaseId: string | null;
  description: string;
  precondition: string;
  sourceTrace: string[];
};
export type UseCaseRelationshipResponse = {
  id: string;
  sourceId: string;
  targetId: string;
  type: UseCaseRelationshipType;
  condition: string | null;
};
export type UseCaseDiagramNode = { id: string; kind: "system_boundary" | "actor" | "use_case"; label: string; shape: "rectangle" | "actor" | "ellipse"; side: "left" | "right" | "inside" | null };
export type UseCaseDiagramEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  kind: Exclude<UseCaseRelationshipType, "part-of">;
  lineStyle: "solid" | "dashed";
  directed: boolean;
  marker: "none" | "open_arrow" | "open_triangle";
  label: string | null;
  condition: string | null;
};
export type UseCaseDiagramPlan = {
  diagramId: string;
  level: UseCaseLevel;
  systemBoundary: string;
  subsystem: string | null;
  nodes: UseCaseDiagramNode[];
  edges: UseCaseDiagramEdge[];
};
export type UseCaseValidation = {
  issues: { severity: "error" | "warning"; code: string; message: string; path: string | null }[];
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
  actors: UseCaseActorResponse[];
  useCases: UseCaseItemResponse[];
  relationships: UseCaseRelationshipResponse[];
  diagrams: { id: string; level: UseCaseLevel; systemBoundary: string; subsystem: string | null; actorIds: string[]; useCaseIds: string[]; relationIds: string[] }[];
  diagramPlans: UseCaseDiagramPlan[];
  sourceHash: string | null;
  validation: UseCaseValidation | null;
  generation: (Record<string, unknown> & { relationsGenerated?: boolean }) | null;
  plantUml: UseCasePlantUml | null;
};

export type UseCaseModelQuery = {
  maxLevel?: UseCaseLevel;
  includeActors?: boolean;
  includeRelationships?: boolean;
};
export type GenerateUseCaseModelRequest = { maxLevel?: UseCaseLevel; providerConfigId?: string };
export type UpdateUseCasePlantUmlRequest = { source: string };
export type UseCaseActorCreateRequest = { name: string; kind?: UseCaseActorKind };
export type UseCaseCreateRequest = Omit<UseCaseItemResponse, "id">;
export type UseCaseUpdateRequest = Partial<Omit<UseCaseItemResponse, "id">>;
export type UseCaseRelationshipCreateRequest = Omit<UseCaseRelationshipResponse, "id">;

type ApiEnvelope<T> = { success: boolean; data: T | null; message: string | null };

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === null) throw new Error(envelope.message || "The use case API returned no data.");
  return envelope.data;
}

const projectPath = (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}`;

export async function fetchUseCaseModel(projectId: string, query: UseCaseModelQuery = {}): Promise<UseCaseModelResponse> {
  const response = await apiService.get<ApiEnvelope<UseCaseModelResponse>>(`${projectPath(projectId)}/use-case-model`, {
    maxLevel: query.maxLevel ?? "L2",
    includeActors: query.includeActors ?? true,
    includeRelationships: query.includeRelationships ?? true,
  });
  return unwrap(response.data);
}

export async function generateUseCaseModel(projectId: string, body: GenerateUseCaseModelRequest = {}): Promise<UseCaseModelResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseModelResponse>, GenerateUseCaseModelRequest>(`${projectPath(projectId)}/use-case-model/generate`, { maxLevel: body.maxLevel ?? "L2", ...(body.providerConfigId ? { providerConfigId: body.providerConfigId } : {}) });
  return unwrap(response.data);
}

export async function generateUseCaseRelations(projectId: string, body: GenerateUseCaseModelRequest = {}): Promise<UseCaseModelResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseModelResponse>, GenerateUseCaseModelRequest>(`${projectPath(projectId)}/use-case-model/relations/generate`, { maxLevel: body.maxLevel ?? "L2", ...(body.providerConfigId ? { providerConfigId: body.providerConfigId } : {}) });
  return unwrap(response.data);
}

// Split-generation flow: build the L0/L1 group skeleton deterministically (no LLM call, so it
// cannot time out), then fill in L2 detail one small group at a time via generateGroupUseCases.
// This replaces one giant generateUseCaseModel() call -- the thing that used to time out on a
// larger project -- with several small calls.
export async function generateUseCaseGroups(projectId: string, body: GenerateUseCaseModelRequest = {}): Promise<UseCaseModelResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseModelResponse>, GenerateUseCaseModelRequest>(`${projectPath(projectId)}/use-case-model/groups/generate`, { maxLevel: body.maxLevel ?? "L2", ...(body.providerConfigId ? { providerConfigId: body.providerConfigId } : {}) });
  return unwrap(response.data);
}

export async function generateGroupUseCases(projectId: string, groupId: string, body: GenerateUseCaseModelRequest = {}): Promise<UseCaseModelResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseModelResponse>, GenerateUseCaseModelRequest>(`${projectPath(projectId)}/use-case-model/groups/${encodeURIComponent(groupId)}/use-cases/generate`, { maxLevel: body.maxLevel ?? "L2", ...(body.providerConfigId ? { providerConfigId: body.providerConfigId } : {}) });
  return unwrap(response.data);
}

export async function updateUseCasePlantUml(projectId: string, body: UpdateUseCasePlantUmlRequest): Promise<UseCasePlantUml> {
  const response = await apiService.patch<ApiEnvelope<UseCasePlantUml>, UpdateUseCasePlantUmlRequest>(`${projectPath(projectId)}/use-case-model/uml`, body);
  return unwrap(response.data);
}

export async function createUseCaseActor(projectId: string, body: UseCaseActorCreateRequest): Promise<UseCaseActorResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseActorResponse>, UseCaseActorCreateRequest>(`${projectPath(projectId)}/actors`, body);
  return unwrap(response.data);
}

export async function updateUseCaseActor(projectId: string, actorId: string, body: { name: string }): Promise<UseCaseActorResponse> {
  const response = await apiService.patch<ApiEnvelope<UseCaseActorResponse>, { name: string }>(`${projectPath(projectId)}/actors/${encodeURIComponent(actorId)}`, body);
  return unwrap(response.data);
}

export async function deleteUseCaseActor(projectId: string, actorId: string): Promise<void> {
  const response = await apiService.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`${projectPath(projectId)}/actors/${encodeURIComponent(actorId)}`);
  unwrap(response.data);
}

export async function createUseCase(projectId: string, body: UseCaseCreateRequest): Promise<UseCaseItemResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseItemResponse>, UseCaseCreateRequest>(`${projectPath(projectId)}/use-cases`, body);
  return unwrap(response.data);
}

export async function updateUseCase(projectId: string, useCaseId: string, body: UseCaseUpdateRequest): Promise<UseCaseItemResponse> {
  const response = await apiService.patch<ApiEnvelope<UseCaseItemResponse>, UseCaseUpdateRequest>(`${projectPath(projectId)}/use-cases/${encodeURIComponent(useCaseId)}`, body);
  return unwrap(response.data);
}

export async function deleteUseCase(projectId: string, useCaseId: string): Promise<void> {
  const response = await apiService.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`${projectPath(projectId)}/use-cases/${encodeURIComponent(useCaseId)}`);
  unwrap(response.data);
}

export async function createUseCaseRelationship(projectId: string, body: UseCaseRelationshipCreateRequest): Promise<UseCaseRelationshipResponse> {
  const response = await apiService.post<ApiEnvelope<UseCaseRelationshipResponse>, UseCaseRelationshipCreateRequest>(`${projectPath(projectId)}/use-case-relationships`, body);
  return unwrap(response.data);
}

export async function deleteUseCaseRelationship(projectId: string, relationshipId: string): Promise<void> {
  const response = await apiService.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`${projectPath(projectId)}/use-case-relationships/${encodeURIComponent(relationshipId)}`);
  unwrap(response.data);
}
