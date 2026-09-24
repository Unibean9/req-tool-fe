"use client";

import { ArrowRight, BookOpen, CheckCircle2, CircleAlert, FileText, Flag, GitBranch, ListChecks, Target, Users, XCircle } from "lucide-react";
import type {
  UseCaseActorResponse,
  UseCaseFlowResponse,
  UseCaseFlowStepResponse,
  UseCaseItemResponse,
  UseCaseModuleResponse,
  UseCaseRelationshipResponse,
} from "@/lib/api/services/useCaseModel";
import { USE_CASE_EVIDENCE_META, USE_CASE_PRIORITY_META, USE_CASE_RELATION_META } from "@/lib/usecases/useCaseLabels";

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function EmptyValue({ children = "Not provided in the BRD/PRD source." }: { children?: React.ReactNode }) {
  return <p className="rounded-lg border border-border/60 bg-background/25 p-3 text-xs text-muted-foreground">{children}</p>;
}

function BulletList({ values, empty = "None recorded." }: { values: string[]; empty?: string }) {
  if (!values.length) return <EmptyValue>{empty}</EmptyValue>;
  return (
    <ul className="space-y-2">
      {values.map((value, index) => (
        <li key={index} className="rounded-lg border border-border/60 bg-background/25 px-3 py-2 text-sm leading-5 text-foreground/85">
          {value}
        </li>
      ))}
    </ul>
  );
}

function FlowStep({ step, resolveParticipant }: { step: UseCaseFlowStepResponse; resolveParticipant: (step: UseCaseFlowStepResponse) => string }) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-border/60 bg-background/25 p-3">
      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] text-primary">
        {step.step}
      </span>
      <p className="min-w-0 text-sm leading-5 text-foreground/90">
        <span className="mr-1.5 text-xs text-muted-foreground">{resolveParticipant(step)}:</span>
        {step.action}
      </p>
    </li>
  );
}

function FlowGroup({
  title,
  flows,
  resolveParticipant,
}: {
  title: string;
  flows: UseCaseFlowResponse[];
  resolveParticipant: (step: UseCaseFlowStepResponse) => string;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      {!flows.length ? (
        <EmptyValue>None recorded for this use case.</EmptyValue>
      ) : (
        flows.map((flow) => (
          <div key={flow.label} className="rounded-lg border border-border/60 bg-background/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">{flow.label}</span>
              {flow.branchAtStep ? (
                <span className="rounded-full border border-border/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  branches at step {flow.branchAtStep}
                </span>
              ) : null}
            </div>
            <ol className="mt-3 space-y-2">
              {flow.steps.map((step) => (
                <FlowStep key={step.step} step={step} resolveParticipant={resolveParticipant} />
              ))}
            </ol>
          </div>
        ))
      )}
    </div>
  );
}

export function UseCaseDetails({
  selected,
  items,
  modules,
  actors,
  relationships,
  onSelect,
}: {
  selected: UseCaseItemResponse | null;
  items: UseCaseItemResponse[];
  modules: Map<string, UseCaseModuleResponse>;
  actors: Map<string, UseCaseActorResponse>;
  relationships: UseCaseRelationshipResponse[];
  onSelect: (id: string) => void;
}) {
  if (!selected) {
    return (
      <aside aria-label="Use case details" className="rounded-xl border border-border/70 bg-card/40 p-5">
        <h2 className="text-sm font-semibold text-foreground">Use case details</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a row in the table to inspect the generated detail and its BRD/PRD traceability.
        </p>
      </aside>
    );
  }

  const capability = modules.get(selected.moduleId);
  const useCaseById = new Map(items.map((item) => [item.id, item]));
  const displayActor = (id: string) => actors.get(id)?.name ?? id;
  const resolveParticipant = (step: UseCaseFlowStepResponse) => {
    if (step.participantType === "system") return "System";
    return step.participantId ? displayActor(step.participantId) : "External participant";
  };
  const directRelationships = relationships.filter(
    (relation) => relation.sourceId === selected.id || relation.targetId === selected.id,
  );
  const evidenceMeta = USE_CASE_EVIDENCE_META[selected.evidence];
  const priorityMeta = USE_CASE_PRIORITY_META[selected.priority];

  return (
    <aside aria-label="Use case details" className="min-h-0 max-h-[calc(100vh-230px)] overflow-y-auto rounded-xl border border-border/70 bg-card/40 [scrollbar-gutter:stable]">
      <header className="space-y-3 border-b border-border/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Use case detail</span>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
            {capability?.name ?? "Unassigned module"}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-semibold leading-6 text-foreground">{selected.name}</h2>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{selected.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span title={evidenceMeta.description} className="rounded-full border border-violet-500/35 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">
            {evidenceMeta.label} evidence
          </span>
          <span title={priorityMeta.description} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            <Flag className="size-3" />
            {priorityMeta.label}
          </span>
        </div>
      </header>

      <div className="space-y-6 p-4">
        <Section title="Description" icon={<Target className="size-4 text-primary" />}>
          {selected.description ? (
            <p className="whitespace-pre-line break-words leading-6 text-foreground/90">{selected.description}</p>
          ) : (
            <EmptyValue />
          )}
        </Section>

        <Section title="Actors" icon={<Users className="size-4 text-primary" />}>
          <div className="space-y-2">
            <div className="rounded-lg border border-border/60 bg-background/25 p-3">
              <p className="text-xs text-muted-foreground">Primary actor</p>
              <p className="mt-1 font-medium text-foreground">{displayActor(selected.primaryActorId)}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/25 p-3">
              <p className="text-xs text-muted-foreground">Supporting actors</p>
              <p className="mt-1 text-foreground/85">
                {selected.secondaryActorIds.length
                  ? selected.secondaryActorIds.map(displayActor).join(", ")
                  : "None recorded."}
              </p>
            </div>
          </div>
        </Section>

        <Section title={"Relationships · " + directRelationships.length} icon={<GitBranch className="size-4 text-primary" />}>
          {!directRelationships.length ? (
            <EmptyValue>No include, extend or generalization is recorded for this use case.</EmptyValue>
          ) : (
            <div className="space-y-2">
              {directRelationships.map((relation) => {
                const outgoing = relation.sourceId === selected.id;
                const peerId = outgoing ? relation.targetId : relation.sourceId;
                const peer = useCaseById.get(peerId);
                const peerName = peer?.name ?? actors.get(peerId)?.name ?? peerId;
                const meta = USE_CASE_RELATION_META[relation.type];
                return (
                  <button
                    type="button"
                    key={relation.id}
                    onClick={() => (peer ? onSelect(peer.id) : undefined)}
                    className="w-full rounded-lg border border-border/60 bg-background/25 p-3 text-left hover:border-primary/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                        {meta.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{outgoing ? meta.outgoing : meta.incoming}</span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {peerName}
                      {peer ? <ArrowRight className="size-3.5 text-primary" /> : null}
                    </p>
                    {relation.condition ? <p className="mt-2 text-xs leading-5 text-muted-foreground">Condition: {relation.condition}</p> : null}
                    {relation.reason ? <p className="mt-1 text-xs leading-5 text-muted-foreground">Evidence: {relation.reason}</p> : null}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Trigger" icon={<BookOpen className="size-4 text-primary" />}>
          {selected.trigger ? <p className="rounded-lg border border-border/60 bg-background/25 p-3 leading-6 text-foreground/85">{selected.trigger}</p> : <EmptyValue />}
        </Section>

        <Section title="Preconditions" icon={<ListChecks className="size-4 text-primary" />}>
          <BulletList values={selected.preconditions} />
        </Section>

        <Section title="Main flow" icon={<CheckCircle2 className="size-4 text-primary" />}>
          {!selected.mainFlow.length ? (
            <EmptyValue>AI could not extract a main flow from the available source.</EmptyValue>
          ) : (
            <ol className="space-y-2">
              {selected.mainFlow.map((step) => (
                <FlowStep key={step.step} step={step} resolveParticipant={resolveParticipant} />
              ))}
            </ol>
          )}
        </Section>

        <Section title="Alternative and exception flows" icon={<CircleAlert className="size-4 text-primary" />}>
          <FlowGroup title="Alternative flows" flows={selected.alternativeFlows} resolveParticipant={resolveParticipant} />
          <FlowGroup title="Exception flows" flows={selected.exceptionFlows} resolveParticipant={resolveParticipant} />
        </Section>

        <Section title="Postconditions" icon={<CheckCircle2 className="size-4 text-primary" />}>
          <div className="space-y-3">
            <div>
              <h4 className="mb-2 text-xs font-medium text-emerald-300">On success</h4>
              <BulletList values={selected.postconditionsSuccess} />
            </div>
            <div>
              <h4 className="mb-2 text-xs font-medium text-rose-300">On failure</h4>
              <BulletList values={selected.postconditionsFailure} />
            </div>
          </div>
        </Section>

        <Section title="Business rules" icon={<Flag className="size-4 text-primary" />}>
          <BulletList values={selected.businessRules} />
        </Section>

        <Section title="Related requirements" icon={<FileText className="size-4 text-primary" />}>
          {!selected.relatedRequirements.length ? (
            <EmptyValue>No linked requirement was returned.</EmptyValue>
          ) : (
            <div className="space-y-2">
              {selected.relatedRequirements.map((requirement) => (
                <div key={requirement.id} className="rounded-lg border border-border/60 bg-background/25 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-primary">{requirement.id}</span>
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">{requirement.type}</span>
                  </div>
                  {requirement.title ? <p className="mt-2 text-sm leading-5 text-foreground/85">{requirement.title}</p> : null}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Traceability" icon={<FileText className="size-4 text-primary" />}>
          {!selected.sourceTrace.length ? (
            <EmptyValue>No source reference was recorded.</EmptyValue>
          ) : (
            <ul className="space-y-2">
              {selected.sourceTrace.map((source, index) => (
                <li key={source + index} className="break-words rounded border border-border/60 bg-muted/35 px-3 py-2 text-xs leading-5 text-muted-foreground">
                  {source}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {selected.postconditionsFailure.length ? (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/5 p-3 text-xs text-rose-200">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            Failure postconditions are available for review.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
