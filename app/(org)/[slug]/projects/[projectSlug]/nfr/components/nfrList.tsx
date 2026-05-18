"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Gauge, Pencil, Trash2 } from "lucide-react";

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
  return `${t.slice(0, max)}…`;
}

function sortNfrs(rows: ProjectNfr[]): ProjectNfr[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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

  return (
    <article className="flex h-full w-full min-w-0 items-start gap-3 rounded-xl border border-border/70 bg-card/50 p-3.5 shadow-sm transition-colors hover:border-border hover:bg-card/80 sm:gap-4 sm:p-4">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11",
          meta.iconBoxClass
        )}
        aria-hidden
      >
        <Icon className={cn("size-5", meta.iconClass)} />
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 gap-y-1">
          <h3 className="text-base font-semibold text-foreground">
            {meta.label}
          </h3>
          <NfrPriorityBadge priority={row.priority} />
        </div>
        <p className="min-w-0 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {row.description.trim() || (
            <span className="italic">Chưa có mô tả.</span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label="Chỉnh sửa NFR"
          title="Chỉnh sửa"
          disabled={rowBusy}
          onClick={onEdit}
        >
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Xóa NFR"
          title="Xóa"
          disabled={rowBusy}
          onClick={onDelete}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
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
        Không tìm thấy dự án trong workspace này.
      </p>
    );
  }

  if (isPending) {
    return (
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[5.5rem] w-full rounded-xl" />
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
            : "Không tải được danh sách NFR."}
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
            {hasServerFilters ? "Không có NFR phù hợp bộ lọc" : "Chưa có NFR"}
          </p>
          <p className="text-sm text-muted-foreground">
            {hasServerFilters
              ? "Thử đổi category hoặc priority, hoặc xóa bộ lọc."
              : 'Dùng nút "Thêm NFR" để bắt đầu.'}
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
        role="list"
        aria-label="Danh sách NFR"
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
