"use client";

import { useMemo, useState } from "react";
import {
  CircleSlash,
  Cpu,
  History,
  Pencil,
  Plug,
  Star,
  Trash2,
  UsersRound,
  Workflow,
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
  useDeleteProjectOutOfScope,
  useProjectOutOfScope,
  type OutOfScopeCategory,
  type OutOfScopeItem,
} from "@/hooks/useOutOfScope";
import { cn } from "@/lib/utils";

import { DeleteOutOfScopeDialog } from "./deleteOutOfScopeDialog";
import { OUT_OF_SCOPE_CATEGORY_LABELS } from "./outOfScopeFormFields";
import { OutOfScopeFormDialog } from "./outOfScopeFormDialog";
import type { OutOfScopeCategoryFilter } from "./outOfScopeToolbar";

type CategoryMeta = {
  icon: LucideIcon;
  badgeClass: string;
};

const CATEGORY_META: Record<OutOfScopeCategory, CategoryMeta> = {
  feature: {
    icon: Star,
    badgeClass:
      "border-violet-500/25 bg-violet-50 text-violet-800 dark:bg-violet-950/55 dark:text-violet-300",
  },
  integration: {
    icon: Plug,
    badgeClass:
      "border-sky-500/25 bg-sky-50 text-sky-800 dark:bg-sky-950/55 dark:text-sky-300",
  },
  user_group: {
    icon: UsersRound,
    badgeClass:
      "border-amber-500/25 bg-amber-50 text-amber-800 dark:bg-amber-950/55 dark:text-amber-300",
  },
  process: {
    icon: Workflow,
    badgeClass:
      "border-emerald-500/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300",
  },
  technical: {
    icon: Cpu,
    badgeClass:
      "border-slate-500/25 bg-slate-50 text-slate-800 dark:bg-slate-950/55 dark:text-slate-300",
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

function matchesSearch(row: OutOfScopeItem, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const haystack = [
    row.description,
    row.category,
    OUT_OF_SCOPE_CATEGORY_LABELS[row.category],
  ]
    .map(foldForSearch)
    .join(" ");
  return haystack.includes(q);
}

function itemPreview(description: string, max = 56): string {
  const t = description.trim();
  if (t.length <= max) return t || "Out-of-scope";
  return `${t.slice(0, max)}...`;
}

function sortItems(rows: OutOfScopeItem[]): OutOfScopeItem[] {
  return [...rows].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return (
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
    );
  });
}

type OutOfScopeTableProps = {
  projectId: string | null;
  search: string;
  categoryFilter: OutOfScopeCategoryFilter;
  className?: string;
};

export function OutOfScopeTable({
  projectId,
  search,
  categoryFilter,
  className,
}: OutOfScopeTableProps) {
  const [editTarget, setEditTarget] = useState<OutOfScopeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    itemId: string;
    preview: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);

  const apiParams = useMemo(
    () => ({
      category: categoryFilter === "all" ? undefined : categoryFilter,
    }),
    [categoryFilter]
  );

  const {
    data: items = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectOutOfScope(projectId, apiParams);

  const deleteMutation = useDeleteProjectOutOfScope({
    onSuccess: () => setDeleteTarget(null),
  });

  const sorted = useMemo(() => sortItems(items), [items]);

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
      itemId: deleteTarget.itemId,
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
          className
        )}
      >
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Không tải được danh sách out-of-scope."}
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

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <CircleSlash className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Chưa có mục out-of-scope
          </p>
          <p className="text-sm text-muted-foreground">
            Dùng nút &quot;Thêm out of scope&quot; để bắt đầu.
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
              <TableHead className="w-44">Danh mục</TableHead>
              <TableHead className="min-w-60">Mô tả</TableHead>
              <TableHead className="w-36">Cập nhật</TableHead>
              <TableHead className="w-24 pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, index) => {
              const meta = CATEGORY_META[row.category];
              const Icon = meta.icon;
              const date = formatDate(row.updatedAt || row.createdAt);

              return (
                <TableRow
                  key={row.id}
                  className="border-border/60 align-top"
                >
                  <TableCell className="pl-4 text-center text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
                        meta.badgeClass
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {OUT_OF_SCOPE_CATEGORY_LABELS[row.category]}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-normal py-3 wrap-anywhere">
                    <p className="text-sm leading-relaxed text-foreground">
                      {row.description.trim() || (
                        <span className="italic text-muted-foreground">
                          Chưa có mô tả.
                        </span>
                      )}
                    </p>
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
                            itemId: row.id,
                            preview: itemPreview(row.description),
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

      <OutOfScopeFormDialog
        key={editTarget?.id ?? "edit-out-of-scope"}
        projectId={projectId}
        item={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <DeleteOutOfScopeDialog
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
