"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateProjectFlowActions,
  usePatchProjectFlowActions,
  useProjectFlow,
} from "@/hooks/useFlow";
import { useProjectRules } from "@/hooks/useRule";
import { useProjectStakeholders } from "@/hooks/useStakeHolder";
import type {
  CreateProjectFlowActionItem,
  PatchProjectFlowActionItem,
  ProjectFlow,
} from "@/lib/api/services/fetchFlow";
import { cn } from "@/lib/utils";

import { EditFlowActionAiLoadingOverlay } from "./editFlowActionAiLoadingOverlay";
import { parseFlowCatalogActions } from "./flowCatalogActions";
import {
  FlowCatalogActionRowsEditor,
  appendFlowCatalogActionRow,
  canAppendFlowCatalogActionRow,
  flowCatalogActionRowsValidForSubmit,
  newFlowCatalogActionRow,
  type FlowCatalogActionRowModel,
} from "./flowCatalogActionRowsEditor";

/** Dialog sửa/tạo flow actions — gần full màn hình. */
const EDIT_FLOW_ACTIONS_DIALOG_CONTENT_CLASS = cn(
  "flex w-[calc(100vw-1.25rem)] max-w-[calc(100vw-1.25rem)] flex-col gap-0 overflow-hidden p-0",
  "h-[calc(100dvh-1.25rem)] max-h-[calc(100dvh-1.25rem)]",
  "sm:max-w-[calc(100vw-1.25rem)]"
);

export type FlowActionsDialogVariant = "post" | "patch";

type EditFlowActionFormDialogBodyProps = {
  projectId: string;
  flow: ProjectFlow;
  variant: FlowActionsDialogVariant;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
  onSavePendingChange?: (pending: boolean) => void;
};

function draftsToRows(
  drafts: ReturnType<typeof parseFlowCatalogActions>
): FlowCatalogActionRowModel[] {
  return drafts.map((d) => ({
    rowKey: d.id,
    persistId: d.id,
    description: d.description,
    actorId: d.actorId,
    ruleIds: d.ruleIds,
  }));
}

function EditFlowActionFormDialogLoaded({
  projectId,
  flow,
  variant,
  initialRows,
  onOpenChange,
  onRowInteractBusy,
  onSavePendingChange,
}: EditFlowActionFormDialogBodyProps & {
  initialRows: FlowCatalogActionRowModel[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: stakeholders = [], isPending: stakeholdersPending } =
    useProjectStakeholders(projectId, {
      enabled: true,
      isBusinessActor: true,
    });

  const { data: rules = [], isPending: rulesPending } = useProjectRules(
    projectId,
    { enabled: true }
  );

  const createMutation = useCreateProjectFlowActions({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
  });

  const patchMutation = usePatchProjectFlowActions({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
  });

  const isCreate = variant === "post";
  /** Sửa + thêm action mới: POST rồi PATCH — phải gộp cả hai mutation. */
  const pending =
    isSubmitting ||
    createMutation.isPending ||
    patchMutation.isPending;

  const canSubmit = isCreate
    ? flowCatalogActionRowsValidForSubmit(rows) && !pending
    : flowCatalogActionRowsValidForSubmit(rows) && !pending;

  const canAddRow = canAppendFlowCatalogActionRow(rows, pending);

  useEffect(() => {
    onSavePendingChange?.(pending);
  }, [pending, onSavePendingChange]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    if (isCreate) {
      const items: CreateProjectFlowActionItem[] = rows
        .map((r, i) => ({
          order: i,
          description: r.description.trim(),
          actorId: r.actorId.trim(),
          ruleIds: r.ruleIds,
        }))
        .filter((r) => r.description.length > 0 && r.actorId.length > 0);
      if (items.length === 0) return;
      setIsSubmitting(true);
      void createMutation
        .mutateAsync({
          projectId,
          flowId: flow.id,
          items,
        })
        .then(() => {
          setIsSubmitting(false);
          onOpenChange(false);
        })
        .catch(() => setIsSubmitting(false));
      return;
    }

    const filled = rows.filter(
      (r) => r.description.trim().length > 0 && r.actorId.trim().length > 0
    );

    const createItems: CreateProjectFlowActionItem[] = filled
      .filter((r) => !r.persistId?.trim())
      .map((r, i) => ({
        order: i,
        description: r.description.trim(),
        actorId: r.actorId.trim(),
        ruleIds: r.ruleIds,
      }));

    const patchItems: PatchProjectFlowActionItem[] = filled
      .filter((r) => r.persistId?.trim())
      .map((r, i) => ({
        id: r.persistId!.trim(),
        order: i,
        description: r.description.trim(),
        actorId: r.actorId.trim(),
        ruleIds: r.ruleIds,
      }));

    setIsSubmitting(true);
    void (async () => {
      try {
        if (createItems.length > 0) {
          await createMutation.mutateAsync({
            projectId,
            flowId: flow.id,
            items: createItems,
          });
        }
        if (patchItems.length > 0) {
          await patchMutation.mutateAsync({
            projectId,
            flowId: flow.id,
            items: patchItems,
          });
        }
        setIsSubmitting(false);
        onOpenChange(false);
      } catch {
        setIsSubmitting(false);
      }
    })();
  }

  const title = isCreate ? "Tạo flow actions" : "Sửa flow actions";
  const descriptionLead = isCreate
    ? "Thêm Actor Business và rule(s) cho các action của "
    : "Cập nhật Actor Business và rule(s) cho từng action của ";

  return (
    <form
      className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
      onSubmit={handleSubmit}
      aria-busy={pending}
    >
      <EditFlowActionAiLoadingOverlay open={pending} />

      <DialogHeader className="shrink-0 space-y-0">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="min-w-0 flex-1 space-y-1">
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <DialogDescription>
              {descriptionLead}
              <span className="font-medium text-foreground">{flow.name}</span>.
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="mt-0.5 shrink-0 gap-1.5 font-semibold"
            disabled={!canAddRow}
            onClick={() => setRows((prev) => appendFlowCatalogActionRow(prev))}
          >
            <Plus className="size-4" aria-hidden />
            Thêm action
          </Button>
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] scrollbar-gutter-stable">
        <FlowCatalogActionRowsEditor
          rows={rows}
          onChange={setRows}
          stakeholders={stakeholders}
          stakeholdersPending={stakeholdersPending}
          rules={rules}
          rulesPending={rulesPending}
          disabled={pending}
          idPrefix={
            isCreate ? "create-flow-actions-inline" : "edit-flow-actions"
          }
          allowAddRemove
          showOrderControls
          hideFooterAddButton
        />
      </div>

      <DialogFooter className="mt-2 shrink-0 gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={!canSubmit} aria-busy={pending}>
          {isCreate ? "Tạo actions" : "Lưu actions"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditFlowActionFormDialogBody({
  projectId,
  flow,
  variant,
  onOpenChange,
  onRowInteractBusy,
  onSavePendingChange,
}: EditFlowActionFormDialogBodyProps) {
  const isCreate = variant === "post";

  const {
    data: flowDetail,
    isPending: flowPending,
    isError: flowError,
    error: flowErrorObj,
    refetch,
  } = useProjectFlow(projectId, flow.id, { enabled: !isCreate });

  if (isCreate) {
    return (
      <EditFlowActionFormDialogLoaded
        key={`post-${flow.id}`}
        projectId={projectId}
        flow={flow}
        variant="post"
        initialRows={[newFlowCatalogActionRow()]}
        onOpenChange={onOpenChange}
        onRowInteractBusy={onRowInteractBusy}
        onSavePendingChange={onSavePendingChange}
      />
    );
  }

  if (flowPending) {
    return (
      <>
        <DialogHeader className="shrink-0 space-y-1">
          <DialogTitle className="text-lg">Sửa flow actions</DialogTitle>
          <DialogDescription>
            Đang tải chi tiết flow{" "}
            <span className="font-medium text-foreground">{flow.name}</span>…
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="grid gap-3 py-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
        <DialogFooter className="mt-2 shrink-0 gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled>
            Đang tải…
          </Button>
        </DialogFooter>
      </>
    );
  }

  if (flowError) {
    return (
      <>
        <DialogHeader className="shrink-0 space-y-1">
          <DialogTitle className="text-lg">Sửa flow actions</DialogTitle>
          <DialogDescription>
            Không tải được chi tiết flow{" "}
            <span className="font-medium text-foreground">{flow.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="py-4 text-center">
            <p className="text-sm text-destructive">
              {flowErrorObj instanceof Error
                ? flowErrorObj.message
                : "Không tải được chi tiết flow."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void refetch()}
            >
              Thử lại
            </Button>
          </div>
        </div>
        <DialogFooter className="mt-2 shrink-0 gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </>
    );
  }

  if (!flowDetail) return null;

  const initialRows = draftsToRows(
    parseFlowCatalogActions(flowDetail.actions)
  );

  if (initialRows.length === 0) {
    return (
      <EditFlowActionFormDialogLoaded
        key={`post-empty-${flow.id}-${flowDetail.updatedAt}`}
        projectId={projectId}
        flow={flow}
        variant="post"
        initialRows={[newFlowCatalogActionRow()]}
        onOpenChange={onOpenChange}
        onRowInteractBusy={onRowInteractBusy}
        onSavePendingChange={onSavePendingChange}
      />
    );
  }

  return (
    <EditFlowActionFormDialogLoaded
      key={`patch-${flow.id}-${flowDetail.updatedAt}`}
      projectId={projectId}
      flow={flow}
      variant="patch"
      initialRows={initialRows}
      onOpenChange={onOpenChange}
      onRowInteractBusy={onRowInteractBusy}
      onSavePendingChange={onSavePendingChange}
    />
  );
}

export type EditFlowActionFormDialogProps = {
  projectId: string | null;
  flow: ProjectFlow | null;
  /** `post` = tạo actions; `patch` = cập nhật (mặc định). */
  variant?: FlowActionsDialogVariant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function EditFlowActionFormDialog({
  projectId,
  flow,
  variant = "patch",
  open,
  onOpenChange,
  disabled = false,
  onRowInteractBusy,
}: EditFlowActionFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const fid = flow?.id?.trim() ?? "";
  const [savePending, setSavePending] = useState(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        if (savePending) return;
        setSavePending(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, savePending]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={EDIT_FLOW_ACTIONS_DIALOG_CONTENT_CLASS}
        contentClassName="relative flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5"
        showCloseButton={!savePending}
      >
        {open && pid && fid && flow && !disabled ? (
          <EditFlowActionFormDialogBody
            key={`${fid}-${variant}`}
            projectId={pid}
            flow={flow}
            variant={variant}
            onOpenChange={handleOpenChange}
            onRowInteractBusy={onRowInteractBusy}
            onSavePendingChange={setSavePending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
