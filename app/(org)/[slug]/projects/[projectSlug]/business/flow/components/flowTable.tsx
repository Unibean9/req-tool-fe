"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ListOrdered,
  MoreVertical,
  Pencil,
  Trash2,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useDeleteProjectFlow,
  useProjectFlows,
  type ProjectFlow,
} from "@/hooks/useFlow";
import { cn } from "@/lib/utils";

import { DeleteFlowDialog } from "./form/deleteFlowDialog";
import {
  EditFlowActionFormDialog,
  type FlowActionsDialogVariant,
} from "./actions/editFlowActionFormDialog";
import { EditFlowFormDialog } from "./form/editFlowFormDialog";
import { FlowSwimlaneDetailDialog } from "./activity/flowActivityDialog";
import {
  hasFlowCatalogActions,
  parseFlowCatalogActions,
} from "./actions/flowCatalogActions";
import { sortFlows } from "./utils/flowReorder";
import { parseFlowSteps } from "./utils/flowSteps";

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

function FlowStepsInline({ steps }: { steps: string[] }) {
  if (steps.length === 0) {
    return <span className="italic text-muted-foreground">Chưa có bước nào.</span>;
  }
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {steps.map((step, index) => (
        <span key={`${step}-${index}`}>
          {index > 0 ? (
            <span className="px-1 text-foreground/40" aria-hidden>
              →
            </span>
          ) : null}
          <span>{step}</span>
        </span>
      ))}
    </p>
  );
}

type FlowTableProps = {
  projectId: string | null;
  search: string;
  className?: string;
};

export function FlowTable({ projectId, search, className }: FlowTableProps) {
  const [editFlowTarget, setEditFlowTarget] = useState<ProjectFlow | null>(null);
  const [swimlaneDetailFlow, setSwimlaneDetailFlow] =
    useState<ProjectFlow | null>(null);
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
            : "Failed to load business flows."}
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
          <p className="text-sm font-medium text-foreground">
            No business flows yet
          </p>
          <p className="text-sm text-muted-foreground">
            Use the &quot;Add new&quot; button to define the first process.
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
              <TableHead className="w-48">Flow</TableHead>
              <TableHead className="min-w-60">Steps</TableHead>
              <TableHead className="w-44">Actions</TableHead>
              <TableHead className="w-40 pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const displayIndex =
                allSorted.findIndex((f) => f.id === row.id) + 1;
              const hasCatalogActions = hasFlowCatalogActions(row.actions);
              const actionCount = parseFlowCatalogActions(row.actions).length;
              const steps = parseFlowSteps(row.description).filter(Boolean);

              return (
                <TableRow key={row.id} className="border-border/60 align-top">
                  <TableCell className="pl-4 text-center text-xs tabular-nums text-muted-foreground">
                    {displayIndex > 0 ? displayIndex : 1}
                  </TableCell>

                  <TableCell className="py-3">
                    {row.code.trim() ? (
                      <span className="mb-1 inline-block rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                        {row.code}
                      </span>
                    ) : null}
                    <p className="text-sm font-semibold leading-snug text-foreground">
                      {row.name}
                    </p>
                  </TableCell>

                  <TableCell className="whitespace-normal py-3 wrap-anywhere">
                    <FlowStepsInline steps={steps} />
                  </TableCell>

                  <TableCell className="py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
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
                      {hasCatalogActions
                        ? `${actionCount} actions`
                        : "No actions"}
                    </span>
                  </TableCell>

                  <TableCell className="pr-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant={hasCatalogActions ? "outline" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-7 gap-1.5 text-xs",
                          hasCatalogActions
                            ? "border-border/70 text-foreground hover:text-primary"
                            : "text-muted-foreground"
                        )}
                        disabled={rowBusy || !hasCatalogActions}
                        onClick={() => setSwimlaneDetailFlow(row)}
                      >
                        Activity Diagram
                        <ArrowRight className="size-3" aria-hidden />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={rowBusy}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                          aria-label={`Options for ${row.name}`}
                        >
                          <MoreVertical className="size-4" aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem
                            onClick={() => setEditFlowTarget(row)}
                          >
                            <Pencil className="size-4" aria-hidden />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setFlowActionsDialog({
                                flow: row,
                                variant: hasCatalogActions ? "patch" : "post",
                              })
                            }
                          >
                            <ListOrdered className="size-4" aria-hidden />
                            {hasCatalogActions
                              ? "Update actions"
                              : "Add actions"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setDeleteTarget({
                                flowId: row.id,
                                flowName: row.name,
                              })
                            }
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

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
