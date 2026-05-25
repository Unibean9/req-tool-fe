"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ClipboardList, History, Pencil, Trash2 } from "lucide-react";

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
  useDeleteProjectBR,
  useProjectBR,
  type BRPriority,
  type BusinessRequirement,
} from "@/hooks/useBR";
import { cn } from "@/lib/utils";

import { BRFormDialog } from "./brFormDialog";
import { DeleteBRDialog } from "./deleteBRDialog";
import { BR_PRIORITY_LABELS, type BRPriorityFilter } from "./brToolbar";

function priorityBadgeClassName(priority: BRPriority): string {
  return cn(
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
    priority === "high" &&
      "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-200",
    priority === "medium" &&
      "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-200",
    priority === "low" && "border-border/80 bg-muted/35 text-muted-foreground"
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

function matchesSearch(row: BusinessRequirement, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const haystack = [row.description, BR_PRIORITY_LABELS[row.priority]]
    .map(foldForSearch)
    .join(" ");
  return haystack.includes(q);
}

function brPreview(description: string, max = 56): string {
  const t = description.trim();
  if (t.length <= max) return t || "Business requirement";
  return `${t.slice(0, max)}...`;
}

type BRTableProps = {
  projectId: string | null;
  search: string;
  priorityFilter: BRPriorityFilter;
  className?: string;
};

export function BRTable({
  projectId,
  search,
  priorityFilter,
  className,
}: BRTableProps) {
  const [editTarget, setEditTarget] = useState<BusinessRequirement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    brId: string;
    preview: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);

  const {
    data: items = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectBR(projectId);

  const deleteMutation = useDeleteProjectBR({
    onSuccess: () => setDeleteTarget(null),
  });

  const filtered = useMemo(() => {
    let rows = [...items];

    if (priorityFilter !== "all") {
      rows = rows.filter((r) => r.priority === priorityFilter);
    }

    const q = search.trim();
    if (q) {
      rows = rows.filter((r) => matchesSearch(r, q));
    }

    return rows;
  }, [items, priorityFilter, search]);

  const rowBusy = rowMutationBusy || deleteMutation.isPending;

  async function confirmDelete() {
    if (!projectId || !deleteTarget) return;
    await deleteMutation.mutateAsync({
      projectId,
      brId: deleteTarget.brId,
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
            : "Failed to load business requirements."}
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

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <ClipboardList className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            No business requirements
          </p>
          <p className="text-sm text-muted-foreground">
            Use the &quot;Add BR&quot; button to get started.
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
        No results for the current filter.
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
              <TableHead className="w-32">Priority</TableHead>
              <TableHead className="w-28">Critical</TableHead>
              <TableHead className="w-36">Updated</TableHead>
              <TableHead className="w-24 pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item, index) => {
              const date = formatDate(item.updatedAt || item.createdAt);
              return (
                <TableRow key={item.id} className="border-border/60 align-top">
                  <TableCell className="pl-4 text-center text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>

                  <TableCell className="whitespace-normal py-3 wrap-anywhere">
                    <p className="text-sm leading-relaxed text-foreground">
                      {item.description || (
                        <span className="italic text-muted-foreground">
                          No description.
                        </span>
                      )}
                    </p>
                  </TableCell>

                  <TableCell>
                    <span className={priorityBadgeClassName(item.priority)}>
                      {BR_PRIORITY_LABELS[item.priority]}
                    </span>
                  </TableCell>

                  <TableCell>
                    {item.isCritical && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/35 bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold leading-none text-rose-700 dark:text-rose-200">
                        <AlertCircle className="size-3" aria-hidden />
                        Critical
                      </span>
                    )}
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
                        onClick={() => setEditTarget(item)}
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
                            brId: item.id,
                            preview: brPreview(item.description),
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

      <BRFormDialog
        key={editTarget?.id ?? "edit-br"}
        projectId={projectId}
        item={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <DeleteBRDialog
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
