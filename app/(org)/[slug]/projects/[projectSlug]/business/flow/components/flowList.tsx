"use client";

import { useMemo, useState } from "react";
import { ListOrdered, MoreHorizontal, Pencil, Trash2, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteProjectFlow,
  useProjectFlows,
  type ProjectFlow,
} from "@/hooks/useFlow";
import { cn } from "@/lib/utils";

import { DeleteFlowDialog } from "./deleteFlowDialog";
import {
  EditFlowActionFormDialog,
  type FlowActionsDialogVariant,
} from "./editFlowActionFormDialog";
import { EditFlowFormDialog } from "./editFlowFormDialog";
import { FlowSwimlaneDetailDialog } from "./flowSwimlaneDialog";
import { hasFlowCatalogActions } from "./flowCatalogActions";
import { FlowStepsPreview } from "./flowFormFields";
import { sortFlows } from "./flowReorder";
import { parseFlowSteps } from "./flowSteps";

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesSearch(row: ProjectFlow, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const stepParts = parseFlowSteps(row.description).filter(Boolean);
  const haystack = [
    row.code,
    row.name,
    row.title,
    String(row.order),
    row.description,
    ...stepParts,
  ]
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
  hasCatalogActions,
  onEdit,
  onEditActions,
  onOpenSwimlane,
  onDelete,
}: {
  row: ProjectFlow;
  displayIndex: number;
  rowBusy: boolean;
  hasCatalogActions: boolean;
  onEdit: () => void;
  onEditActions: () => void;
  onOpenSwimlane: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex h-full w-full items-start gap-3 rounded-xl border border-border/70 bg-card/50 p-3.5 shadow-sm transition-colors hover:border-border hover:bg-card/80 sm:gap-4 sm:p-4">
      <FlowIndexBadge index={displayIndex} />

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h2 className="text-base font-semibold leading-snug text-foreground">
            {row.name}
          </h2>
          {row.code.trim() ? (
            <span className="font-mono text-xs text-muted-foreground">
              {row.code}
            </span>
          ) : null}
        </div>
        {row.description.trim() ? (
          <FlowStepsPreview description={row.description} compact />
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có bước nào.</p>
        )}
        {hasCatalogActions ? (
          <Button
            type="button"
            variant="link"
            className="h-auto min-h-0 p-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
            disabled={rowBusy}
            onClick={onOpenSwimlane}
          >
            Xem chi tiết swimlane
          </Button>
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              aria-label={`Thao tác flow ${row.name}`}
              disabled={rowBusy}
            />
          }
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4} className="min-w-44">
          <DropdownMenuItem
            className="gap-2"
            disabled={rowBusy}
            onClick={onEdit}
          >
            <Pencil className="size-4 text-muted-foreground" aria-hidden />
            Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            disabled={rowBusy}
            onClick={onEditActions}
          >
            <ListOrdered className="size-4 text-muted-foreground" aria-hidden />
            {hasCatalogActions ? "Cập nhật actions" : "Thêm actions"}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="gap-2"
            disabled={rowBusy}
            onClick={onDelete}
          >
            <Trash2 className="size-4" aria-hidden />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}

type FlowListProps = {
  projectId: string | null;
  search: string;
  className?: string;
};

export function FlowList({ projectId, search, className }: FlowListProps) {
  const [editFlowTarget, setEditFlowTarget] = useState<ProjectFlow | null>(null);
  const [swimlaneDetailFlow, setSwimlaneDetailFlow] = useState<ProjectFlow | null>(
    null
  );
  const [flowActionsDialog, setFlowActionsDialog] = useState<{
    flow: ProjectFlow;
    variant: FlowActionsDialogVariant;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    flowId: string;
    flowName: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);

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

  const rowBusy = rowMutationBusy || deleteMutation.isPending;

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
          const displayIndex = allSorted.findIndex((f) => f.id === row.id) + 1;
          const hasCatalogActions = hasFlowCatalogActions(row.actions);
          return (
            <li key={row.id} className="flex min-w-0">
              <FlowListRow
                row={row}
                displayIndex={displayIndex > 0 ? displayIndex : 1}
                rowBusy={rowBusy}
                hasCatalogActions={hasCatalogActions}
                onEdit={() => setEditFlowTarget(row)}
                onEditActions={() =>
                  setFlowActionsDialog({
                    flow: row,
                    variant: hasCatalogActions ? "patch" : "post",
                  })
                }
                onOpenSwimlane={() => setSwimlaneDetailFlow(row)}
                onDelete={() =>
                  setDeleteTarget({ flowId: row.id, flowName: row.name })
                }
              />
            </li>
          );
        })}
      </ul>

      <EditFlowFormDialog
        projectId={projectId}
        flow={editFlowTarget}
        open={editFlowTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditFlowTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <EditFlowActionFormDialog
        projectId={projectId}
        flow={flowActionsDialog?.flow ?? null}
        variant={flowActionsDialog?.variant ?? "patch"}
        open={flowActionsDialog != null}
        onOpenChange={(open) => {
          if (!open) setFlowActionsDialog(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <FlowSwimlaneDetailDialog
        projectId={projectId}
        flow={swimlaneDetailFlow}
        open={swimlaneDetailFlow != null}
        onOpenChange={(open) => {
          if (!open) setSwimlaneDetailFlow(null);
        }}
        onBusy={setRowMutationBusy}
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
