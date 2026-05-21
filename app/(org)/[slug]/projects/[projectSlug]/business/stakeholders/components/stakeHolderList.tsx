"use client";

import { useMemo, useState } from "react";
import {
  CircleGauge,
  MessageSquareText,
  Pencil,
  Tags,
  Trash2,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

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
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
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
        <span
          key={`${tag}-${index}`}
          className="inline-flex max-w-full rounded-full border border-border/70 bg-muted/35 px-2.5 py-1 text-xs leading-snug text-foreground/85"
        >
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
    <article className="group flex h-full w-full flex-col rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-border hover:bg-card hover:shadow-md">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1",
            row.isBusinessActor
              ? "bg-brand-mint/25 text-foreground ring-brand-mint/35"
              : "bg-muted/65 text-muted-foreground ring-border/70"
          )}
          aria-hidden
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="min-w-0 truncate text-base font-semibold leading-snug text-foreground">
                  {row.name}
                </h2>
                {row.isBusinessActor ? (
                  <Badge
                    variant="secondary"
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  >
                    Business actor
                  </Badge>
                ) : null}
              </div>
              {row.role.trim() ? (
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {row.role}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Chưa có vai trò.
                </p>
              )}
            </div>

            <span className={influenceBadgeClassName(row.influenceLevel)}>
              <CircleGauge className="size-3.5" aria-hidden />
              {INFLUENCE_LEVEL_LABELS[row.influenceLevel]}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 min-w-0 space-y-2.5 pb-4">
        <div className="flex min-w-0 items-start gap-2">
          <Tags
            className="mt-1 size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <ImpactAreaTags impactArea={row.impactArea} />
        </div>

        {row.notes.trim() ? (
          <div className="flex min-w-0 items-start gap-2 border-l border-border/70 pl-3">
            <MessageSquareText
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p className="line-clamp-3 text-sm leading-relaxed text-foreground/85">
              {row.notes}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs",
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
          <UserRoundCheck className="size-3.5" aria-hidden />
          {row.isBusinessActor ? "Business actor" : "Mark business"}
        </Button>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            aria-label={`Chỉnh sửa ${row.name}`}
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
            aria-label={`Xóa ${row.name}`}
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
  const [businessActorToggleId, setBusinessActorToggleId] = useState<
    string | null
  >(null);

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

  const listMutationBusy = rowMutationBusy || deleteMutation.isPending;

  function handleToggleBusinessActor(row: ProjectStakeholder) {
    if (!projectId || businessActorToggleId) return;
    setBusinessActorToggleId(row.id);
    void updateMutation.mutate({
      projectId,
      stakeholderId: row.id,
      body: {
        ...stakeholderToWriteBody(row),
        isBusinessActor: !row.isBusinessActor,
      },
    }, {
      onSettled: () => setBusinessActorToggleId(null),
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
       
        aria-label="Danh sách stakeholders"
      >
        {filtered.map((row) => (
          <li key={row.id} className="flex min-w-0">
            <StakeHolderListRow
              row={row}
              rowBusy={listMutationBusy || businessActorToggleId === row.id}
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
