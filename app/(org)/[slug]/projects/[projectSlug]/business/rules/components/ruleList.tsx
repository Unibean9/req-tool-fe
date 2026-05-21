"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Calculator,
  ClipboardCheck,
  FileCheck2,
  History,
  GitBranch,
  Pencil,
  Scale,
  Sparkles,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteProjectRule,
  useProjectRules,
  type ProjectRule,
} from "@/hooks/useRule";
import type { ProjectRuleType } from "@/lib/api/services/fetchRule";
import { cn } from "@/lib/utils";

import { DeleteRuleDialog } from "./deleteRuleDialog";
import { RuleFormDialog } from "./ruleFormDialog";
import type { RuleDynamicFilter, RuleTypeFilter } from "./ruleToolbar";

const RULE_TYPE_LABELS: Record<ProjectRuleType, string> = {
  constraint: "Constraint",
  calculation: "Calculation",
  validation: "Validation",
  process: "Process",
  policy: "Policy",
  regulation: "Regulation",
};

type RuleTypeMeta = {
  icon: LucideIcon;
  iconClass: string;
  iconBoxClass: string;
  badgeClass: string;
};

const RULE_TYPE_META: Record<ProjectRuleType, RuleTypeMeta> = {
  constraint: {
    icon: Ban,
    iconBoxClass: "bg-rose-50 dark:bg-rose-950/45",
    iconClass: "text-rose-700 dark:text-rose-300",
    badgeClass:
      "border-rose-500/25 bg-rose-50 text-rose-800 dark:bg-rose-950/55 dark:text-rose-300",
  },
  calculation: {
    icon: Calculator,
    iconBoxClass: "bg-amber-50 dark:bg-amber-950/45",
    iconClass: "text-amber-700 dark:text-amber-300",
    badgeClass:
      "border-amber-500/25 bg-amber-50 text-amber-800 dark:bg-amber-950/55 dark:text-amber-300",
  },
  validation: {
    icon: ClipboardCheck,
    iconBoxClass: "bg-emerald-50 dark:bg-emerald-950/45",
    iconClass: "text-emerald-700 dark:text-emerald-300",
    badgeClass:
      "border-emerald-500/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300",
  },
  process: {
    icon: GitBranch,
    iconBoxClass: "bg-sky-50 dark:bg-sky-950/45",
    iconClass: "text-sky-700 dark:text-sky-300",
    badgeClass:
      "border-sky-500/25 bg-sky-50 text-sky-800 dark:bg-sky-950/55 dark:text-sky-300",
  },
  policy: {
    icon: ShieldCheck,
    iconBoxClass: "bg-violet-50 dark:bg-violet-950/45",
    iconClass: "text-violet-700 dark:text-violet-300",
    badgeClass:
      "border-violet-500/25 bg-violet-50 text-violet-800 dark:bg-violet-950/55 dark:text-violet-300",
  },
  regulation: {
    icon: FileCheck2,
    iconBoxClass: "bg-slate-100 dark:bg-slate-800/70",
    iconClass: "text-slate-700 dark:text-slate-300",
    badgeClass:
      "border-slate-500/25 bg-slate-100 text-slate-800 dark:bg-slate-800/70 dark:text-slate-300",
  },
};

function formatRuleDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesSearch(row: ProjectRule, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const haystack = [
    row.ruleDef,
    row.type,
    RULE_TYPE_LABELS[row.type],
    row.source,
    row.isDynamic ? "dynamic" : "static",
  ]
    .map((part) => foldForSearch(part))
    .join(" ");
  return haystack.includes(q);
}

function rulePreview(ruleDef: string, max = 48): string {
  const t = ruleDef.trim();
  if (t.length <= max) return t || "Rule";
  return `${t.slice(0, max)}…`;
}

function sortRules(rows: ProjectRule[]): ProjectRule[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function RuleListRow({
  row,
  rowBusy,
  onEdit,
  onDelete,
}: {
  row: ProjectRule;
  rowBusy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = RULE_TYPE_META[row.type];
  const Icon = meta.icon;
  const source = row.source.trim();
  const date = formatRuleDate(row.updatedAt || row.createdAt);
  const ruleDef = row.ruleDef.trim();

  return (
    <article className="flex h-full w-full min-w-0 flex-col rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-border hover:bg-card hover:shadow-md">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-border/40",
            meta.iconBoxClass
          )}
          aria-hidden
        >
          <Icon className={cn("size-5", meta.iconClass)} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
                meta.badgeClass
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {RULE_TYPE_LABELS[row.type]}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
                row.isDynamic
                  ? "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                  : "border-border/80 bg-muted/30 text-muted-foreground"
              )}
            >
              <Sparkles
                className={cn("size-3.5", !row.isDynamic && "opacity-60")}
                aria-hidden
              />
              {row.isDynamic ? "Dynamic" : "Static"}
            </span>
          </div>

          <p className="min-w-0 min-h-13 wrap-anywhere text-base leading-relaxed text-foreground">
            {ruleDef || (
              <span className="text-muted-foreground italic">Chưa có mô tả.</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-l border-border/70 pl-3">
          {source ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Scale className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{source}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 italic">
              <Scale className="size-3.5 shrink-0" aria-hidden />
              Chưa có source
            </span>
          )}
          {date ? (
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <History className="size-3.5 shrink-0" aria-hidden />
              {date}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Chỉnh sửa rule"
            disabled={rowBusy}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" aria-hidden />
            Sửa
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Xóa rule"
            disabled={rowBusy}
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Xóa
          </Button>
        </div>
      </div>
    </article>
  );
}

type RuleListProps = {
  projectId: string | null;
  search: string;
  typeFilter: RuleTypeFilter;
  dynamicFilter: RuleDynamicFilter;
  className?: string;
};

export function RuleList({
  projectId,
  search,
  typeFilter,
  dynamicFilter,
  className,
}: RuleListProps) {
  const [editTarget, setEditTarget] = useState<ProjectRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    ruleId: string;
    preview: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);

  const {
    data: rules = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectRules(projectId);

  const deleteMutation = useDeleteProjectRule({
    onSuccess: () => setDeleteTarget(null),
  });

  const sorted = useMemo(() => sortRules(rules), [rules]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return sorted.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (dynamicFilter === "dynamic" && !row.isDynamic) return false;
      if (dynamicFilter === "static" && row.isDynamic) return false;
      if (!q) return true;
      return matchesSearch(row, q);
    });
  }, [sorted, search, typeFilter, dynamicFilter]);

  const rowBusy = rowMutationBusy || deleteMutation.isPending;

  async function confirmDelete() {
    if (!projectId || !deleteTarget) return;
    await deleteMutation.mutateAsync({
      projectId,
      ruleId: deleteTarget.ruleId,
    });
  }

  if (!projectId) {
    return (
      <p className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center text-sm text-muted-foreground">
        Không tìm thấy dự án trong workspace này.
      </p>
    );
  }

  if (isPending) {
    return (
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-30 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center",
          className
        )}
      >
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Không tải được danh sách rules."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void refetch()}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <Scale className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Chưa có rule</p>
          <p className="text-sm text-muted-foreground">
            Dùng nút &quot;Thêm rule&quot; để bắt đầu.
          </p>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <p
        className={cn(
          "rounded-xl border border-border/70 bg-card/40 px-5 py-8 text-center text-sm text-muted-foreground",
          className
        )}
      >
        Không có kết quả cho &quot;{search.trim()}&quot;.
      </p>
    );
  }

  return (
    <>
      <ul
        className={cn(
          "grid list-none grid-cols-1 content-start gap-3 sm:grid-cols-2",
          className
        )}
       
        aria-label="Danh sách rules"
      >
        {filtered.map((row) => (
          <li key={row.id} className="flex min-w-0">
            <RuleListRow
              row={row}
              rowBusy={rowBusy}
              onEdit={() => setEditTarget(row)}
              onDelete={() =>
                setDeleteTarget({
                  ruleId: row.id,
                  preview: rulePreview(row.ruleDef),
                })
              }
            />
          </li>
        ))}
      </ul>

      <RuleFormDialog
        projectId={projectId}
        rule={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <DeleteRuleDialog
        open={deleteTarget != null}
        target={deleteTarget}
        deletePending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
}
