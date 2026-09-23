"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, CircleDot, FolderTree, Search } from "lucide-react";
import type { UseCaseActorResponse, UseCaseItemResponse, UseCaseLevel, UseCaseStatus } from "@/lib/api/services/useCaseModel";

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
  const filtered = level !== "all" || Boolean(query.trim());
  const { visible, matches } = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = new Set<string>();
    const included = new Set<string>();
    for (const row of rows) {
      const { item } = row;
      if ((level === "all" || item.level === level) && `${item.id} ${item.title} ${item.subsystem} ${item.status}`.toLowerCase().includes(term)) {
        matches.add(item.id);
        included.add(item.id);
        row.ancestors.forEach((id) => included.add(id));
      }
    }
    return { matches, visible: rows.filter((row) => included.has(row.item.id) && (filtered || !row.ancestors.some((id) => collapsed.has(id)))) };
  }, [rows, query, level, filtered, collapsed]);
  const toggle = (id: string) => setCollapsed((old) => {
    const next = new Set(old);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/25">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
      <div><h2 className="text-sm font-semibold">Use Case Table</h2><p className="mt-1 text-xs text-muted-foreground">{visible.length} shown · {filtered ? `${matches.size} matches; parents shown for context` : "Expand a parent to view its children"}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={filtered} onClick={() => setCollapsed(new Set())} className="rounded px-2 py-1 text-[11px] text-primary hover:bg-primary/10 disabled:opacity-40">Expand all</button>
        <button type="button" disabled={filtered} onClick={() => setCollapsed(new Set(rows.filter((row) => row.childCount).map((row) => row.item.id)))} className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-40">Collapse all</button>
        <label className="flex h-8 items-center gap-2 rounded-md border border-border/70 bg-background/45 px-2.5 text-muted-foreground"><Search className="size-3.5" /><input aria-label="Search use cases" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search use cases" className="w-36 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground" /></label>
      </div>
    </div>
    <div role="region" aria-label="Use case table, scroll to see more rows" tabIndex={0} className="min-h-0 flex-1 overflow-auto overscroll-contain outline-none [scrollbar-gutter:stable] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50">
      <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left">
        <thead className="sticky top-0 z-10 bg-card"><tr className="text-[11px] text-muted-foreground">{["Level", "Use case hierarchy", "Primary actor", "Subsystem", "Status", "Priority"].map((label) => <th key={label} scope="col" className="border-b border-border px-4 py-3 font-medium">{label}</th>)}</tr></thead>
        <tbody>{visible.map(({ item, ancestors, childCount }) => {
          const isParent = childCount > 0;
          const isContext = filtered && !matches.has(item.id);
          const parentId = ancestors.at(-1);
          const expanded = filtered || !collapsed.has(item.id);
          return <tr key={item.id} onClick={() => onSelect(item.id)} className={`cursor-pointer transition-colors ${selectedId === item.id ? "bg-primary/10" : isParent ? "bg-muted/40 hover:bg-muted/60" : "hover:bg-muted/25"}`}>
            <td className="border-b border-border/50 px-4 py-3 align-top"><span className={`inline-flex rounded-md border px-2 py-1 font-mono text-[10px] font-semibold ${item.level === "L0" ? "border-primary/50 bg-primary/20 text-primary" : item.level === "L1" ? "border-primary/25 bg-primary/5 text-primary" : "border-border bg-background/40 text-muted-foreground"}`}>{item.level}</span></td>
            <td className="min-w-[340px] border-b border-border/50 px-4 py-3">
              <div className="relative flex items-start gap-2" style={{ paddingLeft: ancestors.length * 28 }}>
                {ancestors.map((id, index) => <span key={id} aria-hidden className="absolute -bottom-3 -top-3 border-l border-primary/25" style={{ left: index * 28 + 10 }} />)}
                {ancestors.length > 0 ? <span aria-hidden className="absolute top-3 w-[18px] border-t border-primary/30" style={{ left: (ancestors.length - 1) * 28 + 10 }} /> : null}
                {isParent ? <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${item.title}`} aria-expanded={expanded} disabled={filtered} onClick={(event) => { event.stopPropagation(); toggle(item.id); }} className="relative flex size-6 shrink-0 items-center justify-center rounded border border-border bg-background text-primary hover:border-primary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">{expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</button> : <span className="relative flex size-6 shrink-0 items-center justify-center text-muted-foreground"><CircleDot className="size-3" /></span>}
                <div className="min-w-0 flex-1"><button type="button" onClick={(event) => { event.stopPropagation(); onSelect(item.id); }} className={`block text-left text-xs leading-5 hover:text-primary focus-visible:outline-primary ${isParent ? "font-semibold" : "font-normal"} ${isContext ? "text-muted-foreground" : "text-foreground"}`} aria-current={selectedId === item.id ? "true" : undefined}>{item.title}</button>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground"><span className="font-mono">{item.id}</span>{isParent ? <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary"><FolderTree className="size-3" />{childCount} {childCount === 1 ? "child" : "children"}</span> : null}{isContext ? <span>Parent context</span> : null}</div>
                  {parentId ? <p className="mt-1 text-[10px] text-muted-foreground">Child of <span className="font-mono">{parentId}</span></p> : null}
                </div>
              </div>
            </td>
            <td className="border-b border-border/50 px-4 py-3 text-xs text-muted-foreground">{actors.get(item.primaryActorId)?.name ?? "—"}</td>
            <td className="max-w-[210px] truncate border-b border-border/50 px-4 py-3 text-xs text-muted-foreground" title={item.subsystem}>{item.subsystem}</td>
            <td className="border-b border-border/50 px-4 py-3">{renderStatus(item.status)}</td>
            <td className="border-b border-border/50 px-4 py-3 text-xs text-muted-foreground">{item.priority}</td>
          </tr>;
        })}</tbody>
      </table>
      {visible.length === 0 ? <p className="px-4 py-8 text-center text-xs text-muted-foreground">{items.length ? "No matching use cases." : "No use case model yet. Generate from the project BRD and PRD to get started."}</p> : null}
    </div>
  </section>;
}
