"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, CircleDot, FolderTree, Info, Search } from "lucide-react";
import type { UseCaseActorResponse, UseCaseItemResponse, UseCaseLevel, UseCaseStatus } from "@/lib/api/services/useCaseModel";
import { USE_CASE_LEVEL_META, USE_CASE_PRIORITY_META } from "@/lib/usecases/useCaseLabels";

type TreeRow = { item: UseCaseItemResponse; ancestors: string[]; childCount: number };

function buildRows(items: UseCaseItemResponse[]): TreeRow[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const children = new Map<string, UseCaseItemResponse[]>();
  for (const item of items) {
    const parent = item.parentUseCaseId && byId.has(item.parentUseCaseId) ? item.parentUseCaseId : "";
    const siblings = children.get(parent) ?? [];
    siblings.push(item);
    children.set(parent, siblings);
  }
  const visited = new Set<string>();
  const rows: TreeRow[] = [];
  const visit = (item: UseCaseItemResponse, ancestors: string[]) => {
    if (visited.has(item.id)) return;
    visited.add(item.id);
    const descendants = children.get(item.id) ?? [];
    rows.push({ item, ancestors, childCount: descendants.length });
    for (const child of descendants) visit(child, [...ancestors, item.id]);
  };
  for (const root of children.get("") ?? []) visit(root, []);
  // Keep malformed/orphaned backend rows reviewable without looping over cycles.
  for (const item of items) visit(item, []);
  return rows;
}

export function UseCaseTable({ items, actors, level, selectedId, onSelect, renderStatus }: {
  items: UseCaseItemResponse[];
  actors: Map<string, UseCaseActorResponse>;
  level: "all" | UseCaseLevel;
  selectedId?: string;
  onSelect: (id: string) => void;
  renderStatus: (status: UseCaseStatus) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const rows = useMemo(() => buildRows(items), [items]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const filtered = level !== "all" || Boolean(query.trim());
  const { visible, matches } = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = new Set<string>();
    const included = new Set<string>();
    for (const row of rows) {
      const { item } = row;
      const actorName = actors.get(item.primaryActorId)?.name ?? "";
      const searchable = `${item.id} ${item.title} ${item.subsystem} ${item.status} ${actorName}`.toLowerCase();
      if ((level === "all" || item.level === level) && searchable.includes(term)) {
        matches.add(item.id);
        included.add(item.id);
        row.ancestors.forEach((id) => included.add(id));
      }
    }
    return {
      matches,
      visible: rows.filter((row) => included.has(row.item.id) && (filtered || !row.ancestors.some((id) => collapsed.has(id)))),
    };
  }, [actors, collapsed, filtered, level, query, rows]);
  const toggle = (id: string) => setCollapsed((old) => {
    const next = new Set(old);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/25">
    <div className="shrink-0 border-b border-border/70 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Use case catalog</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {visible.length} of {items.length} rows shown · {filtered ? `${matches.size} matches; hierarchy parents remain visible for context` : "Expand a capability group to inspect its use cases"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={filtered} onClick={() => setCollapsed(new Set())} className="rounded px-2 py-1 text-[11px] text-primary hover:bg-primary/10 disabled:opacity-40">Expand all</button>
          <button type="button" disabled={filtered} onClick={() => setCollapsed(new Set(rows.filter((row) => row.childCount).map((row) => row.item.id)))} className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-40">Collapse all</button>
          <label className="flex h-9 items-center gap-2 rounded-md border border-border/70 bg-background/45 px-2.5 text-muted-foreground focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="size-3.5" />
            <input aria-label="Search use cases" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, name, area or actor" className="w-52 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground" />
          </label>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/50 pt-3 text-[11px] text-muted-foreground" aria-label="Use case level guide">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground"><Info className="size-3.5 text-primary" />How to read the hierarchy</span>
        {(Object.keys(USE_CASE_LEVEL_META) as UseCaseLevel[]).map((item) => <span key={item} title={USE_CASE_LEVEL_META[item].description} className="inline-flex items-center gap-1.5"><span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">{item}</span>{USE_CASE_LEVEL_META[item].label}{item !== "L2" ? <span aria-hidden>→</span> : null}</span>)}
      </div>
    </div>
    <div role="region" aria-label="Use case catalog, scroll to see more rows" tabIndex={0} className="min-h-0 flex-1 overflow-auto overscroll-contain outline-none [scrollbar-gutter:stable] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50">
      <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
        <thead className="sticky top-0 z-10 bg-card"><tr className="text-[11px] text-muted-foreground">
          {["Level", "Use case", "Main actor", "Area / subsystem", "Evidence", "Priority"].map((label) => <th key={label} scope="col" className="border-b border-border px-4 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody>{visible.map(({ item, ancestors, childCount }) => {
          const isParent = childCount > 0;
          const isContext = filtered && !matches.has(item.id);
          const parentId = ancestors.at(-1);
          const parent = parentId ? byId.get(parentId) : undefined;
          const expanded = filtered || !collapsed.has(item.id);
          const levelMeta = USE_CASE_LEVEL_META[item.level];
          const priorityMeta = USE_CASE_PRIORITY_META[item.priority];
          return <tr key={item.id} tabIndex={0} aria-selected={selectedId === item.id} onClick={() => onSelect(item.id)} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(item.id); } }} className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${selectedId === item.id ? "bg-primary/10" : isParent ? "bg-muted/40 hover:bg-muted/60" : "hover:bg-muted/25"}`}>
            <td className="border-b border-border/50 px-4 py-3 align-top"><div className="flex flex-col items-start gap-1"><span title={levelMeta.description} className={`inline-flex rounded-md border px-2 py-1 font-mono text-[10px] font-semibold ${item.level === "L0" ? "border-primary/50 bg-primary/20 text-primary" : item.level === "L1" ? "border-primary/25 bg-primary/5 text-primary" : "border-border bg-background/40 text-muted-foreground"}`}>{item.level}</span><span className="text-[10px] text-muted-foreground">{levelMeta.shortLabel}</span></div></td>
            <td className="min-w-[360px] border-b border-border/50 px-4 py-3">
              <div className="relative flex items-start gap-2" style={{ paddingLeft: ancestors.length * 28 }}>
                {ancestors.map((id, index) => <span key={id} aria-hidden className="absolute -bottom-3 -top-3 border-l border-primary/25" style={{ left: index * 28 + 10 }} />)}
                {ancestors.length > 0 ? <span aria-hidden className="absolute top-3 w-[18px] border-t border-primary/30" style={{ left: (ancestors.length - 1) * 28 + 10 }} /> : null}
                {isParent ? <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${item.title}`} aria-expanded={expanded} disabled={filtered} onClick={(event) => { event.stopPropagation(); toggle(item.id); }} className="relative flex size-7 shrink-0 items-center justify-center rounded border border-border bg-background text-primary hover:border-primary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">{expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</button> : <span className="relative flex size-7 shrink-0 items-center justify-center text-muted-foreground"><CircleDot className="size-3" /></span>}
                <div className="min-w-0 flex-1"><button type="button" onClick={(event) => { event.stopPropagation(); onSelect(item.id); }} className={`block text-left text-sm leading-5 hover:text-primary focus-visible:outline-primary ${isParent ? "font-semibold" : "font-normal"} ${isContext ? "text-muted-foreground" : "text-foreground"}`} aria-current={selectedId === item.id ? "true" : undefined}>{item.title}</button>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground"><span className="font-mono">{item.id}</span>{isParent ? <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary"><FolderTree className="size-3" />{childCount} {childCount === 1 ? "child use case" : "child use cases"}</span> : null}{isContext ? <span>Parent context</span> : null}</div>
                  {parent ? <p className="mt-1 text-[11px] text-muted-foreground">Inside <span className="text-foreground/75">{parent.title}</span></p> : null}
                </div>
              </div>
            </td>
            <td className="border-b border-border/50 px-4 py-3 text-xs text-muted-foreground" title={actors.get(item.primaryActorId)?.id}>{actors.get(item.primaryActorId)?.name ?? "Not assigned"}</td>
            <td className="max-w-[210px] truncate border-b border-border/50 px-4 py-3 text-xs text-muted-foreground" title={item.subsystem}>{item.subsystem || "Not assigned"}</td>
            <td className="border-b border-border/50 px-4 py-3">{renderStatus(item.status)}</td>
            <td className="border-b border-border/50 px-4 py-3 text-xs text-muted-foreground" title={`${item.priority}: ${priorityMeta.description}`}>{priorityMeta.label}</td>
          </tr>;
        })}</tbody>
      </table>
      {visible.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">{items.length ? "No use cases match this search." : "No use case model yet. Generate one from the project BRD and PRD to get started."}</p> : null}
    </div>
  </section>;
}
