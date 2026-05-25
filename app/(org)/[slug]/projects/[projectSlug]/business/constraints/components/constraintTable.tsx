"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Banknote,
  CalendarClock,
  Cpu,
  History,
  Pencil,
  Scale,
  Trash2,
  UsersRound,
  AlertCircle,
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
  badgeClass: string;
};

const CONSTRAINT_TYPE_META: Record<ConstraintType, ConstraintTypeMeta> = {
  budget: {
    icon: Banknote,
    badgeClass:
      "border-emerald-500/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300",
  },
  timeline: {
    icon: CalendarClock,
    badgeClass:
      "border-sky-500/25 bg-sky-50 text-sky-800 dark:bg-sky-950/55 dark:text-sky-300",
  },
  technical: {
    icon: Cpu,
    badgeClass:
      "border-violet-500/25 bg-violet-50 text-violet-800 dark:bg-violet-950/55 dark:text-violet-300",
  },
  resource: {
    icon: UsersRound,
    badgeClass:
      "border-amber-500/25 bg-amber-50 text-amber-800 dark:bg-amber-950/55 dark:text-amber-300",
  },
  regulatory: {
    icon: Scale,
    badgeClass:
      "border-rose-500/25 bg-rose-50 text-rose-800 dark:bg-rose-950/55 dark:text-rose-300",
  },
  risk: {
    icon: AlertCircle,
    badgeClass:
      "border-slate-500/25 bg-slate-100 text-slate-800 dark:bg-slate-800/70 dark:text-slate-300",
  },
};

function severityBadgeClassName(severity: ConstraintSeverity): string {
  return cn(
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
    severity === "high" &&
      "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-200",
    severity === "medium" &&
      "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-200",
    severity === "low" && "border-border/80 bg-muted/35 text-muted-foreground"
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
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
    .map(foldForSearch)
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

type ConstraintTableProps = {
  projectId: string | null;
  search: string;
  typeFilter: ConstraintTypeFilter;
  severityFilter: ConstraintSeverityFilter;
  className?: string;
};

export function ConstraintTable({
  projectId,
  search,
  typeFilter,
  severityFilter,
  className,
}: ConstraintTableProps) {
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
        No project found in this workspace.
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
          className
        )}
      >
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load constraints."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void refetch()}
        >
          Retry
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
            No constraints yet
          </p>
          <p className="text-sm text-muted-foreground">
            Use the &quot;Add constraint&quot; button to get started.
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
        No results match the current filters.
      </p>
    );
  }

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
          className
        )}
      >
        <div className="overflow-auto max-h-[calc(100svh-10rem)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/70 bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12 pl-4 text-center">#</TableHead>
              <TableHead className="min-w-60">Description</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead className="w-32">Severity</TableHead>
              <TableHead className="w-36">Updated</TableHead>
              <TableHead className="w-24 pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, index) => {
              const meta = CONSTRAINT_TYPE_META[row.type];
              const Icon = meta.icon;
              const date = formatDate(row.updatedAt || row.createdAt);

              return (
                <TableRow key={row.id} className="border-border/60 align-top">
                  <TableCell className="pl-4 text-center text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>

                  <TableCell className="whitespace-normal py-3 wrap-anywhere">
                    <p className="text-sm leading-relaxed text-foreground">
                      {row.description.trim() || (
                        <span className="italic text-muted-foreground">
                          No description.
                        </span>
                      )}
                    </p>
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
                        meta.badgeClass
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {CONSTRAINT_TYPE_LABELS[row.type]}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className={severityBadgeClassName(row.severity)}>
                      {CONSTRAINT_SEVERITY_LABELS[row.severity]}
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
                        aria-label="Edit"
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
                        aria-label="Delete"
                        disabled={rowBusy}
                        onClick={() =>
                          setDeleteTarget({
                            constraintId: row.id,
                            preview: constraintPreview(row.description),
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
