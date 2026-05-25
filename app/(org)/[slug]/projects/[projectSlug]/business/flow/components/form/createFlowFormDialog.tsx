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
import { useCreateProjectFlow } from "@/hooks/useFlow";
import type { ProjectFlow } from "@/lib/api/services/fetchFlow";
import { cn } from "@/lib/utils";

import {
  EMPTY_FLOW_BASICS,
  FlowBasicsFormFields,
  isFlowBasicsFormValid,
  trimFlowBasicsFormValues,
  type FlowBasicsFormValues,
} from "./flowBasicsFormFields";
import { EditFlowActionFormDialog } from "../actions/editFlowActionFormDialog";
import { FLOW_FORM_DIALOG_WIDTH_CLASS } from "./flowFormLimits";

type CreatePhase = "fields" | "continuePrompt";

type CreateFlowFormDialogBodyProps = {
  projectId: string;
  onOpenChange: (open: boolean) => void;
  onContinueToActions: (flow: ProjectFlow) => void;
};

function CreateFlowFormDialogBody({
  projectId,
  onOpenChange,
  onContinueToActions,
}: CreateFlowFormDialogBodyProps) {
  const [phase, setPhase] = useState<CreatePhase>("fields");
  const [values, setValues] = useState<FlowBasicsFormValues>(EMPTY_FLOW_BASICS);
  const [createdFlow, setCreatedFlow] = useState<ProjectFlow | null>(null);

  const createMutation = useCreateProjectFlow();

  const pendingFields = createMutation.isPending;
  const canSubmitFields = isFlowBasicsFormValid(values) && !pendingFields;

  function handleSubmitFields(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmitFields) return;
    const trimmed = trimFlowBasicsFormValues(values);
    void createMutation
      .mutateAsync({
        projectId,
        body: {
          code: trimmed.code,
          name: trimmed.name,
          description: trimmed.description,
          actions: [],
        },
      })
      .then((res) => {
        setCreatedFlow(res.data);
        setPhase("continuePrompt");
      });
  }

  if (phase === "continuePrompt" && createdFlow) {
    return (
      <div className="w-full min-w-0 py-2">
        <DialogHeader>
          <DialogTitle className="text-lg">Add business flow actions?</DialogTitle>
          <DialogDescription>
            You have created the business flow{" "}
            <span className="font-medium text-foreground">{createdFlow.name}</span>
            . Do you want to declare the actions (actor + rules) for this business flow?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Skip
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => onContinueToActions(createdFlow)}
          >
            Continue
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form className="w-full min-w-0" onSubmit={handleSubmitFields}>
      <DialogHeader>
        <DialogTitle className="text-lg">Tạo business flow mới</DialogTitle>
        <DialogDescription>
          Nhập mã, tên và mô tả business flow. Sau khi tạo, bạn có thể thêm
          business flow actions (tùy chọn).
        </DialogDescription>
      </DialogHeader>
      <FlowBasicsFormFields
        values={values}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        disabled={pendingFields}
        idPrefix="create-flow"
      />
      <DialogFooter className="mt-2 gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pendingFields}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={!canSubmitFields}>
          {pendingFields ? "Creating…" : "Create business flow"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export type CreateFlowFormDialogProps = {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
};

export function CreateFlowFormDialog({
  projectId,
  open,
  onOpenChange,
  disabled = false,
}: CreateFlowFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const [actionsFlow, setActionsFlow] = useState<ProjectFlow | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  const handleCreateOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  const handleContinueToActions = useCallback(
    (flow: ProjectFlow) => {
      setActionsFlow(flow);
      onOpenChange(false);
      setActionsOpen(true);
    },
    [onOpenChange]
  );

  const handleActionsOpenChange = useCallback((nextOpen: boolean) => {
    setActionsOpen(nextOpen);
    if (!nextOpen) setActionsFlow(null);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={handleCreateOpenChange}>
        <DialogContent
          className={cn(
            "flex max-h-[min(90dvh,46rem)] flex-col overflow-hidden gap-0",
            FLOW_FORM_DIALOG_WIDTH_CLASS
          )}
          contentClassName="relative flex min-h-0 flex-1 flex-col gap-4 p-4"
          showCloseButton={open && Boolean(pid) && !disabled}
        >
          {open && pid && !disabled ? (
            <CreateFlowFormDialogBody
              key="create-flow-body"
              projectId={pid}
              onOpenChange={handleCreateOpenChange}
              onContinueToActions={handleContinueToActions}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <EditFlowActionFormDialog
        projectId={projectId}
        flow={actionsFlow}
        variant="post"
        open={actionsOpen}
        onOpenChange={handleActionsOpenChange}
      />
    </>
  );
}
