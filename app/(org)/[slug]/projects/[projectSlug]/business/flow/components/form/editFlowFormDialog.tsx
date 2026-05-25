"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateProjectFlow } from "@/hooks/useFlow";
import type { ProjectFlow } from "@/lib/api/services/fetchFlow";
import { cn } from "@/lib/utils";

import {
  FlowBasicsFormFields,
  isFlowBasicsFormValid,
  trimFlowBasicsFormValues,
  type FlowBasicsFormValues,
} from "./flowBasicsFormFields";
import { FLOW_FORM_DIALOG_WIDTH_CLASS } from "./flowFormLimits";

function valuesFromFlow(row: ProjectFlow): FlowBasicsFormValues {
  return {
    code: row.code ?? "",
    name: row.name ?? "",
    description: row.description ?? "",
  };
}

type EditFlowFormDialogBodyProps = {
  projectId: string;
  flow: ProjectFlow;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function EditFlowFormDialogBody({
  projectId,
  flow,
  onOpenChange,
  onRowInteractBusy,
}: EditFlowFormDialogBodyProps) {
  const [values, setValues] = useState<FlowBasicsFormValues>(() =>
    valuesFromFlow(flow)
  );

  const updateMutation = useUpdateProjectFlow({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const pending = updateMutation.isPending;
  const canSubmit = isFlowBasicsFormValid(values) && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const trimmed = trimFlowBasicsFormValues(values);
    void updateMutation.mutateAsync({
      projectId,
      flowId: flow.id,
      body: {
        code: trimmed.code,
        name: trimmed.name,
        description: trimmed.description,
      },
    });
  }

  return (
    <form className="w-full min-w-0" onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-lg">Sửa business flow</DialogTitle>
        <DialogDescription>
          Cập nhật mã, tên và mô tả cho business flow{" "}
          <span className="font-medium text-foreground">{flow.name}</span>.
        </DialogDescription>
      </DialogHeader>
      <FlowBasicsFormFields
        values={values}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        disabled={pending}
        idPrefix="edit-flow"
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
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export type EditFlowFormDialogProps = {
  projectId: string | null;
  flow: ProjectFlow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function EditFlowFormDialog({
  projectId,
  flow,
  open,
  onOpenChange,
  disabled = false,
  onRowInteractBusy,
}: EditFlowFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const fid = flow?.id?.trim() ?? "";

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
        {open && pid && fid && flow && !disabled ? (
          <EditFlowFormDialogBody
            key={fid}
            projectId={pid}
            flow={flow}
            onOpenChange={handleOpenChange}
            onRowInteractBusy={onRowInteractBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
