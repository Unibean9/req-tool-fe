"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteProjectGoal,
  useProjectGoals,
  type ProjectGoal,
} from "@/hooks/useGoals";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { fetchGoal } from "@/lib/api/services/fetchGoal";
import {
  projectGoalsQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";

import { DeleteGoalDialog } from "./deleteGoalDialog";
import { GoalFormDialog } from "./goalFormDialog";
import {
  canMoveGoalDown,
  canMoveGoalUp,
  planMoveGoalDown,
  planMoveGoalToTop,
  sortGoals,
  type GoalOrderPatch,
} from "./goalReorder";

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesSearch(row: ProjectGoal, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const haystack = [row.description, String(row.order)]
    .map((part) => foldForSearch(part))
    .join(" ");
  return haystack.includes(q);
}

function goalPreview(description: string, max = 48): string {
  const t = description.trim();
  if (t.length <= max) return t || "Goal";
  return `${t.slice(0, max)}…`;
}

function GoalIndexBadge({ index }: { index: number }) {
  return (
    <span
      className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-sm font-bold tabular-nums text-primary shadow-sm shadow-primary/5"
      aria-hidden
    >
      {String(index).padStart(2, "0")}
    </span>
  );
}

function GoalListRow({
  row,
  displayIndex,
  rowBusy,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  row: ProjectGoal;
  displayIndex: number;
  rowBusy: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const description = row.description.trim();

  return (
    <article className="flex h-full w-full min-w-0 flex-col rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-border hover:bg-card hover:shadow-md">
      <div className="flex min-w-0 items-start gap-3 pb-4">
        <GoalIndexBadge index={displayIndex} />

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/35 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              <Target className="size-3.5" aria-hidden />
              Goal #{displayIndex}
            </span>
          </div>

          <p className="min-w-0 break-words text-base leading-relaxed text-foreground [overflow-wrap:anywhere]">
            {description || (
              <span className="text-muted-foreground italic">Chưa có mô tả.</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            aria-label="Đưa goal lên đầu"
            disabled={rowBusy || !canMoveUp}
            onClick={onMoveUp}
          >
            <ArrowUp className="size-3.5" aria-hidden />
            Lên đầu
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            aria-label="Đưa goal xuống một bậc"
            disabled={rowBusy || !canMoveDown}
            onClick={onMoveDown}
          >
            <ArrowDown className="size-3.5" aria-hidden />
            Xuống
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            aria-label="Chỉnh sửa goal"
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
            aria-label="Xóa goal"
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

type GoalListProps = {
  projectId: string | null;
  search: string;
  className?: string;
};

export function GoalList({ projectId, search, className }: GoalListProps) {
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<ProjectGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    goalId: string;
    preview: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);
  const [reorderingGoalId, setReorderingGoalId] = useState<string | null>(null);

  const {
    data: goals = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectGoals(projectId);

  const deleteMutation = useDeleteProjectGoal({
    onSuccess: () => setDeleteTarget(null),
  });

  const allSorted = useMemo(() => sortGoals(goals), [goals]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return allSorted;
    return allSorted.filter((row) => matchesSearch(row, q));
  }, [allSorted, search]);

  const rowBusy =
    rowMutationBusy ||
    deleteMutation.isPending ||
    reorderingGoalId != null;

  async function applyOrderPatches(patches: GoalOrderPatch[]) {
    if (!projectId) return;
    const pid = projectId.trim();
    for (const { goal, order } of patches) {
      await fetchGoal.update(pid, goal.id, {
        description: goal.description,
        order,
      });
    }
    void queryClient.invalidateQueries({ queryKey: projectGoalsQueryKey(pid) });
    void queryClient.invalidateQueries({
      queryKey: projectSetupProgressQueryKey(pid),
    });
  }

  async function handleMoveUp(row: ProjectGoal) {
    if (!projectId || rowBusy) return;
    const patches = planMoveGoalToTop(allSorted, row);
    if (!patches?.length) return;

    setReorderingGoalId(row.id);
    try {
      await applyOrderPatches(patches);
      toast.success("Đã cập nhật thứ tự goal");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể đổi thứ tự goal"));
    } finally {
      setReorderingGoalId(null);
    }
  }

  async function handleMoveDown(row: ProjectGoal) {
    if (!projectId || rowBusy) return;
    const patches = planMoveGoalDown(allSorted, row);
    if (!patches?.length) return;

    setReorderingGoalId(row.id);
    try {
      await applyOrderPatches(patches);
      toast.success("Đã cập nhật thứ tự goal");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể đổi thứ tự goal"));
    } finally {
      setReorderingGoalId(null);
    }
  }

  async function confirmDelete() {
    if (!projectId || !deleteTarget) return;
    await deleteMutation.mutateAsync({
      projectId,
      goalId: deleteTarget.goalId,
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
          <Skeleton key={i} className="h-[7.5rem] w-full rounded-xl" />
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
            : "Không tải được danh sách goals."}
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

  if (goals.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <Target className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Chưa có goal</p>
          <p className="text-sm text-muted-foreground">
            Dùng nút &quot;Thêm goal&quot; để bắt đầu.
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
        aria-label="Danh sách goals"
      >
        {filtered.map((row) => {
          const displayIndex = allSorted.findIndex((g) => g.id === row.id) + 1;
          return (
            <li key={row.id} className="flex min-w-0">
              <GoalListRow
                row={row}
                displayIndex={displayIndex > 0 ? displayIndex : 1}
                rowBusy={rowBusy}
                canMoveUp={canMoveGoalUp(allSorted, row)}
                canMoveDown={canMoveGoalDown(allSorted, row)}
                onMoveUp={() => void handleMoveUp(row)}
                onMoveDown={() => void handleMoveDown(row)}
                onEdit={() => setEditTarget(row)}
                onDelete={() =>
                  setDeleteTarget({
                    goalId: row.id,
                    preview: goalPreview(row.description),
                  })
                }
              />
            </li>
          );
        })}
      </ul>

      <GoalFormDialog
        projectId={projectId}
        goal={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <DeleteGoalDialog
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
