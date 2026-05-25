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
  useCreateProjectNfr,
  useUpdateProjectNfr,
} from "@/hooks/useNfr";
import type { ProjectNfr } from "@/lib/api/services/fetchNfr";
import { cn } from "@/lib/utils";

import {
  NfrFormFields,
  isNfrFormValid,
  trimNfrFormValues,
  type NfrFormValues,
} from "./nfrFormFields";
import { NFR_FORM_DIALOG_WIDTH_CLASS } from "./nfrFormLimits";

const EMPTY_FORM: NfrFormValues = {
  category: "performance",
  description: "",
  priority: "medium",
  featureIds: [],
};

function valuesFromNfr(row: ProjectNfr): NfrFormValues {
  return {
    category: row.category,
    description: row.description,
    priority: row.priority,
    featureIds: row.featureIds ?? [],
  };
}

type NfrFormDialogBodyProps = {
  projectId: string;
  nfr: ProjectNfr | null;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function NfrFormDialogBody({
  projectId,
  nfr,
  onOpenChange,
  onRowInteractBusy,
}: NfrFormDialogBodyProps) {
  const isEdit = nfr != null;
  const [values, setValues] = useState<NfrFormValues>(() =>
    nfr != null ? valuesFromNfr(nfr) : EMPTY_FORM
  );

  const createMutation = useCreateProjectNfr({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateProjectNfr({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const pending = isEdit ? updateMutation.isPending : createMutation.isPending;
  const canSubmit = isNfrFormValid(values) && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const body = trimNfrFormValues(values);
    if (isEdit && nfr) {
      void updateMutation.mutateAsync({
        projectId,
        nfrId: nfr.id,
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
          {isEdit ? "Edit NFR" : "Add NFR"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the category, priority, description, and linked features."
            : "Record a NFR (performance, security, …) for the project."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid w-full min-w-0 gap-5 py-4">
        <NfrFormFields
          projectId={projectId}
          values={values}
          disabled={pending}
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
          {pending ? "Saving…" : isEdit ? "Save" : "Create NFR"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type NfrFormDialogProps = {
  projectId: string | null;
  nfr?: ProjectNfr | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function NfrFormDialog({
  projectId,
  nfr = null,
  open,
  onOpenChange,
  disabled,
  onRowInteractBusy,
}: NfrFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const canRender = Boolean(pid) && !disabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(NFR_FORM_DIALOG_WIDTH_CLASS)}
        showCloseButton
      >
        {canRender && open ? (
          <NfrFormDialogBody
            key={nfr?.id ?? "create"}
            projectId={pid}
            nfr={nfr}
            onOpenChange={onOpenChange}
            onRowInteractBusy={onRowInteractBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
