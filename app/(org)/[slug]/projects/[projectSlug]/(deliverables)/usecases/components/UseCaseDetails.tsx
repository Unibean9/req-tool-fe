"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight, FileText, Flag, GitBranch, ListChecks, Pencil, Target, Trash2, Users } from "lucide-react";
import type { UseCaseActorResponse, UseCaseItemResponse, UseCaseRelationshipResponse, UseCaseStatus } from "@/lib/api/services/useCaseModel";
import { USE_CASE_LEVEL_META, USE_CASE_PRIORITY_META, USE_CASE_RELATION_META } from "@/lib/usecases/useCaseLabels";

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="space-y-2.5"><h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">{icon}{title}</h3>{children}</section>;
}

export function UseCaseDetails({ selected, items, actors, relationships, busy, onSelect, onEdit, onDelete, onDeleteRelationship, renderStatus }: {
  selected: UseCaseItemResponse | null;
  items: UseCaseItemResponse[];
  actors: Map<string, UseCaseActorResponse>;
  relationships: UseCaseRelationshipResponse[];
  busy: boolean;
  onSelect: (id: string) => void;
  onEdit: (item: UseCaseItemResponse) => void;
  onDelete: (id: string) => void;
  onDeleteRelationship: (id: string) => void;
  renderStatus: (status: UseCaseStatus) => ReactNode;
}) {
  if (!selected) return <aside aria-label="Use case details" className="rounded-xl border border-border/70 bg-card/40 p-5"><h2 className="text-sm font-semibold text-foreground">Use case details</h2><p className="mt-2 text-sm text-muted-foreground">Select a row from the catalog to inspect its actors, precondition, relationships and source references.</p></aside>;

  const parent = items.find((item) => item.id === selected.parentUseCaseId);
  const children = items.filter((item) => item.parentUseCaseId === selected.id);
  const links = relationships.filter((relation) => relation.type !== "part-of");
  const parentRelation = relationships.find((relation) => relation.type === "part-of" && relation.targetId === selected.id);
  const personName = (id: string) => actors.get(id)?.name ?? id;
  const levelMeta = USE_CASE_LEVEL_META[selected.level];
  const priorityMeta = USE_CASE_PRIORITY_META[selected.priority];

  const renderUseCaseCard = (item: UseCaseItemResponse, relationId?: string) => <div key={item.id} className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/30 hover:border-primary/40">
    <button type="button" onClick={() => onSelect(item.id)} className="flex min-w-0 flex-1 items-center gap-2 p-3 text-left focus-visible:outline-primary"><span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-5 text-foreground">{item.title}</span><span className="mt-1 block break-all font-mono text-[11px] text-muted-foreground">{item.level} · {item.id}</span></span><ChevronRight className="size-3.5 shrink-0 text-primary" /></button>
    {relationId ? <button type="button" disabled={busy} aria-label={`Remove hierarchy link to ${item.title}`} onClick={() => onDeleteRelationship(relationId)} className="mr-2 rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><Trash2 className="size-3" /></button> : null}
  </div>;

  const renderActorCard = (actorId: string, relationId?: string) => {
    const actor = actors.get(actorId);
    return <div key={actorId} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/30 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{actor?.name ?? actorId}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{actor?.kind ?? "Actor"} · {actorId}</p></div>{relationId ? <button type="button" disabled={busy} aria-label={`Remove relationship to ${actor?.name ?? actorId}`} onClick={() => onDeleteRelationship(relationId)} className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><Trash2 className="size-3" /></button> : null}</div>;
  };

  return <aside aria-label="Use case details" className="min-h-0 max-h-[520px] overflow-y-auto rounded-xl border border-border/70 bg-card/40 [scrollbar-gutter:stable] xl:max-h-none">
    <header className="space-y-3 border-b border-border/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Use case details</p><p className="mt-1 text-xs text-muted-foreground">Inspect one row from the source model</p></div><span title={levelMeta.description} className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] text-primary">{selected.level} · {levelMeta.label}</span></div>
      <div><h2 className="text-lg font-semibold leading-6 text-foreground">{selected.title}</h2><p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{selected.id}</p></div>
      <div className="flex flex-wrap items-center gap-2"><span title="Evidence confidence">{renderStatus(selected.status)}</span><span title={`${selected.priority}: ${priorityMeta.description}`} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"><Flag className="size-3" />{priorityMeta.label}</span></div>
      <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => onEdit(selected)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40"><Pencil className="size-3" />Edit use case</button><button type="button" disabled={busy} onClick={() => onDelete(selected.id)} className="ml-auto min-h-9 rounded-md px-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40" aria-label={`Delete ${selected.title}`}><Trash2 className="size-3.5" /></button></div>
    </header>
    <div className="space-y-6 p-4 text-sm">
      <Section title="Description" icon={<Target className="size-4 text-primary" />}><p className="whitespace-pre-line break-words leading-6 text-foreground/90">{selected.description || "No description has been provided."}</p><dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border border-border/60 bg-background/25 p-3 text-xs"><dt className="text-muted-foreground">Area / subsystem</dt><dd className="text-right text-foreground/85">{selected.subsystem || "Not assigned"}</dd></dl></Section>
      <Section title="Actors" icon={<Users className="size-4 text-primary" />}><dl className="space-y-3 rounded-lg border border-border/60 bg-background/25 p-3"><div><dt className="text-xs text-muted-foreground">Primary actor <span className="text-foreground/60">(starts the use case)</span></dt><dd className="mt-1 font-medium leading-5 text-foreground">{personName(selected.primaryActorId)}</dd></div><div><dt className="text-xs text-muted-foreground">Supporting actors <span className="text-foreground/60">(help complete it)</span></dt><dd className="mt-1 leading-5 text-foreground/85">{selected.supportingActorIds.map(personName).join(", ") || "None"}</dd></div></dl></Section>
      <Section title="Precondition" icon={<ListChecks className="size-4 text-primary" />}><p className="whitespace-pre-line break-words rounded-lg border border-border/60 bg-background/25 p-3 leading-6 text-foreground/85">{selected.precondition || "No precondition has been provided."}</p></Section>
      <Section title="Hierarchy" icon={<GitBranch className="size-4 text-primary" />}>
        <div className="space-y-2"><p className="text-xs font-medium text-muted-foreground">Parent capability or use case</p>{parent ? renderUseCaseCard(parent, parentRelation?.id) : <p className="rounded-lg border border-border/60 bg-background/25 p-3 text-xs text-muted-foreground">{selected.parentUseCaseId ? `Parent ${selected.parentUseCaseId} is not loaded.` : "This is a top-level capability group."}</p>}</div>
        <div className="mt-4 space-y-2"><p className="text-xs font-medium text-muted-foreground">Child use cases · {children.length}</p>{children.length ? children.map((child) => renderUseCaseCard(child, relationships.find((relation) => relation.type === "part-of" && relation.targetId === child.id)?.id)) : <p className="rounded-lg border border-border/60 bg-background/25 p-3 text-xs text-muted-foreground">No child use cases.</p>}</div>
      </Section>
      <Section title={`Relationships · ${links.length}`} icon={<ArrowUpRight className="size-4 text-primary" />}>
        {links.length > 0 ? <div className="space-y-3">{links.map((relation) => {
          const outgoing = relation.sourceId === selected.id;
          const otherId = outgoing ? relation.targetId : relation.sourceId;
          const other = items.find((item) => item.id === otherId);
          const relationMeta = USE_CASE_RELATION_META[relation.type];
          return <div key={relation.id} className="space-y-2 rounded-lg border border-border/60 bg-background/20 p-3"><div className="flex flex-wrap items-center gap-2"><span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">{relationMeta.label}</span><span className="text-xs text-muted-foreground">{outgoing ? relationMeta.outgoing : relationMeta.incoming}</span></div>{other ? renderUseCaseCard(other, relation.id) : renderActorCard(otherId, relation.id)}{relation.condition ? <p className="text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground/75">Condition:</span> {relation.condition}</p> : null}<p className="break-all font-mono text-[10px] text-muted-foreground">{relation.id}</p></div>;
        })}</div> : <p className="rounded-lg border border-border/60 bg-background/25 p-3 text-xs text-muted-foreground">No direct association, include, extend or generalization relationship is recorded for this row.</p>}
      </Section>
      <details className="border-t border-border/60 pt-4" open={selected.sourceTrace.length > 0}><summary className="cursor-pointer text-xs font-medium text-foreground"><FileText className="mr-1.5 inline size-3.5 text-primary" />Traceability · {selected.sourceTrace.length} source references</summary><p className="mt-1 text-xs text-muted-foreground">BRD/PRD evidence used to create or validate this row.</p><ul className="mt-3 space-y-2">{selected.sourceTrace.length ? selected.sourceTrace.map((source, index) => <li key={`${source}-${index}`} className="break-words rounded border border-border/60 bg-muted/35 px-3 py-2 text-xs leading-5 text-muted-foreground">{source}</li>) : <li className="text-xs text-muted-foreground">No source reference has been recorded.</li>}</ul></details>
    </div>
  </aside>;
}
