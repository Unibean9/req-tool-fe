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
  useCreateProjectOutOfScope,
  useUpdateProjectOutOfScope,
  type OutOfScopeItem,
} from "@/hooks/useOutOfScope";
import { cn } from "@/lib/utils";

import {
  EMPTY_OUT_OF_SCOPE_FORM,
  isOutOfScopeFormValid,
  OutOfScopeFormFields,
  trimOutOfScopeFormValues,
  type OutOfScopeFormValues,
} from "./outOfScopeFormFields";
import { OUT_OF_SCOPE_FORM_DIALOG_WIDTH_CLASS } from "./outOfScopeFormLimits";

function valuesFromItem(item: OutOfScopeItem): OutOfScopeFormValues {
  return {
    category: item.category,
    description: item.description,
    order: item.order,
  };
}

type OutOfScopeFormDialogBodyProps = {
  projectId: string;
  item: OutOfScopeItem | null;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function OutOfScopeFormDialogBody({
  projectId,
  item,
  onOpenChange,
  onRowInteractBusy,
}: OutOfScopeFormDialogBodyProps) {
  const isEdit = item != null;
  const [values, setValues] = useState<OutOfScopeFormValues>(() =>
    item != null ? valuesFromItem(item) : EMPTY_OUT_OF_SCOPE_FORM
  );

  const createMutation = useCreateProjectOutOfScope({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateProjectOutOfScope({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const pending = isEdit ? updateMutation.isPending : createMutation.isPending;
  const canSubmit = isOutOfScopeFormValid(values) && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    const body = trimOutOfScopeFormValues(values);
    if (isEdit && item) {
      void updateMutation.mutateAsync({
        projectId,
        itemId: item.id,
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
          {isEdit ? "Chỉnh sửa out-of-scope" : "Thêm out-of-scope"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Cập nhật category hoặc mô tả mục nằm ngoài phạm vi dự án."
            : "Ghi lại những gì không nằm trong phạm vi dự án để tránh scope creep."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 py-4">
        <OutOfScopeFormFields
          values={values}
          disabled={pending}
          descriptionId={isEdit ? "edit-out-of-scope-description" : undefined}
          categoryId={isEdit ? "edit-out-of-scope-category" : undefined}
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
          {pending ? "Đang lưu..." : isEdit ? "Lưu" : "Tạo mục"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type OutOfScopeFormDialogProps = {
  projectId: string | null;
  item?: OutOfScopeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function OutOfScopeFormDialog({
  projectId,
  item = null,
  open,
  onOpenChange,
  disabled,
  onRowInteractBusy,
}: OutOfScopeFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const canRender = Boolean(pid) && !disabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(OUT_OF_SCOPE_FORM_DIALOG_WIDTH_CLASS)}
        showCloseButton
      >
        {canRender && open ? (
          <OutOfScopeFormDialogBody
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
