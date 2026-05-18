"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateProjectFlow,
  useProjectFlows,
  useUpdateProjectFlow,
} from "@/hooks/useFlow";
import type { ProjectFlow } from "@/lib/api/services/fetchFlow";
import { cn } from "@/lib/utils";

import {
  clampFlowOrder,
  FlowFormFields,
  isFlowFormValid,
  trimFlowFormValues,
  type FlowFormValues,
} from "./flowFormFields";
import { FLOW_FORM_DIALOG_WIDTH_CLASS } from "./flowFormLimits";
import { parseFlowSteps } from "./flowSteps";

const EMPTY_FORM: FlowFormValues = {
  title: "",
  order: 0,
  steps: [""],
};

function valuesFromFlow(row: ProjectFlow): FlowFormValues {
  return {
    title: row.title,
    order: row.order,
    steps: parseFlowSteps(row.description),
  };
}

function suggestedNextOrder(flows: ProjectFlow[]): number {
  if (flows.length === 0) return 0;
  return Math.max(...flows.map((f) => f.order)) + 1;
}

type FlowFormDialogBodyProps = {
  projectId: string;
  flow: ProjectFlow | null;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function FlowFormDialogBody({
  projectId,
  flow,
  onOpenChange,
  onRowInteractBusy,
}: FlowFormDialogBodyProps) {
  const isEdit = flow != null;
  const { data: flows = [] } = useProjectFlows(projectId, {
    enabled: !isEdit,
  });

  const initialOrder = useMemo(() => {
    if (flow != null) return flow.order;
    return suggestedNextOrder(flows);
  }, [flow, flows]);

  const [values, setValues] = useState<FlowFormValues>(() =>
    flow != null
      ? valuesFromFlow(flow)
      : { ...EMPTY_FORM, order: initialOrder }
  );

  const createMutation = useCreateProjectFlow({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateProjectFlow({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const pending = isEdit ? updateMutation.isPending : createMutation.isPending;
  const canSubmit = isFlowFormValid(values) && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const body = trimFlowFormValues(values);
    if (isEdit && flow) {
      void updateMutation.mutateAsync({
        projectId,
        flowId: flow.id,
        body,
      });
      return;
    }
    void createMutation.mutateAsync({ projectId, body });
  }

  return (
    <form className="w-full min-w-0" onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-lg">
          {isEdit ? "Sửa flow" : "Tạo flow mới"}
        </DialogTitle>
        <DialogDescription>
          {isEdit && flow != null ? (
            <>
              Cập nhật flow{" "}
              <span className="font-medium text-foreground">{flow.title}</span>.
            </>
          ) : (
            "Định nghĩa các bước trong quy trình business."
          )}
        </DialogDescription>
      </DialogHeader>
      <FlowFormFields
        values={values}
        onChange={(patch) =>
          setValues((prev) => ({
            ...prev,
            ...patch,
            ...(patch.order !== undefined
              ? { order: clampFlowOrder(patch.order) }
              : {}),
          }))
        }
        disabled={pending}
        idPrefix={isEdit ? "edit-flow" : "create-flow"}
      />
      <DialogFooter className="mt-2 gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {pending
            ? isEdit
              ? "Đang lưu…"
              : "Đang tạo…"
            : isEdit
              ? "Lưu thay đổi"
              : "Tạo flow"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export type FlowFormDialogProps = {
  projectId: string | null;
  flow?: ProjectFlow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function FlowFormDialog({
  projectId,
  flow = null,
  open,
  onOpenChange,
  disabled = false,
  onRowInteractBusy,
}: FlowFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const isEdit = Boolean(flow?.id);
  const { data: flowsForCreate = [] } = useProjectFlows(pid, {
    enabled: open && !isEdit && Boolean(pid) && !disabled,
  });
  const createFormKey = `create-${suggestedNextOrder(flowsForCreate)}`;
  const formKey = isEdit ? flow!.id : createFormKey;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("gap-0", FLOW_FORM_DIALOG_WIDTH_CLASS)}
        showCloseButton
      >
        {open && pid && !disabled ? (
          <FlowFormDialogBody
            key={formKey}
            projectId={pid}
            flow={isEdit ? (flow ?? null) : null}
            onOpenChange={handleOpenChange}
            onRowInteractBusy={onRowInteractBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
