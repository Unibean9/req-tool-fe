"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  Ban,
  CalendarClock,
  Cpu,
  History,
  Pencil,
  Scale,
  ServerCog,
  Trash2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteProjectConstraint,
  useProjectConstraints,
  type ConstraintSeverity,
  type ConstraintType,
  type ProjectConstraint,
} from "@/hooks/useConstraint";
import { cn } from "@/lib/utils";

import { ConstraintFormDialog } from "./constrainFormDialog";
import { DeleteConstraintDialog } from "./deleteConstraintDialog";
import {
  CONSTRAINT_SEVERITY_LABELS,
  CONSTRAINT_TYPE_LABELS,
} from "./constraintFormFields";
import type {
  ConstraintSeverityFilter,
  ConstraintTypeFilter,
} from "./constraintToolbar";

type ConstraintTypeMeta = {
  icon: LucideIcon;
  iconBoxClass: string;
  iconClass: string;
  badgeClass: string;
};

const CONSTRAINT_TYPE_META: Record<ConstraintType, ConstraintTypeMeta> = {
  budget: {
    icon: Banknote,
    iconBoxClass: "bg-emerald-50 dark:bg-emerald-950/45",
    iconClass: "text-emerald-700 dark:text-emerald-300",
    badgeClass:
      "border-emerald-500/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300",
  },
  timeline: {
    icon: CalendarClock,
    iconBoxClass: "bg-sky-50 dark:bg-sky-950/45",
    iconClass: "text-sky-700 dark:text-sky-300",
    badgeClass:
      "border-sky-500/25 bg-sky-50 text-sky-800 dark:bg-sky-950/55 dark:text-sky-300",
  },
  technical: {
    icon: Cpu,
    iconBoxClass: "bg-violet-50 dark:bg-violet-950/45",
    iconClass: "text-violet-700 dark:text-violet-300",
    badgeClass:
      "border-violet-500/25 bg-violet-50 text-violet-800 dark:bg-violet-950/55 dark:text-violet-300",
  },
  resource: {
    icon: UsersRound,
    iconBoxClass: "bg-amber-50 dark:bg-amber-950/45",
    iconClass: "text-amber-700 dark:text-amber-300",
    badgeClass:
      "border-amber-500/25 bg-amber-50 text-amber-800 dark:bg-amber-950/55 dark:text-amber-300",
  },
  regulatory: {
    icon: Scale,
    iconBoxClass: "bg-rose-50 dark:bg-rose-950/45",
    iconClass: "text-rose-700 dark:text-rose-300",
    badgeClass:
      "border-rose-500/25 bg-rose-50 text-rose-800 dark:bg-rose-950/55 dark:text-rose-300",
  },
};

function severityBadgeClassName(severity: ConstraintSeverity): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
    severity === "high" &&
      "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-200",
    severity === "medium" &&
      "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-200",
    severity === "low" &&
      "border-border/80 bg-muted/35 text-muted-foreground"
  );
}

function formatConstraintDate(value: string): string {
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

function matchesSearch(row: ProjectConstraint, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const haystack = [
    row.description,
    row.type,
    CONSTRAINT_TYPE_LABELS[row.type],
    row.severity,
    CONSTRAINT_SEVERITY_LABELS[row.severity],
  ]
    .map((part) => foldForSearch(part))
    .join(" ");
  return haystack.includes(q);
}

function constraintPreview(description: string, max = 56): string {
  const t = description.trim();
  if (t.length <= max) return t || "Constraint";
  return `${t.slice(0, max)}...`;
}

function sortConstraints(rows: ProjectConstraint[]): ProjectConstraint[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );
}

function ConstraintListRow({
  row,
  rowBusy,
  onEdit,
  onDelete,
}: {
  row: ProjectConstraint;
  rowBusy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = CONSTRAINT_TYPE_META[row.type];
  const Icon = meta.icon;
  const description = row.description.trim();
  const date = formatConstraintDate(row.updatedAt || row.createdAt);

  return (
    <article className="group flex h-full w-full min-w-0 flex-col rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-border hover:bg-card hover:shadow-md">
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
              {CONSTRAINT_TYPE_LABELS[row.type]}
            </span>
            <span className={severityBadgeClassName(row.severity)}>
              <ServerCog className="size-3.5" aria-hidden />
              {CONSTRAINT_SEVERITY_LABELS[row.severity]}
            </span>
          </div>

          <p className="min-h-14 min-w-0 break-words text-base leading-relaxed text-foreground [overflow-wrap:anywhere]">
            {description || (
              <span className="text-muted-foreground italic">Chưa có mô tả.</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        {date ? (
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <History className="size-3.5 shrink-0" aria-hidden />
            Cập nhật {date}
          </span>
        ) : (
          <span />
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            aria-label="Chỉnh sửa constraint"
            disabled={rowBusy}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" aria-hidden />
            Sửa
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            aria-label="Xóa constraint"
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

type ConstraintListProps = {
  projectId: string | null;
  search: string;
  typeFilter: ConstraintTypeFilter;
  severityFilter: ConstraintSeverityFilter;
  className?: string;
};

export function ConstraintList({
  projectId,
  search,
  typeFilter,
  severityFilter,
  className,
}: ConstraintListProps) {
  const [editTarget, setEditTarget] = useState<ProjectConstraint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    constraintId: string;
    preview: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);

  const apiParams = useMemo(
    () => ({
      type: typeFilter === "all" ? undefined : typeFilter,
      severity: severityFilter === "all" ? undefined : severityFilter,
    }),
    [typeFilter, severityFilter]
  );

  const {
    data: constraints = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectConstraints(projectId, apiParams);

  const deleteMutation = useDeleteProjectConstraint({
    onSuccess: () => setDeleteTarget(null),
  });

  const sorted = useMemo(() => sortConstraints(constraints), [constraints]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return sorted;
    return sorted.filter((row) => matchesSearch(row, q));
  }, [sorted, search]);

  const rowBusy = rowMutationBusy || deleteMutation.isPending;

  async function confirmDelete() {
    if (!projectId || !deleteTarget) return;
    await deleteMutation.mutateAsync({
      projectId,
      constraintId: deleteTarget.constraintId,
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
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
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
            : "Không tải được danh sách constraints."}
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

  if (constraints.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <Ban className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Chưa có constraint
          </p>
          <p className="text-sm text-muted-foreground">
            Dùng nút &quot;Thêm constraint&quot; để bắt đầu.
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
       
        aria-label="Danh sách constraints"
      >
        {filtered.map((row) => (
          <li key={row.id} className="flex min-w-0">
            <ConstraintListRow
              row={row}
              rowBusy={rowBusy}
              onEdit={() => setEditTarget(row)}
              onDelete={() =>
                setDeleteTarget({
                  constraintId: row.id,
                  preview: constraintPreview(row.description),
                })
              }
            />
          </li>
        ))}
      </ul>

      <ConstraintFormDialog
        key={editTarget?.id ?? "edit-constraint"}
        projectId={projectId}
        constraint={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <DeleteConstraintDialog
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
