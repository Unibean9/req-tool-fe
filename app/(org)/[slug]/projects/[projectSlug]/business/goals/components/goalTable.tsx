"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  MoreVertical,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useDeleteProjectGoal,
  useProjectGoals,
  type ProjectGoal,
} from "@/hooks/useGoals";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { fetchGoal, type ProjectGoalPriority } from "@/lib/api/services/fetchGoal";
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

const PRIORITY_LABEL: Record<ProjectGoalPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function priorityBadgeClassName(priority: ProjectGoalPriority): string {
  return cn(
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
    priority === "high" &&
      "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-200",
    priority === "medium" &&
      "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-200",
    priority === "low" && "border-border/80 bg-muted/35 text-muted-foreground"
  );
}

function PriorityBadge({ priority }: { priority: ProjectGoalPriority }) {
  return (
    <span className={priorityBadgeClassName(priority)}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesSearch(row: ProjectGoal, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  return (
    foldForSearch(row.description).includes(q) ||
    foldForSearch(row.successMetric).includes(q)
  );
}

function goalPreview(description: string, max = 48): string {
  const t = description.trim();
  if (t.length <= max) return t || "Goal";
  return `${t.slice(0, max)}…`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

type ObjectivesDialogProps = {
  goal: ProjectGoal | null;
  onOpenChange: (open: boolean) => void;
};

function ObjectivesDialog({ goal, onOpenChange }: ObjectivesDialogProps) {
  return (
    <Dialog open={goal != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Objectives</DialogTitle>
          {goal?.description && (
            <DialogDescription className="line-clamp-2">
              {goal.description}
            </DialogDescription>
          )}
        </DialogHeader>
        {goal && (
          <ul className="mt-1 divide-y divide-border/60">
            {goal.objectives.map((obj, i) => (
              <li
                key={obj.id}
                className="flex items-start gap-3 py-2.5 text-sm"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <span className="leading-relaxed text-foreground">
                  {obj.description}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

type GoalTableProps = {
  projectId: string | null;
  search: string;
  className?: string;
};

export function GoalTable({ projectId, search, className }: GoalTableProps) {
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<ProjectGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    goalId: string;
    preview: string;
  } | null>(null);
  const [objectivesTarget, setObjectivesTarget] = useState<ProjectGoal | null>(
    null
  );
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
    rowMutationBusy || deleteMutation.isPending || reorderingGoalId != null;

  async function applyOrderPatches(patches: GoalOrderPatch[]) {
    if (!projectId) return;
    const pid = projectId.trim();
    for (const { goal, order } of patches) {
      await fetchGoal.update(pid, goal.id, {
        description: goal.description,
        order,
        priority: goal.priority,
        successMetric: goal.successMetric,
        targetDate: goal.targetDate,
        objectives: goal.objectives.map((o) => o.description),
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
      toast.success("Goal order updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not reorder goal"));
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
      toast.success("Goal order updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not reorder goal"));
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
            : "Failed to load goals."}
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
          <p className="text-sm font-medium text-foreground">No goal</p>
          <p className="text-sm text-muted-foreground">
            Use the &quot;Add new&quot; button to start.
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
                <TableHead className="min-w-60">Description</TableHead>
                <TableHead className="w-28">Priority</TableHead>
                <TableHead className="min-w-40">Success metric</TableHead>
                <TableHead className="w-32">Target date</TableHead>
                <TableHead className="w-28">Objectives</TableHead>
                <TableHead className="w-12 pr-4 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const displayIndex =
                  allSorted.findIndex((g) => g.id === row.id) + 1;

                return (
                  <TableRow key={row.id} className="border-border/60 align-top">
                    <TableCell className="pl-4 text-center text-xs tabular-nums text-muted-foreground">
                      {displayIndex > 0 ? displayIndex : 1}
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

                    <TableCell className="py-3">
                      <PriorityBadge priority={row.priority} />
                    </TableCell>

                    <TableCell className="whitespace-normal py-3 text-sm text-muted-foreground wrap-anywhere">
                      {row.successMetric.trim() || (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-sm tabular-nums text-muted-foreground">
                      {formatDate(row.targetDate)}
                    </TableCell>

                    <TableCell className="py-3">
                      {row.objectives.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setObjectivesTarget(row)}
                          className="text-sm text-primary underline-offset-2 hover:underline"
                        >
                          {row.objectives.length} objectives
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={rowBusy}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                          aria-label="Options"
                        >
                          <MoreVertical className="size-4" aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <DropdownMenuItem
                            disabled={!canMoveGoalUp(allSorted, row)}
                            onClick={() => void handleMoveUp(row)}
                          >
                            <ArrowUp className="size-4" aria-hidden />
                            Move to top
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canMoveGoalDown(allSorted, row)}
                            onClick={() => void handleMoveDown(row)}
                          >
                            <ArrowDown className="size-4" aria-hidden />
                            Move down
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditTarget(row)}>
                            <Pencil className="size-4" aria-hidden />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setDeleteTarget({
                                goalId: row.id,
                                preview: goalPreview(row.description),
                              })
                            }
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

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

      <ObjectivesDialog
        goal={objectivesTarget}
        onOpenChange={(open) => {
          if (!open) setObjectivesTarget(null);
        }}
      />
    </>
  );
}
