"use client";

import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ListOrdered,
  MoreHorizontal,
  Pencil,
  Route,
  Trash2,
  Workflow,
} from "lucide-react";

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
import {
  hasFlowCatalogActions,
  parseFlowCatalogActions,
} from "./flowCatalogActions";
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
      className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-xs font-bold tabular-nums text-primary shadow-sm shadow-primary/5"
      aria-hidden
    >
      {String(index).padStart(2, "0")}
    </span>
  );
}

function FlowStatusPill({
  hasCatalogActions,
  actionCount,
}: {
  hasCatalogActions: boolean;
  actionCount: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold",
        hasCatalogActions
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border/70 bg-muted/45 text-muted-foreground"
      )}
    >
      {hasCatalogActions ? (
        <CheckCircle2 className="size-3.5" aria-hidden />
      ) : (
        <ListOrdered className="size-3.5" aria-hidden />
      )}
      {hasCatalogActions ? `${actionCount} actions` : "Chưa có actions"}
    </span>
  );
}

function FlowStepsInline({
  steps,
}: {
  steps: string[];
}) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có bước nào.
      </p>
    );
  }

  return (
    <div className="min-w-0">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {steps.map((step, index) => (
          <span key={`${step}-${index}`}>
            {index > 0 ? (
              <span className="px-1.5 text-foreground/45" aria-hidden>
                →
              </span>
            ) : null}
            <span>{step}</span>
          </span>
        ))}
      </p>
    </div>
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
  const steps = parseFlowSteps(row.description).filter(Boolean);
  const actionCount = parseFlowCatalogActions(row.actions).length;
  const canOpenSwimlane = hasCatalogActions && !rowBusy;

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if (!canOpenSwimlane) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("button,a,input,textarea,select,[role='menuitem']")
    ) {
      return;
    }
    onOpenSwimlane();
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!canOpenSwimlane) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    onOpenSwimlane();
  }

  return (
    <article
      role={canOpenSwimlane ? "button" : undefined}
      tabIndex={canOpenSwimlane ? 0 : undefined}
      aria-label={canOpenSwimlane ? `Mở swimlane cho flow ${row.name}` : undefined}
      className={cn(
        "group/card flex h-full w-full flex-col rounded-xl border border-border/70 bg-card/60 p-4 text-left shadow-sm outline-none transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-border hover:bg-card hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/45",
        canOpenSwimlane && "cursor-pointer"
      )}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="flex items-start gap-3">
        <FlowIndexBadge index={displayIndex} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {row.code.trim() ? (
                  <span className="rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                    {row.code}
                  </span>
                ) : null}
                <FlowStatusPill
                  hasCatalogActions={hasCatalogActions}
                  actionCount={actionCount}
                />
              </div>
              <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
                {row.name}
              </h2>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  <ListOrdered
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
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
          </div>
        </div>
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <FlowStepsInline steps={steps} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Route className="size-3.5" aria-hidden />
          Flow #{displayIndex}
        </span>
        <Button
          type="button"
          variant={hasCatalogActions ? "outline" : "ghost"}
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs transition-colors duration-200 ease-out",
            hasCatalogActions
              ? "border-border/70 bg-transparent text-foreground hover:bg-primary/5 hover:text-primary group-hover/card:border-primary/25 group-hover/card:text-primary group-focus-visible/card:border-primary/25 group-focus-visible/card:text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          disabled={rowBusy || !hasCatalogActions}
          onClick={onOpenSwimlane}
        >
          Swimlane
          <ArrowRight
            className="size-3.5 transition-transform duration-200 ease-out group-hover/card:translate-x-0.5 group-focus-visible/card:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/card:translate-x-0 motion-reduce:group-focus-visible/card:translate-x-0"
            aria-hidden
          />
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
