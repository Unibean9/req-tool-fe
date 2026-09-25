"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FolderTree, Loader2, RotateCw, Search } from "lucide-react";
import type {
  UseCaseActorResponse,
  UseCaseDetailStatus,
  UseCaseItemResponse,
  UseCaseModuleResponse,
  UseCaseRelationshipResponse,
} from "@/lib/api/services/useCaseModel";
import {
  USE_CASE_EVIDENCE_META,
  USE_CASE_PRIORITY_META,
  USE_CASE_RELATION_META,
} from "@/lib/usecases/useCaseLabels";

type ModuleGroup = {
  key: string;
  name: string;
  goal: string | null;
  items: UseCaseItemResponse[];
};

function buildModuleGroups(items: UseCaseItemResponse[], modules: UseCaseModuleResponse[]): ModuleGroup[] {
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const groups = new Map<string, ModuleGroup>();

  for (const capability of modules) {
    groups.set(capability.id, {
      key: capability.id,
      name: capability.name,
      goal: capability.goal,
      items: [],
    });
  }

  for (const item of items) {
    const capability = moduleById.get(item.moduleId);
    const key = capability?.id ?? "unassigned";
    const group = groups.get(key) ?? {
      key,
      name: capability?.name ?? "Unassigned module",
      goal: capability?.goal ?? null,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }

  return Array.from(groups.values()).filter((group) => group.items.length > 0);
}

function EvidenceBadge({ evidence }: { evidence: UseCaseItemResponse["evidence"] }) {
  const meta = USE_CASE_EVIDENCE_META[evidence];
  return (
    <span
      title={meta.description}
      className={
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium " +
        (evidence === "explicit"
          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
          : "border-violet-500/35 bg-violet-500/10 text-violet-300")
      }
    >
      {meta.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: UseCaseItemResponse["priority"] }) {
  const meta = USE_CASE_PRIORITY_META[priority];
  return (
    <span
      title={meta.description}
      className={
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium " +
        (priority === "required"
          ? "border-orange-500/35 bg-orange-500/10 text-orange-200"
          : priority === "recommended"
            ? "border-sky-500/35 bg-sky-500/10 text-sky-200"
            : "border-border/70 bg-muted/30 text-muted-foreground")
      }
    >
      {meta.label}
    </span>
  );
}

function RelationshipChips({
  item,
  relationships,
  itemNames,
}: {
  item: UseCaseItemResponse;
  relationships: UseCaseRelationshipResponse[];
  itemNames: Map<string, string>;
}) {
  const links = relationships.filter(
    (relation) =>
      (relation.sourceId === item.id || relation.targetId === item.id),
  );

  if (!links.length) return <span className="text-muted-foreground/60">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {links.map((relation) => {
        const outgoing = relation.sourceId === item.id;
        const otherId = outgoing ? relation.targetId : relation.sourceId;
        const otherName = itemNames.get(otherId) ?? otherId;
        const meta = USE_CASE_RELATION_META[relation.type];
        const relationTitle =
          (outgoing ? meta.outgoing : meta.incoming) +
          ": " +
          otherName +
          (relation.condition ? " · " + relation.condition : "");
        return (
          <span
            key={relation.id}
            title={relationTitle}
            className="inline-flex max-w-full items-center gap-1 rounded border border-primary/25 bg-primary/8 px-1.5 py-0.5 font-mono text-[10px] text-primary"
          >
            <span>{outgoing ? "→" : "←"}</span>
            <span>{meta.label}</span>
            <span className="max-w-28 truncate font-sans text-muted-foreground">{otherName}</span>
          </span>
        );
      })}
    </div>
  );
}

function DetailStatusLine({
  status,
  retrying,
  retryDisabled,
  onRetry,
}: {
  status: UseCaseDetailStatus | undefined;
  retrying: boolean;
  retryDisabled: boolean;
  onRetry: () => void;
}) {
  if (status === "pending") {
    return (
      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Writing detail…
      </span>
    );
  }
  if (status !== "failed") return null;
  return (
    <span className="mt-1 inline-flex items-center gap-2 text-[11px] text-amber-300">
      No detail yet
      <button
        type="button"
        disabled={retryDisabled || retrying}
        onClick={(event) => {
          event.stopPropagation();
          onRetry();
        }}
        onKeyDown={(event) => event.stopPropagation()}
        className="inline-flex items-center gap-1 rounded border border-amber-500/40 px-1.5 py-0.5 font-medium hover:bg-amber-500/10 disabled:opacity-50"
      >
        {retrying ? <Loader2 className="size-3 animate-spin" /> : <RotateCw className="size-3" />}
        Retry
      </button>
    </span>
  );
}

export function UseCaseTable({
  items,
  modules,
  actors,
  relationships,
  selectedId,
  onSelect,
  detailStatus,
  onRetryDetail,
  retryingDetailId,
  retryDisabled,
}: {
  items: UseCaseItemResponse[];
  modules: UseCaseModuleResponse[];
  actors: Map<string, UseCaseActorResponse>;
  relationships: UseCaseRelationshipResponse[];
  selectedId?: string;
  onSelect: (id: string) => void;
  detailStatus?: Record<string, UseCaseDetailStatus>;
  onRetryDetail: (id: string) => void;
  retryingDetailId?: string;
  retryDisabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const groups = useMemo(() => buildModuleGroups(items, modules), [items, modules]);
  const itemNames = useMemo(() => new Map(items.map((item) => [item.id, item.name])), [items]);
  const term = query.trim().toLowerCase();

  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => {
          const filteredItems = term
            ? group.items.filter((item) => {
                const actorNames = [
                  actors.get(item.primaryActorId)?.name ?? "",
                  ...item.secondaryActorIds.map((id) => actors.get(id)?.name ?? ""),
                ];
                const relationNames = relationships
                  .filter((relation) => relation.sourceId === item.id || relation.targetId === item.id)
                  .map(
                    (relation) =>
                      relation.type +
                      " " +
                      (itemNames.get(relation.sourceId) ?? "") +
                      " " +
                      (itemNames.get(relation.targetId) ?? ""),
                  );
                const searchable = [
                  item.id,
                  item.name,
                  group.name,
                  item.evidence,
                  item.priority,
                  ...actorNames,
                  ...relationNames,
                ]
                  .join(" ")
                  .toLowerCase();
                return searchable.includes(term);
              })
            : group.items;
          return { ...group, items: filteredItems };
        })
        .filter((group) => group.items.length > 0),
    [actors, groups, itemNames, relationships, term],
  );

  const toggleGroup = (key: string) =>
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const visibleCount = visibleGroups.reduce((total, group) => total + group.items.length, 0);

  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/25">
      <div className="shrink-0 border-b border-border/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Use case table</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length} use cases · {modules.length} modules
              {term ? " · " + visibleCount + " matches" : ""}
            </p>
          </div>
          <label className="flex h-9 items-center gap-2 rounded-md border border-border/70 bg-background/45 px-2.5 text-muted-foreground focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="size-3.5" />
            <input
              aria-label="Search use cases"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ID, name, module or actor"
              className="w-56 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      </div>

      <div
        role="region"
        aria-label="Use case table, scroll to see more rows"
        tabIndex={0}
        className="min-h-0 flex-1 overflow-auto overscroll-contain outline-none [scrollbar-gutter:stable] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
      >
        {!visibleGroups.length ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {items.length
              ? "No use cases match this search."
              : "Generate the model from the project BRD and PRD to populate this table."}
          </p>
        ) : (
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left [table-layout:fixed]">
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="text-[11px] text-muted-foreground">
                {["Use case", "Main actor", "Relationships", "Evidence", "Priority"].map((label) => (
                  <th key={label} scope="col" className="border-b border-border px-4 py-2 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            {visibleGroups.map((group) => {
              const collapsed = !term && collapsedGroups.has(group.key);
              return (
                <tbody key={group.key}>
                  <tr>
                    <td colSpan={5} className="p-0">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        title={group.goal ?? undefined}
                        className="flex w-full items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2.5 text-left hover:bg-muted/45"
                      >
                        {collapsed ? (
                          <ChevronRight className="size-3.5 shrink-0 text-primary" />
                        ) : (
                          <ChevronDown className="size-3.5 shrink-0 text-primary" />
                        )}
                        <FolderTree className="size-3.5 shrink-0 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{group.name}</span>
                        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                          {group.items.length} use case{group.items.length === 1 ? "" : "s"}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {!collapsed
                    ? group.items.map((item) => {
                        const actor = actors.get(item.primaryActorId);
                        return (
                          <tr
                            key={item.id}
                            tabIndex={0}
                            aria-selected={selectedId === item.id}
                            onClick={() => onSelect(item.id)}
                            onKeyDown={(event) => {
                              if (event.target !== event.currentTarget) return;
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onSelect(item.id);
                              }
                            }}
                            className={
                              "cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary " +
                              (selectedId === item.id ? "bg-primary/10" : "hover:bg-muted/15")
                            }
                          >
                            <td className="border-b border-border/40 px-4 py-2.5 align-top">
                              <div className="min-w-0">
                                <span className="block text-sm font-medium leading-5 text-foreground">
                                  {item.name}
                                </span>
                                <span className="mt-1 block break-all font-mono text-[11px] text-muted-foreground">
                                  {item.id}
                                </span>
                                <DetailStatusLine
                                  status={detailStatus?.[item.id]}
                                  retrying={retryingDetailId === item.id}
                                  retryDisabled={retryDisabled || Boolean(retryingDetailId)}
                                  onRetry={() => onRetryDetail(item.id)}
                                />
                              </div>
                            </td>
                            <td className="border-b border-border/40 px-4 py-2.5 align-top text-xs">
                              {actor ? (
                                <span
                                  title={actor.kind + " · " + actor.id}
                                  className="inline-block break-words rounded-full border border-border/70 bg-background/60 px-2 py-1 leading-4 text-foreground/85"
                                >
                                  {actor.name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Not assigned</span>
                              )}
                            </td>
                            <td className="border-b border-border/40 px-4 py-2.5 align-top text-xs">
                              <RelationshipChips item={item} relationships={relationships} itemNames={itemNames} />
                            </td>
                            <td className="border-b border-border/40 px-4 py-2.5 align-top">
                              <EvidenceBadge evidence={item.evidence} />
                            </td>
                            <td className="border-b border-border/40 px-4 py-2.5 align-top">
                              <PriorityBadge priority={item.priority} />
                            </td>
                          </tr>
                        );
                      })
                    : null}
                </tbody>
              );
            })}
          </table>
        )}
      </div>
    </section>
  );
}
