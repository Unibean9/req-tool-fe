"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, UserRoundCheck, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteProjectStakeholder,
  useProjectStakeholders,
  useUpdateProjectStakeholder,
  type ProjectStakeholder,
} from "@/hooks/useStakeHolder";
import type { StakeholderInfluenceLevel } from "@/lib/api/services/fetchStakeHolder";
import { cn } from "@/lib/utils";

import { DeleteStakeHolderDialog } from "./deleteStakeHolderDialog";
import { StakeHolderFormDialog } from "./stakeHolderFormDialog";
import { parseImpactAreaTags } from "./stakeHolderFormFields";
import type { StakeholderBusinessActorFilter } from "./stakeHolderToolbar";

function listIsBusinessActorQueryParam(
  filter: StakeholderBusinessActorFilter
): boolean | undefined {
  if (filter === "all") return undefined;
  if (filter === "business") return true;
  return false;
}

const INFLUENCE_LEVEL_LABELS: Record<StakeholderInfluenceLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function stakeholderInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function influenceBadgeClassName(level: StakeholderInfluenceLevel): string {
  return cn(
    "rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
    level === "high" &&
      "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-200",
    level === "medium" &&
      "border-primary/35 bg-primary/10 text-foreground",
    level === "low" &&
      "border-border/80 bg-muted/50 text-muted-foreground"
  );
}

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function ImpactAreaTags({
  impactArea,
  className,
}: {
  impactArea: string;
  className?: string;
}) {
  const tags = parseImpactAreaTags(impactArea);
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {tags.map((tag, index) => (
        <span key={`${tag}-${index}`} className="inline-flex items-center gap-1.5">
          {index > 0 ? (
            <span className="text-xs text-muted-foreground" aria-hidden>
              .
            </span>
          ) : null}
          <span className="inline-flex max-w-full rounded-md border border-border/80 bg-muted/50 px-2 py-0.5 text-xs leading-snug text-foreground/90">
            {tag}
          </span>
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
    row.influenceLevel,
    INFLUENCE_LEVEL_LABELS[row.influenceLevel],
    ...(row.isBusinessActor ? ["business actor", "tác nhân nghiệp vụ"] : []),
  ]
    .map((part) => foldForSearch(part))
    .join(" ");
  return haystack.includes(q);
}

function stakeholderToWriteBody(row: ProjectStakeholder) {
  return {
    name: row.name,
    role: row.role,
    impactArea: row.impactArea,
    influenceLevel: row.influenceLevel,
    notes: row.notes,
    isBusinessActor: row.isBusinessActor,
  };
}

function StakeHolderListRow({
  row,
  rowBusy,
  onEdit,
  onDelete,
  onToggleBusinessActor,
}: {
  row: ProjectStakeholder;
  rowBusy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleBusinessActor: (row: ProjectStakeholder) => void;
}) {
  const initials = stakeholderInitials(row.name);

  return (
    <article className="flex h-full w-full items-start gap-3 rounded-xl border border-border/70 bg-card/50 p-3.5 shadow-sm transition-colors hover:border-border hover:bg-card/80 sm:gap-4 sm:p-4">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-mint/25 text-sm font-bold text-foreground ring-1 ring-brand-mint/30 sm:size-12"
        aria-hidden
      >
        {initials}
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="min-w-0 truncate text-base font-semibold leading-snug text-foreground">
              {row.name}
            </h2>
            {row.isBusinessActor ? (
              <Badge
                variant="secondary"
                className="shrink-0 text-xs font-medium tabular-nums"
              >
                Business actor
              </Badge>
            ) : null}
          </div>
          {row.role.trim() ? (
            <p className="text-sm leading-snug text-muted-foreground">{row.role}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ImpactAreaTags impactArea={row.impactArea} />
          <span className={influenceBadgeClassName(row.influenceLevel)}>
            {INFLUENCE_LEVEL_LABELS[row.influenceLevel]}
          </span>
        </div>

        {row.notes.trim() ? (
          <p className="text-sm leading-relaxed text-foreground/90">{row.notes}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label={`Chỉnh sửa ${row.name}`}
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
          className={cn(
            "size-9 shrink-0",
            row.isBusinessActor
              ? "border-primary/40 bg-primary/10 text-primary"
              : "text-muted-foreground"
          )}
          aria-label={
            row.isBusinessActor
              ? `Tắt business actor — ${row.name}`
              : `Bật business actor — ${row.name}`
          }
          title={
            row.isBusinessActor
              ? "Tắt business actor (bấm để false)"
              : "Bật business actor (bấm để true)"
          }
          disabled={rowBusy}
          onClick={() => onToggleBusinessActor(row)}
        >
          <UserRoundCheck className="size-5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Xóa ${row.name}`}
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

type StakeHolderListProps = {
  projectId: string | null;
  search: string;
  businessActorFilter: StakeholderBusinessActorFilter;
  className?: string;
};

export function StakeHolderList({
  projectId,
  search,
  businessActorFilter,
  className,
}: StakeHolderListProps) {
  const [editTarget, setEditTarget] = useState<ProjectStakeholder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    stakeholderId: string;
    name: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);

  const isBusinessActorParam = listIsBusinessActorQueryParam(businessActorFilter);

  const {
    data: stakeholders = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectStakeholders(projectId, {
    ...(isBusinessActorParam === undefined
      ? {}
      : { isBusinessActor: isBusinessActorParam }),
  });

  const deleteMutation = useDeleteProjectStakeholder({
    onSuccess: () => setDeleteTarget(null),
  });

  const updateMutation = useUpdateProjectStakeholder();

  const rowBusy =
    rowMutationBusy || deleteMutation.isPending || updateMutation.isPending;

  function handleToggleBusinessActor(row: ProjectStakeholder) {
    if (!projectId) return;
    void updateMutation.mutate({
      projectId,
      stakeholderId: row.id,
      body: {
        ...stakeholderToWriteBody(row),
        isBusinessActor: !row.isBusinessActor,
      },
    });
  }

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
        Không tìm thấy dự án trong workspace này.
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
            : "Không tải được danh sách stakeholders."}
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

  if (stakeholders.length === 0) {
    const filterHint =
      businessActorFilter === "business"
        ? "Không có stakeholder nào được đánh dấu business actor. Đổi bộ lọc hoặc cập nhật từng dòng."
        : businessActorFilter === "non_business"
          ? "Không có stakeholder nào ngoài business actor với bộ lọc hiện tại."
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
            {filterHint ? "Không có stakeholder phù hợp" : "Chưa có stakeholder"}
          </p>
          <p className="text-sm text-muted-foreground">
            {filterHint ?? 'Dùng nút "Thêm stakeholder" để bắt đầu.'}
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
        aria-label="Danh sách stakeholders"
      >
        {filtered.map((row) => (
          <li key={row.id} className="flex min-w-0">
            <StakeHolderListRow
              row={row}
              rowBusy={rowBusy}
              onEdit={() => setEditTarget(row)}
              onDelete={() =>
                setDeleteTarget({ stakeholderId: row.id, name: row.name })
              }
              onToggleBusinessActor={handleToggleBusinessActor}
            />
          </li>
        ))}
      </ul>

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
