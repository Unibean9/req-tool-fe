"use client";

import { useState } from "react";

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
  useCreateProjectConstraint,
  useUpdateProjectConstraint,
  type ProjectConstraint,
} from "@/hooks/useConstraint";
import { cn } from "@/lib/utils";

import {
  ConstraintFormFields,
  EMPTY_CONSTRAINT_FORM,
  isConstraintFormValid,
  trimConstraintFormValues,
  type ConstraintFormValues,
} from "./constraintFormFields";
import { CONSTRAINT_FORM_DIALOG_WIDTH_CLASS } from "./constraintFormLimits";

function valuesFromConstraint(row: ProjectConstraint): ConstraintFormValues {
  return {
    type: row.type,
    description: row.description,
    severity: row.severity,
  };
}

type ConstraintFormDialogBodyProps = {
  projectId: string;
  constraint: ProjectConstraint | null;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function ConstraintFormDialogBody({
  projectId,
  constraint,
  onOpenChange,
  onRowInteractBusy,
}: ConstraintFormDialogBodyProps) {
  const isEdit = constraint != null;
  const [values, setValues] = useState<ConstraintFormValues>(() =>
    constraint != null ? valuesFromConstraint(constraint) : EMPTY_CONSTRAINT_FORM
  );

  const createMutation = useCreateProjectConstraint({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateProjectConstraint({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const pending = isEdit ? updateMutation.isPending : createMutation.isPending;
  const canSubmit = isConstraintFormValid(values) && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    const body = trimConstraintFormValues(values);
    if (isEdit && constraint) {
      void updateMutation.mutateAsync({
        projectId,
        constraintId: constraint.id,
        body,
      });
      return;
    }

    void createMutation.mutateAsync({ projectId, body });
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-lg">
          {isEdit ? "Edit constraint" : "Add constraint"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the type, severity, or description of the constraint."
            : "Record an important constraint to help the team manage scope, deadlines, and resources."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 py-4">
        <ConstraintFormFields
          values={values}
          disabled={pending}
          descriptionId={isEdit ? "edit-constraint-description" : undefined}
          typeId={isEdit ? "edit-constraint-type" : undefined}
          severityId={isEdit ? "edit-constraint-severity" : undefined}
          onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        />
      </div>

      <DialogFooter className="mt-2 gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => onOpenChange(false)}
        >
          Hủy
        </Button>
        <Button type="submit" className="font-semibold" disabled={!canSubmit}>
          {pending ? "Saving…" : isEdit ? "Lưu" : "Create constraint"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type ConstraintFormDialogProps = {
  projectId: string | null;
  constraint?: ProjectConstraint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function ConstraintFormDialog({
  projectId,
  constraint = null,
  open,
  onOpenChange,
  disabled,
  onRowInteractBusy,
}: ConstraintFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const canRender = Boolean(pid) && !disabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(CONSTRAINT_FORM_DIALOG_WIDTH_CLASS)}
        showCloseButton
      >
        {canRender && open ? (
          <ConstraintFormDialogBody
            key={constraint?.id ?? "create"}
            projectId={pid}
            constraint={constraint}
            onOpenChange={onOpenChange}
            onRowInteractBusy={onRowInteractBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
