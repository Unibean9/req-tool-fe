"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteProjectFlow,
  useProjectFlows,
  type ProjectFlow,
} from "@/hooks/useFlow";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { fetchFlow } from "@/lib/api/services/fetchFlow";
import {
  projectFlowsQueryKey,
  projectSetupProgressQueryKey,
} from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";

import { DeleteFlowDialog } from "./deleteFlowDialog";
import { FlowFormDialog } from "./flowFormDialog";
import { FlowStepsPreview } from "./flowFormFields";
import {
  canMoveFlowDown,
  canMoveFlowUp,
  planMoveFlowDown,
  planMoveFlowToTop,
  sortFlows,
  type FlowOrderPatch,
} from "./flowReorder";
import { parseFlowSteps } from "./flowSteps";

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesSearch(row: ProjectFlow, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const stepParts = parseFlowSteps(row.description).filter(Boolean);
  const haystack = [row.title, String(row.order), row.description, ...stepParts]
    .map((part) => foldForSearch(part))
    .join(" ");
  return haystack.includes(q);
}

function FlowIndexBadge({ index }: { index: number }) {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 text-xs font-semibold tabular-nums text-foreground sm:size-8"
      aria-hidden
    >
      {index}
    </span>
  );
}

function FlowListRow({
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
  row: ProjectFlow;
  displayIndex: number;
  rowBusy: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex h-full w-full items-start gap-3 rounded-xl border border-border/70 bg-card/50 p-3.5 shadow-sm transition-colors hover:border-border hover:bg-card/80 sm:gap-4 sm:p-4">
      <FlowIndexBadge index={displayIndex} />

      <div className="min-w-0 flex-1 space-y-1.5">
        <h2 className="text-base font-semibold leading-snug text-foreground">
          {row.title}
        </h2>
        {row.description.trim() ? (
          <FlowStepsPreview description={row.description} compact />
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có bước nào.</p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label={`Đưa ${row.title} lên đầu`}
          title="Lên đầu"
          disabled={rowBusy || !canMoveUp}
          onClick={onMoveUp}
        >
          <ArrowUp className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label={`Đưa ${row.title} xuống một bậc`}
          title="Xuống một bậc"
          disabled={rowBusy || !canMoveDown}
          onClick={onMoveDown}
        >
          <ArrowDown className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label={`Chỉnh sửa ${row.title}`}
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
          aria-label={`Xóa ${row.title}`}
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

type FlowListProps = {
  projectId: string | null;
  search: string;
  className?: string;
};

export function FlowList({ projectId, search, className }: FlowListProps) {
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<ProjectFlow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    flowId: string;
    title: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);
  const [reorderingFlowId, setReorderingFlowId] = useState<string | null>(null);

  const {
    data: flows = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectFlows(projectId);

  const deleteMutation = useDeleteProjectFlow({
    onSuccess: () => setDeleteTarget(null),
  });

  const allSorted = useMemo(() => sortFlows(flows), [flows]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return allSorted;
    return allSorted.filter((row) => matchesSearch(row, q));
  }, [allSorted, search]);

  const rowBusy =
    rowMutationBusy || deleteMutation.isPending || reorderingFlowId != null;

  async function applyOrderPatches(patches: FlowOrderPatch[]) {
    if (!projectId) return;
    const pid = projectId.trim();
    for (const { flow, order } of patches) {
      await fetchFlow.update(pid, flow.id, {
        title: flow.title,
        description: flow.description,
        order,
      });
    }
    void queryClient.invalidateQueries({ queryKey: projectFlowsQueryKey(pid) });
    void queryClient.invalidateQueries({
      queryKey: projectSetupProgressQueryKey(pid),
    });
  }

  async function handleMoveUp(row: ProjectFlow) {
    if (!projectId || rowBusy) return;
    const patches = planMoveFlowToTop(allSorted, row);
    if (!patches?.length) return;

    setReorderingFlowId(row.id);
    try {
      await applyOrderPatches(patches);
      toast.success("Đã cập nhật thứ tự flow");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể đổi thứ tự flow"));
    } finally {
      setReorderingFlowId(null);
    }
  }

  async function handleMoveDown(row: ProjectFlow) {
    if (!projectId || rowBusy) return;
    const patches = planMoveFlowDown(allSorted, row);
    if (!patches?.length) return;

    setReorderingFlowId(row.id);
    try {
      await applyOrderPatches(patches);
      toast.success("Đã cập nhật thứ tự flow");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể đổi thứ tự flow"));
    } finally {
      setReorderingFlowId(null);
    }
  }

  async function confirmDelete() {
    if (!projectId || !deleteTarget) return;
    await deleteMutation.mutateAsync({
      projectId,
      flowId: deleteTarget.flowId,
    });
  }

  if (!projectId) {
    return (
      <p className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center text-sm text-muted-foreground">
        Không tìm thấy project trong workspace này.
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
            : "Không tải được danh sách flow."}
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

  if (flows.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <Workflow className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Chưa có flow nào</p>
          <p className="text-sm text-muted-foreground">
            Dùng &quot;Thêm flow&quot; để định nghĩa quy trình đầu tiên.
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
        aria-label="Danh sách flow"
      >
        {filtered.map((row) => {
          const displayIndex =
            allSorted.findIndex((f) => f.id === row.id) + 1;
          return (
            <li key={row.id} className="flex min-w-0">
              <FlowListRow
                row={row}
                displayIndex={displayIndex > 0 ? displayIndex : 1}
                rowBusy={rowBusy}
                canMoveUp={canMoveFlowUp(allSorted, row)}
                canMoveDown={canMoveFlowDown(allSorted, row)}
                onMoveUp={() => void handleMoveUp(row)}
                onMoveDown={() => void handleMoveDown(row)}
                onEdit={() => setEditTarget(row)}
                onDelete={() =>
                  setDeleteTarget({ flowId: row.id, title: row.title })
                }
              />
            </li>
          );
        })}
      </ul>

      <FlowFormDialog
        projectId={projectId}
        flow={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <DeleteFlowDialog
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
