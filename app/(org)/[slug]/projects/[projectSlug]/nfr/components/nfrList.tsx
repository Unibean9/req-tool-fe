"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Gauge, History, Link2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteProjectNfr,
  useProjectNfrs,
  type ProjectNfr,
} from "@/hooks/useNfr";
import type { ListProjectNfrsParams } from "@/lib/api/services/fetchNfr";
import { cn } from "@/lib/utils";

import { DeleteNfrDialog } from "./deleteNfrDialog";
import {
  NFR_CATEGORY_META,
  NfrPriorityBadge,
  nfrCategoryLabel,
} from "./nfrCategoryMeta";
import { NfrFormDialog } from "./nfrFormDialog";

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesSearch(row: ProjectNfr, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const haystack = [
    row.description,
    nfrCategoryLabel(row.category),
    row.category,
    row.priority,
  ]
    .map((part) => foldForSearch(part))
    .join(" ");
  return haystack.includes(q);
}

function nfrPreview(description: string, max = 48): string {
  const t = description.trim();
  if (t.length <= max) return t || "NFR";
  return `${t.slice(0, max)}...`;
}

function sortNfrs(rows: ProjectNfr[]): ProjectNfr[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function formatNfrDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function NfrListRow({
  row,
  rowBusy,
  onEdit,
  onDelete,
}: {
  row: ProjectNfr;
  rowBusy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = NFR_CATEGORY_META[row.category];
  const Icon = meta.icon;
  const description = row.description.trim();
  const date = formatNfrDate(row.updatedAt || row.createdAt);
  const featureCount = row.featureIds.length;

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
              {meta.label}
            </span>
            <NfrPriorityBadge priority={row.priority} />
          </div>

          <p className="min-h-14 min-w-0 break-words text-base leading-relaxed text-foreground [overflow-wrap:anywhere]">
            {description || (
              <span className="text-muted-foreground italic">No description.</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="size-3.5 shrink-0" aria-hidden />
            {featureCount > 0
              ? `${featureCount} linked feature(s)`
              : "No linked features"}
          </span>
          {date ? (
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <History className="size-3.5 shrink-0" aria-hidden />
              Updated {date}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            aria-label="Edit NFR"
            disabled={rowBusy}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete NFR"
            disabled={rowBusy}
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

type NfrListProps = {
  projectId: string | null;
  search: string;
  listParams?: ListProjectNfrsParams;
  className?: string;
};

export function NfrList({
  projectId,
  search,
  listParams,
  className,
}: NfrListProps) {
  const [editTarget, setEditTarget] = useState<ProjectNfr | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    nfrId: string;
    preview: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);

  const {
    data: nfrs = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectNfrs(projectId, listParams);

  const deleteMutation = useDeleteProjectNfr({
    onSuccess: () => setDeleteTarget(null),
  });

  const deferredSearch = useDeferredValue(search);

  const sorted = useMemo(() => sortNfrs(nfrs), [nfrs]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim();
    if (!q) return sorted;
    return sorted.filter((row) => matchesSearch(row, q));
  }, [sorted, deferredSearch]);

  const rowBusy = rowMutationBusy || deleteMutation.isPending;

  async function confirmDelete() {
    if (!projectId || !deleteTarget) return;
    await deleteMutation.mutateAsync({
      projectId,
      nfrId: deleteTarget.nfrId,
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
            : "Failed to load the NFRs."}
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

  const hasServerFilters = Boolean(
    listParams?.category ?? listParams?.priority
  );

  if (nfrs.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <Gauge className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {hasServerFilters ? "No NFRs match the current filters" : "No NFRs yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {hasServerFilters
              ? "Try changing the category or priority, or clear the filters."
              : 'Use the "Add NFR" button to get started.'}
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
        No results for &quot;{search.trim()}&quot;.
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
       
        aria-label="NFR list"
      >
        {filtered.map((row) => (
          <li key={row.id} className="flex min-w-0">
            <NfrListRow
              row={row}
              rowBusy={rowBusy}
              onEdit={() => setEditTarget(row)}
              onDelete={() =>
                setDeleteTarget({
                  nfrId: row.id,
                  preview: nfrPreview(row.description),
                })
              }
            />
          </li>
        ))}
      </ul>

      <NfrFormDialog
        projectId={projectId}
        nfr={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <DeleteNfrDialog
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
