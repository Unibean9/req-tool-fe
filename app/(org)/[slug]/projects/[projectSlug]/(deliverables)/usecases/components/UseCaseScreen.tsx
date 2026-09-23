"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, CircleDot, Code2, Layers3, Sparkles, Table2 } from "lucide-react";
import { toast } from "sonner";
import {
  createUseCaseActor,
  updateUseCaseActor,
  deleteUseCaseActor,
  createUseCase,
  updateUseCase,
  deleteUseCase,
  deleteUseCaseRelationship,
  type UseCaseActorResponse,
  type UseCaseLevel,
  type UseCaseItemResponse,
  type UseCaseStatus,
} from "@/lib/api/services/useCaseModel";

import { useOrgProjects } from "@/hooks/useProject";
import { useUseCaseModel } from "@/hooks/useUseCaseModel";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { useOrgWorkspace } from "../../../../../orgWorkspaceContext";
import { UseCaseEditor } from "./UseCaseEditor";
import { UseCaseActorsDialog } from "./UseCaseActorsDialog";
import { PlantUmlPreview } from "./PlantUmlPreview";
import { UseCaseTable } from "./UseCaseTable";
import { UseCaseDetails } from "./UseCaseDetails";
import { USE_CASE_LEVEL_FILTERS, USE_CASE_LEVEL_META, USE_CASE_STATUS_META } from "@/lib/usecases/useCaseLabels";

const EMPTY_USE_CASES: UseCaseItemResponse[] = [];
const EMPTY_ACTORS: UseCaseActorResponse[] = [];
type Tab = "table" | "plantuml";

function StatusBadge({ status }: { status: UseCaseStatus }) {
  const style = status === "Confirmed" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : status === "Inferred" ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-amber-500/40 bg-amber-500/10 text-amber-300";
  const icon = status === "Confirmed" ? <CheckCircle2 className="size-3" /> : status === "Inferred" ? <CircleDot className="size-3" /> : <Sparkles className="size-3" />;
  return <span aria-label={`Evidence: ${USE_CASE_STATUS_META[status].label}`} title={USE_CASE_STATUS_META[status].description} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style}`}>{icon}{USE_CASE_STATUS_META[status].label}</span>;
}

export default function UseCaseScreen() {
  const params = useParams<{ projectSlug: string }>();
  const { orgId } = useOrgWorkspace();
  const projects = useOrgProjects(orgId);
  const projectId = projects.data?.find((project) => project.slug === params.projectSlug)?.id;
  const {
    data: apiResponse,
    error: loadError,
    isLoading,
    refetch,
    save,
    savePlantUml,
    generate,
    generateRelations,
    saving,
    generatingRelations,
  } = useUseCaseModel(projectId);
  const response = apiResponse;
  const [actorsOpen, setActorsOpen] = useState(false);
  const [editor, setEditor] = useState<UseCaseItemResponse | "new" | null>(null);
  const [tab, setTab] = useState<Tab>("table");
  const [level, setLevel] = useState<"all" | UseCaseLevel>("all");
  const [selectedId, setSelectedId] = useState("");
  const loadProblem = loadError ?? projects.error;

  useEffect(() => {
    if (!loadProblem) return;
    toast.error(getApiErrorMessage(loadProblem, projectId ? "Could not load use case model." : "Project could not be found."), {
      id: `use-case-load-${projectId ?? "project"}`,
    });
  }, [loadProblem, projectId]);

  const useCases = response?.useCases ?? EMPTY_USE_CASES;
  const actors = response?.actors ?? EMPTY_ACTORS;
  const actorById = useMemo(() => new Map(actors.map((actor) => [actor.id, actor])), [actors]);
  const selected = useCases.find((item) => item.id === selectedId) ?? useCases[0] ?? null;
  const selectedRelationships = selected
    ? (response?.relationships ?? []).filter((item) => item.sourceId === selected.id || item.targetId === selected.id)
    : [];
  const levelCounts = useMemo(() => ({
    L0: useCases.filter((item) => item.level === "L0").length,
    L1: useCases.filter((item) => item.level === "L1").length,
    L2: useCases.filter((item) => item.level === "L2").length,
  }), [useCases]);
  const populatedLevelCount = Object.values(levelCounts).filter((value) => value > 0).length;
  const count = (wanted: "all" | UseCaseLevel) => wanted === "all" ? useCases.length : levelCounts[wanted];
  const plantUmlSource = response?.plantUml?.source ?? "";
  const plantUmlIsAvailable = Boolean(response?.plantUml?.source);
  const plantUmlIsStale = Boolean(response?.plantUml?.stale);
  const relationsGenerated = response?.generation?.relationsGenerated === true;
  const busy = saving || generatingRelations;
  const addActor = () => setActorsOpen(true);
  const addUseCase = () => setEditor("new");

  if (!response) return <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
    {projects.isLoading || isLoading ? "Loading use case model…" : <><p className="text-center text-muted-foreground">Unable to load the use case model.</p><button type="button" onClick={() => { void projects.refetch(); if (projectId) void refetch(); }} className="rounded-md border px-3 py-2">Retry</button></>}
  </div>;

  return <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4 [&>header]:shrink-0 [&>details]:shrink-0 [&>p]:shrink-0">
    <header className="rounded-xl border border-border/70 bg-card/35 p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-primary">{response.projectName.toUpperCase()} <span className="text-muted-foreground">/ MODELING</span></div>
          <div className="flex items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">Use case model</h1><span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-200"><Sparkles className="size-3" />{busy ? "Saving…" : "Project model"}</span></div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Trace BRD and PRD evidence through capability groups and use cases. The table is the source model; PlantUML is the editable representation for review and sharing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={addActor} className="text-xs text-primary">Actors ({actors.length})</button><button type="button" disabled={busy} onClick={addUseCase} className="text-xs text-primary">Add use case</button><button type="button" disabled={busy} onClick={() => void generate()} className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">{saving ? "Generating…" : "Generate model"}</button>{useCases.length > 0 ? <button type="button" disabled={busy} onClick={() => void generateRelations()} className="rounded-md border border-primary/50 px-3 py-2 text-xs font-medium text-primary disabled:opacity-50">{generatingRelations ? "Generating UML…" : relationsGenerated ? "Regenerate UML" : "Generate UML"}</button> : null}<div className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Layers3 className="size-4 text-primary" />{levelCounts.L0} capability groups · {levelCounts.L1} use cases{levelCounts.L2 ? ` · ${levelCounts.L2} sub-use cases` : ""} <span className="text-muted-foreground/70">({populatedLevelCount} populated levels)</span></div></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex items-center gap-1 rounded-lg bg-muted/40 p-1"><button type="button" onClick={() => setTab("table")} className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium ${tab === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Table2 className="size-4" />Use case table</button><button type="button" onClick={() => setTab("plantuml")} className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium ${tab === "plantuml" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Code2 className="size-4" />PlantUML source</button></div>
        {tab === "table" ? <div className="flex items-center gap-1 overflow-x-auto">{USE_CASE_LEVEL_FILTERS.map((item) => <button key={item} type="button" onClick={() => setLevel(item)} title={item === "all" ? "Show every row" : USE_CASE_LEVEL_META[item].description} className={`shrink-0 rounded-md px-2.5 py-2 text-[11px] ${level === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>{item === "all" ? "All rows" : `${item} · ${USE_CASE_LEVEL_META[item].shortLabel}`} · {count(item)}</button>)}</div> : <span className="text-xs text-muted-foreground">Edit the PlantUML source, save it, then preview the current code.</span>}
      </div>
    </header>
    {plantUmlIsStale ? <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">The use case table changed after the last UML generation. Generate the model again to refresh the generated PlantUML source.</p> : null}
    {useCases.length > 0 && !relationsGenerated ? <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-primary">Table generated. Include/extend/generalization relations are not resolved yet — click &ldquo;Generate UML&rdquo; to complete the diagram.</p> : null}
    {actorsOpen ? <UseCaseActorsDialog actors={actors} busy={busy} onClose={() => setActorsOpen(false)} onCreate={(name, kind) => save(() => createUseCaseActor(projectId!, { name, kind }))} onRename={(id, name) => save(() => updateUseCaseActor(projectId!, id, { name }))} onDelete={(id) => save(() => deleteUseCaseActor(projectId!, id))} /> : null}
    {editor ? <UseCaseEditor key={typeof editor === "string" ? editor : editor.id} model={response} item={editor === "new" ? undefined : editor} busy={busy} onClose={() => setEditor(null)} onSave={(body) => save(() => editor === "new" ? createUseCase(projectId!, body) : updateUseCase(projectId!, editor.id, body))} /> : null}

    {tab === "table" ? <div className="grid min-h-[360px] min-w-0 flex-1 grid-cols-1 grid-rows-[minmax(360px,1fr)_auto] gap-4 xl:grid-rows-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_340px]">
      <UseCaseTable items={useCases} actors={actorById} level={level} selectedId={selected?.id} onSelect={setSelectedId} renderStatus={(status) => <StatusBadge status={status} />} />
      <UseCaseDetails
        selected={selected}
        items={useCases}
        actors={actorById}
        relationships={selectedRelationships}
        busy={busy}
        onSelect={setSelectedId}
        onEdit={setEditor}
        onDelete={(id) => { void save(() => deleteUseCase(projectId!, id)); }}
        onDeleteRelationship={(id) => { void save(() => deleteUseCaseRelationship(projectId!, id)); }}
        renderStatus={(status) => <StatusBadge status={status} />}
      />
    </div> : <PlantUmlPreview key={plantUmlSource} source={plantUmlSource} projectName={response.projectName} unavailable={!plantUmlIsAvailable} busy={busy} onSave={!projectId || !plantUmlIsAvailable ? undefined : savePlantUml} />}
  </div>;
}
