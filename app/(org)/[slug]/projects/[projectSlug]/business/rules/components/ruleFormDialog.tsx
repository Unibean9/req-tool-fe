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
  useCreateProjectRule,
  useUpdateProjectRule,
} from "@/hooks/useRule";
import type { ProjectRule } from "@/lib/api/services/fetchRule";
import { cn } from "@/lib/utils";

import {
  RuleFormFields,
  isRuleFormValid,
  trimRuleFormValues,
  type RuleFormValues,
} from "./ruleFormFields";
import { RULE_FORM_DIALOG_WIDTH_CLASS } from "./ruleFormLimits";

const EMPTY_FORM: RuleFormValues = {
  ruleDef: "",
  type: "constraint",
  isDynamic: false,
  source: "",
};

function valuesFromRule(row: ProjectRule): RuleFormValues {
  return {
    ruleDef: row.ruleDef,
    type: row.type,
    isDynamic: row.isDynamic,
    source: row.source,
  };
}

type RuleFormDialogBodyProps = {
  projectId: string;
  rule: ProjectRule | null;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function RuleFormDialogBody({
  projectId,
  rule,
  onOpenChange,
  onRowInteractBusy,
}: RuleFormDialogBodyProps) {
  const isEdit = rule != null;
  const [values, setValues] = useState<RuleFormValues>(() =>
    rule != null ? valuesFromRule(rule) : EMPTY_FORM
  );

  const createMutation = useCreateProjectRule({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateProjectRule({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const pending = isEdit ? updateMutation.isPending : createMutation.isPending;
  const canSubmit = isRuleFormValid(values) && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const body = trimRuleFormValues(values);
    if (isEdit && rule) {
      void updateMutation.mutateAsync({
        projectId,
        ruleId: rule.id,
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
          {isEdit ? "Chỉnh sửa rule" : "Thêm rule"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Cập nhật định nghĩa, loại, trạng thái dynamic và nguồn của rule."
            : "Ghi nhận quy tắc nghiệp vụ, ràng buộc hoặc chính sách của dự án."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid w-full min-w-0 gap-5 py-4">
        <RuleFormFields
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
          Hủy
        </Button>
        <Button type="submit" className="font-semibold" disabled={!canSubmit}>
          {pending ? "Đang lưu…" : isEdit ? "Lưu" : "Tạo rule"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type RuleFormDialogProps = {
  projectId: string | null;
  rule?: ProjectRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function RuleFormDialog({
  projectId,
  rule = null,
  open,
  onOpenChange,
  disabled,
  onRowInteractBusy,
}: RuleFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const canRender = Boolean(pid) && !disabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(RULE_FORM_DIALOG_WIDTH_CLASS)}
        showCloseButton
      >
        {canRender && open ? (
          <RuleFormDialogBody
            key={rule?.id ?? "create"}
            projectId={pid}
            rule={rule}
            onOpenChange={onOpenChange}
            onRowInteractBusy={onRowInteractBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
