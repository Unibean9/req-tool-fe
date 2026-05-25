"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  CircleDashed,
  MessageSquareText,
  MoreVertical,
  Pencil,
  Trash2,
  UserRound,
  UsersRound,
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
  useDeleteProjectStakeholder,
  useProjectStakeholders,
  type ProjectStakeholder,
} from "@/hooks/useStakeHolder";
import type {
  StakeholderActorType,
  StakeholderInfluenceLevel,
} from "@/lib/api/services/fetchStakeHolder";
import { cn } from "@/lib/utils";

import { DeleteStakeHolderDialog } from "./deleteStakeHolderDialog";
import { StakeHolderFormDialog } from "./stakeHolderFormDialog";
import { parseImpactAreaTags } from "./stakeHolderFormFields";
import type { StakeholderActorTypeFilter } from "./stakeHolderToolbar";

const INFLUENCE_LEVEL_LABELS: Record<StakeholderInfluenceLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const ACTOR_TYPE_LABELS: Record<StakeholderActorType, string> = {
  none: "None",
  business_actor: "Business actor",
  other_actor: "Other actor",
};

function avatarClassName(type: StakeholderActorType): string {
  return cn(
    "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1",
    type === "business_actor" &&
      "bg-brand-mint/25 text-foreground ring-brand-mint/35",
    type === "other_actor" &&
      "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-200",
    type === "none" && "bg-muted/65 text-muted-foreground ring-border/70"
  );
}

function actorTypeIcon(type: StakeholderActorType) {
  if (type === "business_actor")
    return <Briefcase className="size-3.5" aria-hidden />;
  if (type === "other_actor")
    return <UserRound className="size-3.5" aria-hidden />;
  return <CircleDashed className="size-3.5" aria-hidden />;
}

function influenceBadgeClassName(level: StakeholderInfluenceLevel): string {
  return cn(
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
    level === "high" &&
      "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-200",
    level === "medium" &&
      "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-200",
    level === "low" && "border-border/80 bg-muted/50 text-muted-foreground"
  );
}

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function ImpactAreaTags({ impactArea }: { impactArea: string }) {
  const tags = parseImpactAreaTags(impactArea);
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1" role="list" aria-label="Impact areas">
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          role="listitem"
          className="inline-flex max-w-full items-center gap-0.5 rounded-md border border-brand-jade/30 bg-brand-jade/12 px-1.5 py-0.5 text-[11px] font-medium leading-snug tracking-wide text-brand-mint"
        >
          <span className="opacity-50 select-none" aria-hidden>#</span>
          {tag}
        </span>
      ))}
    </div>
  );
}

function matchesSearch(row: ProjectStakeholder, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const haystack = [
    row.name,
    row.role,
    ...parseImpactAreaTags(row.impactArea),
    row.notes,
    row.systemDescription,
    row.influenceLevel,
    INFLUENCE_LEVEL_LABELS[row.influenceLevel],
    row.actorType,
    ACTOR_TYPE_LABELS[row.actorType],
  ]
    .map((part) => foldForSearch(part))
    .join(" ");
  return haystack.includes(q);
}


type StakeHolderTableProps = {
  projectId: string | null;
  search: string;
  businessActorFilter: StakeholderActorTypeFilter;
  className?: string;
};

export function StakeHolderTable({
  projectId,
  search,
  businessActorFilter,
  className,
}: StakeHolderTableProps) {
  const [editTarget, setEditTarget] = useState<ProjectStakeholder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    stakeholderId: string;
    name: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);

  const actorTypeParam =
    businessActorFilter === "all" ? undefined : businessActorFilter;

  const {
    data: stakeholders = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectStakeholders(projectId, {
    ...(actorTypeParam === undefined ? {} : { actorType: actorTypeParam }),
  });

  const deleteMutation = useDeleteProjectStakeholder({
    onSuccess: () => setDeleteTarget(null),
  });

  const rowBusy = rowMutationBusy || deleteMutation.isPending;

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return stakeholders;
    return stakeholders.filter((row) => matchesSearch(row, q));
  }, [stakeholders, search]);

  async function confirmDelete() {
    if (!projectId || !deleteTarget) return;
    await deleteMutation.mutateAsync({
      projectId,
      stakeholderId: deleteTarget.stakeholderId,
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
            : "Failed to load the stakeholders."}
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

  if (stakeholders.length === 0) {
    const filterHint =
      businessActorFilter === "business_actor"
        ? "No stakeholders with the Business actor role."
        : businessActorFilter === "other_actor"
          ? "No stakeholders with the Other actor role."
          : businessActorFilter === "none"
            ? "No stakeholders with the None role."
            : null;

    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <UsersRound className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {filterHint
              ? "No matching stakeholders"
              : "No stakeholders yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {filterHint ?? 'Use the "Add new" button to get started.'}
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
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
          className
        )}
      >
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/70 bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12 pl-4 text-center">#</TableHead>
                <TableHead className="min-w-64 max-w-80">Name / Role</TableHead>
                <TableHead className="min-w-44">System description</TableHead>
                <TableHead className="w-36">Influence level</TableHead>
                <TableHead className="min-w-44">
                    Notes
                </TableHead>
                <TableHead className="w-12 pr-4 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row, index) => {
                return (
                  <TableRow key={row.id} className="border-border/60 align-top">
                    <TableCell className="pl-4 text-center text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={avatarClassName(row.actorType)}
                            aria-label={ACTOR_TYPE_LABELS[row.actorType]}
                          >
                            {actorTypeIcon(row.actorType)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {row.name}
                            </p>
                            {row.role.trim() ? (
                              <p className="truncate text-xs text-muted-foreground">
                                {row.role}
                              </p>
                            ) : (
                              <p className="text-xs italic text-muted-foreground">
                                No role
                              </p>
                            )}
                          </div>
                        </div>
                        <ImpactAreaTags impactArea={row.impactArea} />
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-normal wrap-break-word py-3">
                      {row.systemDescription.trim() ? (
                        <p className="text-sm leading-relaxed text-foreground/85">
                          {row.systemDescription}
                        </p>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className={influenceBadgeClassName(row.influenceLevel)}>
                        {INFLUENCE_LEVEL_LABELS[row.influenceLevel]}
                      </span>
                    </TableCell>

                    <TableCell className="whitespace-normal py-3 wrap-anywhere">
                      {row.notes.trim() ? (
                        <p className="text-sm leading-relaxed text-foreground/85 text-justify hyphens-auto">
                          {row.notes}
                        </p>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={rowBusy}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                          aria-label={`Options for ${row.name}`}
                        >
                          <MoreVertical className="size-4" aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-48">
                          <DropdownMenuItem onClick={() => setEditTarget(row)}>
                            <Pencil className="size-4" aria-hidden />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setDeleteTarget({
                                stakeholderId: row.id,
                                name: row.name,
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

      <StakeHolderFormDialog
        projectId={projectId}
        stakeholder={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <DeleteStakeHolderDialog
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
