"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight, FileText, Flag, GitBranch, ListChecks, Pencil, Target, Trash2, Users } from "lucide-react";
import type { UseCaseActorResponse, UseCaseItemResponse, UseCaseRelationshipResponse, UseCaseStatus } from "@/lib/api/services/useCaseModel";

const priorityText = { Must: "Required", Should: "Recommended", Could: "Optional" };
const levelText = { L0: "Overall goal", L1: "Capability", L2: "Detailed use case" };
const relationshipText = {
  association: ["Participates with", "Participates with"],
  include: ["Always includes", "Included by"],
  extend: ["Extends when a condition is met", "Can be extended by"],
  generalization: ["Specializes", "Specialized by"],
  "part-of": ["Child use case", "Parent use case"],
};

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="space-y-2.5"><h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">{icon}{title}</h3>{children}</section>;
}

export function UseCaseDetails({ selected, items, actors, relationships, isMock, busy, onSelect, onEdit, onDelete, onDeleteRelationship, renderStatus }: {
  selected: UseCaseItemResponse | null;
  items: UseCaseItemResponse[];
  actors: Map<string, UseCaseActorResponse>;
  relationships: UseCaseRelationshipResponse[];
  isMock: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onEdit: (item: UseCaseItemResponse) => void;
  onDelete: (id: string) => void;
  onDeleteRelationship: (id: string) => void;
  renderStatus: (status: UseCaseStatus) => ReactNode;
}) {
  if (!selected) return <aside className="rounded-xl border border-border/70 bg-card/40 p-5 text-sm text-muted-foreground">Select a use case to inspect details.</aside>;
  const parent = items.find((item) => item.id === selected.parentUseCaseId);
  const children = items.filter((item) => item.parentUseCaseId === selected.id);
  const links = relationships.filter((relation) => relation.type !== "part-of");
  const personName = (id: string) => actors.get(id)?.name ?? id;
  const card = (item: UseCaseItemResponse, relationId?: string) => <div key={item.id} className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/30 hover:border-primary/40">
    <button type="button" onClick={() => onSelect(item.id)} className="flex min-w-0 flex-1 items-center gap-2 p-3 text-left focus-visible:outline-primary"><span className="min-w-0 flex-1"><span className="block text-xs font-medium leading-5 text-foreground">{item.title}</span><span className="mt-1 block break-all font-mono text-[10px] text-muted-foreground">{item.level} · {item.id}</span></span><ChevronRight className="size-3.5 shrink-0 text-primary" /></button>
    {relationId && !isMock ? <button type="button" disabled={busy} aria-label={`Remove link to ${item.title}`} onClick={() => onDeleteRelationship(relationId)} className="mr-2 rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><Trash2 className="size-3" /></button> : null}
  </div>;
  const parentRelation = relationships.find((relation) => relation.type === "part-of" && relation.targetId === selected.id);
  return <aside aria-label="Use case details" className="min-h-0 max-h-[420px] overflow-y-auto rounded-xl border border-border/70 bg-card/40 [scrollbar-gutter:stable] xl:max-h-none">
    <header className="space-y-3 border-b border-border/60 p-4">
      <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold tracking-widest text-muted-foreground">USE CASE DETAILS</p><span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] text-primary">{selected.level} · {levelText[selected.level]}</span></div>
      <h2 className="text-base font-semibold leading-6">{selected.title}</h2>
      <p className="break-all font-mono text-[10px] text-muted-foreground">{selected.id}</p>
      <div className="flex flex-wrap items-center gap-2">{renderStatus(selected.status)}<span title={`${selected.priority} priority`} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"><Flag className="size-3" />{priorityText[selected.priority]}</span>{isMock ? <span className="text-[10px] text-amber-300">Sample content</span> : null}</div>
      {!isMock ? <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => onEdit(selected)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted disabled:opacity-40"><Pencil className="size-3" />Edit details</button><button type="button" disabled={busy} onClick={() => onDelete(selected.id)} className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40" aria-label={`Delete ${selected.title}`}><Trash2 className="size-3.5" /></button></div> : null}
    </header>
    <div className="space-y-5 p-4 text-xs">
      <Section title="Purpose" icon={<Target className="size-3.5 text-primary" />}><p className="whitespace-pre-line break-words text-[13px] leading-6 text-foreground/90">{selected.description || "No description provided yet."}</p><p className="text-[11px] text-muted-foreground">Area: <span className="text-foreground/80">{selected.subsystem || "Not assigned"}</span></p></Section>
      <Section title="People involved" icon={<Users className="size-3.5 text-primary" />}><dl className="space-y-3 rounded-lg border border-border/60 bg-background/25 p-3"><div><dt className="text-[10px] text-muted-foreground">Primary actor · performs this use case</dt><dd className="mt-1 font-medium leading-5">{personName(selected.primaryActorId)}</dd></div><div><dt className="text-[10px] text-muted-foreground">Supporting actors · help complete it</dt><dd className="mt-1 leading-5 text-foreground/85">{selected.supportingActorIds.map(personName).join(", ") || "No supporting actors"}</dd></div></dl></Section>
      <Section title="Before starting" icon={<ListChecks className="size-3.5 text-primary" />}><p className="whitespace-pre-line break-words border-l-2 border-primary/40 pl-3 leading-6 text-foreground/85">{selected.precondition || "No precondition provided yet."}</p></Section>
      <Section title="Place in the hierarchy" icon={<GitBranch className="size-3.5 text-primary" />}>
        <div className="space-y-2"><p className="text-[10px] text-muted-foreground">Parent · the broader goal</p>{parent ? card(parent, parentRelation?.id) : <p className="text-xs text-muted-foreground">{selected.parentUseCaseId ? `Parent: ${selected.parentUseCaseId} (not loaded)` : "Top-level use case · no parent"}</p>}</div>
        <div className="space-y-2 pt-1"><p className="text-[10px] text-muted-foreground">Children · {children.length} more detailed {children.length === 1 ? "use case" : "use cases"}</p>{children.length ? children.map((child) => card(child, relationships.find((relation) => relation.type === "part-of" && relation.targetId === child.id)?.id)) : <p className="text-xs text-muted-foreground">No child use cases.</p>}</div>
      </Section>
      {links.length > 0 ? <Section title="Related behavior" icon={<ArrowUpRight className="size-3.5 text-primary" />}><div className="space-y-3">{links.map((relation) => {
        const outgoing = relation.sourceId === selected.id;
        const otherId = outgoing ? relation.targetId : relation.sourceId;
        const other = items.find((item) => item.id === otherId);
        return <div key={relation.id} className="space-y-1.5"><p className="text-[10px] text-muted-foreground">{relationshipText[relation.type][outgoing ? 0 : 1]}</p>{other ? card(other, relation.id) : <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3"><span>{actors.get(otherId)?.name ?? otherId}</span>{!isMock ? <button type="button" disabled={busy} aria-label={`Remove relationship ${relation.id}`} onClick={() => onDeleteRelationship(relation.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3" /></button> : null}</div>}{relation.condition ? <p className="break-words pl-2 text-[11px] leading-5 text-muted-foreground">Condition: {relation.condition}</p> : null}</div>;
      })}</div></Section> : null}
      <details className="border-t border-border/60 pt-3"><summary className="cursor-pointer text-[11px] text-muted-foreground"><FileText className="mr-1 inline size-3" />Source references · {selected.sourceTrace.length}</summary><ul className="mt-2 space-y-1.5">{selected.sourceTrace.map((source, index) => <li key={`${source}-${index}`} className="break-words rounded bg-muted/35 px-2 py-1.5 text-[10px] leading-4 text-muted-foreground">{source}</li>)}</ul></details>
    </div>
  </aside>;
}
