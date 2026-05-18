"use client";

import { useMemo, useState } from "react";
import { Link2, Pencil, Scale, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectFeature } from "@/hooks/useFeature";
import {
  useDeleteProjectRule,
  useProjectRules,
  type ProjectRule,
} from "@/hooks/useRule";
import { cn } from "@/lib/utils";

import { DeleteRuleDialog } from "./deleteRuleDialog";
import { RuleFormDialog } from "./ruleFormDialog";
import { formatFeaturePrefixTitle } from "./ruleLinkedFeatureSelect";

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesSearch(row: ProjectRule, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const haystack = [row.description, row.linkedFeatureId ?? ""]
    .map((part) => foldForSearch(part))
    .join(" ");
  return haystack.includes(q);
}

function rulePreview(description: string, max = 48): string {
  const t = description.trim();
  if (t.length <= max) return t || "Rule";
  return `${t.slice(0, max)}…`;
}

function formatFeatureId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function sortRules(rows: ProjectRule[]): ProjectRule[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function RuleLinkedFeatureBadge({
  projectId,
  featureId,
}: {
  projectId: string;
  featureId: string;
}) {
  const { data: feature, isPending, isError } = useProjectFeature(
    projectId,
    featureId
  );

  const label = feature
    ? formatFeaturePrefixTitle(feature)
    : isPending
      ? "Đang tải feature…"
      : isError
        ? "Không tải được feature"
        : formatFeatureId(featureId);

  return (
    <p className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
      <Link2 className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate font-medium text-foreground/90" title={label}>
        {label}
      </span>
    </p>
  );
}

function RuleListRow({
  projectId,
  row,
  rowBusy,
  onEdit,
  onDelete,
}: {
  projectId: string;
  row: ProjectRule;
  rowBusy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex h-full w-full items-start gap-3 rounded-xl border border-border/70 bg-card/50 p-3.5 shadow-sm transition-colors hover:border-border hover:bg-card/80 sm:gap-4 sm:p-4">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground sm:size-11"
        aria-hidden
      >
        <Scale className="size-5" />
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-base leading-relaxed text-foreground">
          {row.description.trim() || (
            <span className="text-muted-foreground italic">Chưa có mô tả.</span>
          )}
        </p>
        {row.linkedFeatureId ? (
          <RuleLinkedFeatureBadge
            projectId={projectId}
            featureId={row.linkedFeatureId}
          />
        ) : (
          <p className="text-xs text-muted-foreground">Chưa liên kết feature</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label="Chỉnh sửa rule"
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
          aria-label="Xóa rule"
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

type RuleListProps = {
  projectId: string | null;
  search: string;
  className?: string;
};

export function RuleList({ projectId, search, className }: RuleListProps) {
  const [editTarget, setEditTarget] = useState<ProjectRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    ruleId: string;
    preview: string;
  } | null>(null);
  const [rowMutationBusy, setRowMutationBusy] = useState(false);

  const {
    data: rules = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectRules(projectId);

  const deleteMutation = useDeleteProjectRule({
    onSuccess: () => setDeleteTarget(null),
  });

  const sorted = useMemo(() => sortRules(rules), [rules]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return sorted;
    return sorted.filter((row) => matchesSearch(row, q));
  }, [sorted, search]);

  const rowBusy = rowMutationBusy || deleteMutation.isPending;

  async function confirmDelete() {
    if (!projectId || !deleteTarget) return;
    await deleteMutation.mutateAsync({
      projectId,
      ruleId: deleteTarget.ruleId,
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
            : "Không tải được danh sách rules."}
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

  if (rules.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
          <Scale className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Chưa có rule</p>
          <p className="text-sm text-muted-foreground">
            Dùng nút &quot;Thêm rule&quot; để bắt đầu.
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
        aria-label="Danh sách rules"
      >
        {filtered.map((row) => (
          <li key={row.id} className="flex min-w-0">
            <RuleListRow
              projectId={projectId}
              row={row}
              rowBusy={rowBusy}
              onEdit={() => setEditTarget(row)}
              onDelete={() =>
                setDeleteTarget({
                  ruleId: row.id,
                  preview: rulePreview(row.description),
                })
              }
            />
          </li>
        ))}
      </ul>

      <RuleFormDialog
        projectId={projectId}
        rule={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setRowMutationBusy}
      />

      <DeleteRuleDialog
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
