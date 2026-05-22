"use client";

import { useMemo, useState } from "react";
import {
  MessageSquareText,
  MoreVertical,
  Pencil,
  Tags,
  Trash2,
  UserRoundCheck,
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
  filter: StakeholderBusinessActorFilter,
): boolean | undefined {
  if (filter === "all") return undefined;
  if (filter === "business") return true;
  return false;
}

const INFLUENCE_LEVEL_LABELS: Record<StakeholderInfluenceLevel, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
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
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
    level === "high" &&
      "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-200",
    level === "medium" &&
      "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-200",
    level === "low" && "border-border/80 bg-muted/50 text-muted-foreground",
  );
}

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function ImpactAreaTags({ impactArea }: { impactArea: string }) {
  const tags = parseImpactAreaTags(impactArea);
  if (tags.length === 0)
    return <span className="italic text-muted-foreground">—</span>;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex max-w-full rounded-full border border-border/70 bg-muted/35 px-2 py-0.5 text-[11px] leading-snug text-foreground/85"
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

type StakeHolderTableProps = {
  projectId: string | null;
  search: string;
  businessActorFilter: StakeholderBusinessActorFilter;
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
  const [businessActorToggleId, setBusinessActorToggleId] = useState<
    string | null
  >(null);

  const isBusinessActorParam =
    listIsBusinessActorQueryParam(businessActorFilter);

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

  const rowBusy = rowMutationBusy || deleteMutation.isPending;

  function handleToggleBusinessActor(row: ProjectStakeholder) {
    if (!projectId || businessActorToggleId) return;
    setBusinessActorToggleId(row.id);
    void updateMutation.mutate(
      {
        projectId,
        stakeholderId: row.id,
        body: {
          ...stakeholderToWriteBody(row),
          isBusinessActor: !row.isBusinessActor,
        },
      },
      {
        onSettled: () => setBusinessActorToggleId(null),
      },
    );
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
          className,
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
        ? "Không có stakeholder nào được đánh dấu business actor."
        : businessActorFilter === "non_business"
          ? "Không có stakeholder nào ngoài business actor với bộ lọc hiện tại."
          : null;

    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className,
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <UsersRound className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {filterHint
              ? "Không có stakeholder phù hợp"
              : "Chưa có stakeholder"}
          </p>
          <p className="text-sm text-muted-foreground">
            {filterHint ?? 'Dùng nút "Thêm mới" để bắt đầu.'}
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
          className,
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
          className,
        )}
      >
        <div className="overflow-auto max-h-[calc(100svh-10rem)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/70 bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12 pl-4 text-center">#</TableHead>
              <TableHead className="min-w-48">Tên / Vai trò</TableHead>
              <TableHead className="w-36">Business Actor</TableHead>
              <TableHead className="min-w-48">
                <span className="inline-flex items-center gap-1.5">
                  <Tags className="size-3.5" aria-hidden />
                  Khu vực tác động
                </span>
              </TableHead>
              <TableHead className="w-36">Mức ảnh hưởng</TableHead>
              <TableHead className="min-w-48">
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquareText className="size-3.5" aria-hidden />
                  Ghi chú
                </span>
              </TableHead>
              <TableHead className="w-12 pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, index) => {
              const initials = stakeholderInitials(row.name);

              return (
                <TableRow key={row.id} className="border-border/60 align-top">
                  <TableCell className="pl-4 text-center text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>

                  <TableCell className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1",
                          row.isBusinessActor
                            ? "bg-brand-mint/25 text-foreground ring-brand-mint/35"
                            : "bg-muted/65 text-muted-foreground ring-border/70",
                        )}
                        aria-hidden
                      >
                        {initials}
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
                            Chưa có vai trò
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
                        row.isBusinessActor
                          ? "border-brand-mint/35 bg-brand-mint/20 text-foreground"
                          : "border-border/60 bg-muted/30 text-muted-foreground",
                      )}
                    >
                      <UserRoundCheck className="size-3" aria-hidden />
                      {row.isBusinessActor ? "Business Actor" : "Không"}
                    </span>
                  </TableCell>

                  <TableCell className="py-3">
                    <ImpactAreaTags impactArea={row.impactArea} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={influenceBadgeClassName(row.influenceLevel)}
                    >
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
                        aria-label={`Tùy chọn ${row.name}`}
                      >
                        <MoreVertical className="size-4" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-48">
                        <DropdownMenuItem
                          onClick={() => handleToggleBusinessActor(row)}
                        >
                          <UserRoundCheck className="size-4" aria-hidden />
                          {row.isBusinessActor
                            ? "Bỏ Business Actor"
                            : "Đánh dấu Business Actor"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditTarget(row)}>
                          <Pencil className="size-4" aria-hidden />
                          Chỉnh sửa
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
                          Xóa
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
