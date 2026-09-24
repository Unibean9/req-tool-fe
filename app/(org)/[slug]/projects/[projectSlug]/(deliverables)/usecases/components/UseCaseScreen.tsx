"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Layers3, Network, RefreshCw, Sparkles, Table2 } from "lucide-react";
import { toast } from "sonner";
import type {
  UseCaseActorResponse,
  UseCaseItemResponse,
  UseCaseModuleResponse,
  UseCaseRelationshipResponse,
} from "@/lib/api/services/useCaseModel";
import { useOrgProjects } from "@/hooks/useProject";
import { useUseCaseModel } from "@/hooks/useUseCaseModel";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { useOrgWorkspace } from "../../../../../orgWorkspaceContext";
import { UseCaseDiagram } from "./UseCaseDiagram";
import { UseCaseDetails } from "./UseCaseDetails";
import { UseCaseTable } from "./UseCaseTable";

const EMPTY_USE_CASES: UseCaseItemResponse[] = [];
const EMPTY_ACTORS: UseCaseActorResponse[] = [];
const EMPTY_MODULES: UseCaseModuleResponse[] = [];
const EMPTY_RELATIONSHIPS: UseCaseRelationshipResponse[] = [];
type Tab = "table" | "diagram";

export default function UseCaseScreen() {
  const params = useParams<{ projectSlug: string }>();
  const { orgId } = useOrgWorkspace();
  const projects = useOrgProjects(orgId);
  const projectId = projects.data?.find((project) => project.slug === params.projectSlug)?.id;
  const {
    data: response,
    error: loadError,
    isLoading,
    refetch,
    generateTable,
    generatingTable,
    generateDiagram,
    generatingDiagram,
    savePositions,
    savingPositions,
    retryDetail,
    retryingDetailId,
  } = useUseCaseModel(projectId);
  const [tab, setTab] = useState<Tab>("table");
  const [selectedId, setSelectedId] = useState("");
  const loadProblem = loadError ?? projects.error;

  useEffect(() => {
    if (!loadProblem) return;
    toast.error(
      getApiErrorMessage(
        loadProblem,
        projectId ? "Could not load use case model." : "Project could not be found.",
      ),
      { id: "use-case-load-" + (projectId ?? "project") },
    );
  }, [loadProblem, projectId]);

  const useCases = response?.useCases ?? EMPTY_USE_CASES;
  const modules = response?.modules ?? EMPTY_MODULES;
  const relationships = response?.relationships ?? EMPTY_RELATIONSHIPS;
  const actors = response?.actors ?? EMPTY_ACTORS;
  // The diagram requires a table (see the two Generate buttons below), so fall back to the
  // table tab whenever there is none -- derived at render time rather than synced via an
  // effect, so this never shows a stale diagram tab for one extra frame.
  const effectiveTab: Tab = useCases.length === 0 ? "table" : tab;

  const actorById = useMemo(() => new Map(actors.map((actor) => [actor.id, actor])), [actors]);
  const moduleById = useMemo(() => new Map(modules.map((module) => [module.id, module])), [modules]);
  const selected = useCases.find((item) => item.id === selectedId) ?? useCases[0] ?? null;
  const generationRunning = response?.generation?.status === "running";
  const tableBusy = generatingTable || generationRunning;
  const diagramBusy = generatingDiagram;
  // Written by useUseCaseModel while it orchestrates; absent after a reload mid-run.
  const progress = response?.generation?.progress;
  const progressLabel = progress
    ? progress.label + (progress.total ? ` · ${progress.current ?? 0}/${progress.total}` : "")
    : "Generating use-case table…";

  if (!response) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
        {projects.isLoading || isLoading ? (
          "Loading use case model…"
        ) : (
          <>
            <p className="text-center">Unable to load the use case model.</p>
            <button
              type="button"
              onClick={() => {
                void projects.refetch();
                if (projectId) void refetch();
              }}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
      <header className="shrink-0 rounded-xl border border-border/70 bg-card/35 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-primary">
              {response.projectName.toUpperCase()} <span className="text-muted-foreground">/ MODELING</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">Use case model</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                <Sparkles className="size-3" />
                BRD/PRD source model
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review the generated business use cases grouped by capability. The table and React Flow diagram are derived from the stored BRD and PRD components.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={tableBusy || !projectId}
              onClick={() => void generateTable()}
              className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {tableBusy
                ? progressLabel
                : useCases.length
                  ? "Regenerate table"
                  : "Generate use-case table"}
            </button>
            {useCases.length > 0 ? (
              <button
                type="button"
                disabled={tableBusy || diagramBusy || !projectId}
                onClick={() => void generateDiagram()}
                className="rounded-md border border-border px-3 py-2 text-xs font-medium disabled:opacity-50"
              >
                {diagramBusy ? "Generating diagram…" : "Generate diagram"}
              </button>
            ) : null}
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Layers3 className="size-4 text-primary" />
              {useCases.length} use cases · {modules.length} modules · {actors.length} actors
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex items-center gap-1 rounded-lg bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setTab("table")}
              className={
                "inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium " +
                (effectiveTab === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Table2 className="size-4" />
              Use case table
            </button>
            <button
              type="button"
              disabled={useCases.length === 0}
              onClick={() => setTab("diagram")}
              title={useCases.length === 0 ? "Generate the use-case table first" : undefined}
              className={
                "inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 " +
                (effectiveTab === "diagram" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Network className="size-4" />
              Diagram
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            {effectiveTab === "diagram"
              ? "View the generated use-case diagram from the current model."
              : useCases.length === 0
                ? "Generate the use-case table to unlock the diagram."
                : "Select a use case to inspect its full detail."}
          </span>
        </div>
      </header>

      {response.generation && typeof response.generation.error === "string" ? (
        <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          The source-backed model is available, with a generation note: {response.generation.error}
        </p>
      ) : null}

      {effectiveTab === "table" ? (
        <div className="grid min-h-[520px] min-w-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <UseCaseTable
            items={useCases}
            modules={modules}
            actors={actorById}
            relationships={relationships}
            selectedId={selected?.id}
            onSelect={setSelectedId}
            detailStatus={response.generation?.detailStatus}
            onRetryDetail={(id) => void retryDetail(id)}
            retryingDetailId={retryingDetailId}
            retryDisabled={tableBusy}
          />
          <UseCaseDetails
            selected={selected}
            items={useCases}
            modules={moduleById}
            actors={actorById}
            relationships={relationships}
            onSelect={setSelectedId}
          />
        </div>
      ) : effectiveTab === "diagram" ? (
        <UseCaseDiagram response={response} onSavePositions={savePositions} savingPositions={savingPositions} />
      ) : null}
    </div>
  );
}
