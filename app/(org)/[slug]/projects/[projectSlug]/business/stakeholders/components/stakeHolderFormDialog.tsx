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
import {
  useCreateProjectStakeholder,
  useUpdateProjectStakeholder,
} from "@/hooks/useStakeHolder";
import type { ProjectStakeholder } from "@/lib/api/services/fetchStakeHolder";

import {
  isStakeHolderFormValid,
  StakeHolderFormFields,
  trimStakeHolderFormValues,
  type StakeHolderFormValues,
} from "./stakeHolderFormFields";

const EMPTY_FORM: StakeHolderFormValues = {
  name: "",
  role: "",
  impactArea: "",
  influenceLevel: "medium",
  notes: "",
  isBusinessActor: false,
};

function valuesFromStakeholder(row: ProjectStakeholder): StakeHolderFormValues {
  return {
    name: row.name,
    role: row.role,
    impactArea: row.impactArea,
    influenceLevel: row.influenceLevel,
    notes: row.notes,
    isBusinessActor: row.isBusinessActor,
  };
}

type StakeHolderFormDialogBodyProps = {
  projectId: string;
  stakeholder: ProjectStakeholder | null;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function StakeHolderFormDialogBody({
  projectId,
  stakeholder,
  onOpenChange,
  onRowInteractBusy,
}: StakeHolderFormDialogBodyProps) {
  const isEdit = stakeholder != null;
  const [values, setValues] = useState<StakeHolderFormValues>(() =>
    stakeholder ? valuesFromStakeholder(stakeholder) : EMPTY_FORM
  );

  const createMutation = useCreateProjectStakeholder({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateProjectStakeholder({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const pending = isEdit ? updateMutation.isPending : createMutation.isPending;

  const canSubmit =
    isStakeHolderFormValid(values) && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const body = trimStakeHolderFormValues(values);
    if (isEdit && stakeholder) {
      void updateMutation.mutateAsync({
        projectId,
        stakeholderId: stakeholder.id,
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
          {isEdit ? "Chỉnh sửa stakeholder" : "Thêm stakeholder"}
        </DialogTitle>
        <DialogDescription>
          {isEdit ? (
            <>
              Cập nhật thông tin cho{" "}
              <span className="font-medium text-foreground">
                {stakeholder.name}
              </span>
              .
            </>
          ) : (
            "Ghi nhận bên liên quan, vai trò và mức ảnh hưởng trong dự án."
          )}
        </DialogDescription>
      </DialogHeader>
      <StakeHolderFormFields
        values={values}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        disabled={pending}
        idPrefix={isEdit ? "edit-stakeholder" : "create-stakeholder"}
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
              : "Tạo stakeholder"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export type StakeHolderFormDialogProps = {
  projectId: string | null;
  /** Có `id` → edit; không có → create. */
  stakeholder?: ProjectStakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function StakeHolderFormDialog({
  projectId,
  stakeholder = null,
  open,
  onOpenChange,
  disabled = false,
  onRowInteractBusy,
}: StakeHolderFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const isEdit = Boolean(stakeholder?.id);
  const formKey = isEdit ? stakeholder!.id : "create";

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 sm:max-w-2xl" showCloseButton>
        {open && pid && !disabled ? (
          <StakeHolderFormDialogBody
            key={formKey}
            projectId={pid}
            stakeholder={isEdit ? stakeholder : null}
            onOpenChange={handleOpenChange}
            onRowInteractBusy={onRowInteractBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
