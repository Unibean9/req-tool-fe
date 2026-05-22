"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Calculator,
  ClipboardCheck,
  FileCheck2,
  GitBranch,
  History,
  Pencil,
  Scale,
  ShieldCheck,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  badgeClass: string;
};

const RULE_TYPE_META: Record<ProjectRuleType, RuleTypeMeta> = {
  constraint: {
    icon: Ban,
    badgeClass:
      "border-rose-500/25 bg-rose-50 text-rose-800 dark:bg-rose-950/55 dark:text-rose-300",
  },
  calculation: {
    icon: Calculator,
    badgeClass:
      "border-amber-500/25 bg-amber-50 text-amber-800 dark:bg-amber-950/55 dark:text-amber-300",
  },
  validation: {
    icon: ClipboardCheck,
    badgeClass:
      "border-emerald-500/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300",
  },
  process: {
    icon: GitBranch,
    badgeClass:
      "border-sky-500/25 bg-sky-50 text-sky-800 dark:bg-sky-950/55 dark:text-sky-300",
  },
  policy: {
    icon: ShieldCheck,
    badgeClass:
      "border-violet-500/25 bg-violet-50 text-violet-800 dark:bg-violet-950/55 dark:text-violet-300",
  },
  regulation: {
    icon: FileCheck2,
    badgeClass:
      "border-slate-500/25 bg-slate-100 text-slate-800 dark:bg-slate-800/70 dark:text-slate-300",
  },
};

function formatDate(value: string): string {
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
    .map(foldForSearch)
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
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

type RuleTableProps = {
  projectId: string | null;
  search: string;
  typeFilter: RuleTypeFilter;
  dynamicFilter: RuleDynamicFilter;
  className?: string;
};

export function RuleTable({
  projectId,
  search,
  typeFilter,
  dynamicFilter,
  className,
}: RuleTableProps) {
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
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center",
          className,
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
          className,
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
          className,
        )}
      >
        Không có kết quả phù hợp với bộ lọc hiện tại.
      </p>
    );
  }

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
          className,
        )}
      >
        <div className="overflow-auto max-h-[calc(100svh-10rem)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/70 bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12 pl-4 text-center">#</TableHead>
              <TableHead className="min-w-60">Định nghĩa</TableHead>
              <TableHead className="w-40">Nguồn</TableHead>
              <TableHead className="w-40">Loại</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-36">Cập nhật</TableHead>
              <TableHead className="w-24 pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, index) => {
              const meta = RULE_TYPE_META[row.type];
              const Icon = meta.icon;
              const date = formatDate(row.updatedAt || row.createdAt);
              const source = row.source.trim();

              return (
                <TableRow key={row.id} className="border-border/60 align-top">
                  <TableCell className="pl-4 text-center text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>

                  <TableCell className="whitespace-normal py-3 wrap-anywhere">
                    <p className="text-sm leading-relaxed text-foreground">
                      {row.ruleDef.trim() || (
                        <span className="italic text-muted-foreground">
                          Chưa có mô tả.
                        </span>
                      )}
                    </p>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground wrap-anywhere whitespace-normal">
                    {source || <span className="italic">Chưa có nguồn</span>}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
                        meta.badgeClass,
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {RULE_TYPE_LABELS[row.type]}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
                        row.isDynamic
                          ? "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                          : "border-border/80 bg-muted/30 text-muted-foreground",
                      )}
                    >
                      <Sparkles
                        className={cn(
                          "size-3.5",
                          !row.isDynamic && "opacity-60",
                        )}
                        aria-hidden
                      />
                      {row.isDynamic ? "Dynamic" : "Static"}
                    </span>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {date && (
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <History className="size-3.5 shrink-0" aria-hidden />
                        {date}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="pr-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        aria-label="Chỉnh sửa"
                        disabled={rowBusy}
                        onClick={() => setEditTarget(row)}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Xóa"
                        disabled={rowBusy}
                        onClick={() =>
                          setDeleteTarget({
                            ruleId: row.id,
                            preview: rulePreview(row.ruleDef),
                          })
                        }
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

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
