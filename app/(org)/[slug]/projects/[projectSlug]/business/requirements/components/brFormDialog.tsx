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
  useCreateProjectBR,
  useUpdateProjectBR,
  type BusinessRequirement,
} from "@/hooks/useBR";
import { cn } from "@/lib/utils";

import {
  EMPTY_BR_FORM,
  isBRFormValid,
  BRFormFields,
  trimBRFormValues,
  type BRFormValues,
} from "./brFormFields";
import { BR_FORM_DIALOG_WIDTH_CLASS } from "./brFormLimits";

function valuesFromItem(item: BusinessRequirement): BRFormValues {
  return {
    description: item.description,
    priority: item.priority,
    is_critical: item.isCritical,
  };
}

type BRFormDialogBodyProps = {
  projectId: string;
  item: BusinessRequirement | null;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function BRFormDialogBody({
  projectId,
  item,
  onOpenChange,
  onRowInteractBusy,
}: BRFormDialogBodyProps) {
  const isEdit = item != null;
  const [values, setValues] = useState<BRFormValues>(() =>
    item != null ? valuesFromItem(item) : EMPTY_BR_FORM
  );

  const createMutation = useCreateProjectBR({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateProjectBR({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const pending = isEdit ? updateMutation.isPending : createMutation.isPending;
  const canSubmit = isBRFormValid(values) && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    const body = trimBRFormValues(values);
    if (isEdit && item) {
      void updateMutation.mutateAsync({
        projectId,
        brId: item.id,
        body,
      });
      return;
    }

    void createMutation.mutateAsync({ projectId, item: body });
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-lg">
          {isEdit ? "Edit business requirement" : "Add business requirement"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the description, priority, or criticality."
            : "Document a core business requirement for the project."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 py-4">
        <BRFormFields
          values={values}
          disabled={pending}
          descriptionId={isEdit ? "edit-br-description" : undefined}
          priorityId={isEdit ? "edit-br-priority" : undefined}
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
          Cancel
        </Button>
        <Button type="submit" className="font-semibold" disabled={!canSubmit}>
          {pending ? "Saving…" : isEdit ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type BRFormDialogProps = {
  projectId: string | null;
  item?: BusinessRequirement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function BRFormDialog({
  projectId,
  item = null,
  open,
  onOpenChange,
  disabled,
  onRowInteractBusy,
}: BRFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const canRender = Boolean(pid) && !disabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(BR_FORM_DIALOG_WIDTH_CLASS)}
        showCloseButton
      >
        {canRender && open ? (
          <BRFormDialogBody
            key={item?.id ?? "create"}
            projectId={pid}
            item={item}
            onOpenChange={onOpenChange}
            onRowInteractBusy={onRowInteractBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
