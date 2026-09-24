"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Code2, Layers3, Network, RefreshCw, Sparkles, Table2 } from "lucide-react";
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
import { PlantUmlPreview } from "./PlantUmlPreview";
import { UseCaseDiagram } from "./UseCaseDiagram";
import { UseCaseDetails } from "./UseCaseDetails";
import { UseCaseTable } from "./UseCaseTable";

const EMPTY_USE_CASES: UseCaseItemResponse[] = [];
const EMPTY_ACTORS: UseCaseActorResponse[] = [];
const EMPTY_MODULES: UseCaseModuleResponse[] = [];
const EMPTY_RELATIONSHIPS: UseCaseRelationshipResponse[] = [];
type Tab = "table" | "diagram" | "plantuml";

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
    generate,
    generateRelations,
    savePlantUml,
    saving,
    generating,
    generatingRelations,
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
  const actorById = useMemo(() => new Map(actors.map((actor) => [actor.id, actor])), [actors]);
  const moduleById = useMemo(() => new Map(modules.map((module) => [module.id, module])), [modules]);
  const selected = useCases.find((item) => item.id === selectedId) ?? useCases[0] ?? null;
  const plantUmlSource = response?.plantUml?.source ?? "";
  const plantUmlIsAvailable = Boolean(plantUmlSource);
  const plantUmlIsStale = Boolean(response?.plantUml?.stale);
  const relationsGenerated = response?.generation?.relationsGenerated === true;
  const busy = saving || generating || generatingRelations;
  const [generationStage, setGenerationStage] = useState({
    label: "Preparing BRD/PRD source",
    current: 1,
    total: 4,
  });
  const activeGenerationStage = generatingRelations
    ? { label: "Generating relationships", current: 4, total: 4 }
    : generationStage;

  useEffect(() => {
    if (!generating || generatingRelations) return;
    const tableTimer = window.setTimeout(
      () => setGenerationStage({ label: "Generating use-case table", current: 2, total: 4 }),
      650,
    );
    const checkTimer = window.setTimeout(
      () => setGenerationStage({ label: "Checking traceability", current: 3, total: 4 }),
      1600,
    );
    return () => {
      window.clearTimeout(tableTimer);
      window.clearTimeout(checkTimer);
    };
  }, [generating, generatingRelations]);

  const startGeneration = () => {
    setGenerationStage({ label: "Reading BRD/PRD components", current: 1, total: 4 });
    void generate();
  };
  const startRelationGeneration = () => {
    setGenerationStage({ label: "Generating relationships", current: 4, total: 4 });
    void generateRelations();
  };

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
              Review the generated business use cases grouped by capability. The table and detail panel are derived from the stored BRD and PRD components; PlantUML is the editable diagram source.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || !projectId}
              onClick={startGeneration}
              className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy && (generating || generatingRelations)
                ? `${activeGenerationStage.label} · ${activeGenerationStage.current}/${activeGenerationStage.total}`
                : useCases.length
                  ? "Regenerate model"
                  : "Generate use-case model"}
            </button>
            {useCases.length > 0 && !relationsGenerated ? (
              <button
                type="button"
                disabled={busy || !projectId}
                onClick={startRelationGeneration}
                className="rounded-md border border-primary/50 px-3 py-2 text-xs font-medium text-primary disabled:opacity-50"
              >
                {generatingRelations ? "Resolving…" : "Resolve relationships"}
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
                (tab === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Table2 className="size-4" />
              Use case table
            </button>
            <button
              type="button"
              onClick={() => setTab("diagram")}
              className={
                "inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium " +
                (tab === "diagram" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Network className="size-4" />
              Diagram
            </button>
            <button
              type="button"
              onClick={() => setTab("plantuml")}
              className={
                "inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium " +
                (tab === "plantuml" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Code2 className="size-4" />
              PlantUML code
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            {tab === "diagram"
              ? "View the generated use-case diagram from the current model."
              : tab === "plantuml"
                ? "Edit the generated source and save it to preview the current UML."
                : "Select a use case to inspect its full detail."}
          </span>
        </div>
      </header>

      {response.generation && typeof response.generation.error === "string" ? (
        <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          The source-backed table is available. AI detail generation reported: {response.generation.error}
        </p>
      ) : null}
      {plantUmlIsStale ? (
        <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          The PlantUML source is older than the current table. Regenerate the model to refresh generated UML.
        </p>
      ) : null}
      {useCases.length > 0 && !relationsGenerated ? (
        <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
          The table is ready. Resolve relationships to complete include, extend and generalization links.
        </p>
      ) : null}

      {tab === "table" ? (
        <div className="grid min-h-[520px] min-w-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <UseCaseTable
            items={useCases}
            modules={modules}
            actors={actorById}
            relationships={relationships}
            selectedId={selected?.id}
            onSelect={setSelectedId}
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
      ) : tab === "diagram" ? (
        <UseCaseDiagram response={response} />
      ) : (
        <PlantUmlPreview
          key={plantUmlSource}
          source={plantUmlSource}
          projectName={response.projectName}
          unavailable={!plantUmlIsAvailable}
          busy={busy}
          onSave={!projectId || !plantUmlIsAvailable ? undefined : savePlantUml}
        />
      )}
    </div>
  );
}
