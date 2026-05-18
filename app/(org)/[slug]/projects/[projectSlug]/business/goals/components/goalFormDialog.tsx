"use client";

import { useMemo, useState } from "react";

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
  useCreateProjectGoal,
  useProjectGoals,
  useUpdateProjectGoal,
} from "@/hooks/useGoals";
import type { ProjectGoal } from "@/lib/api/services/fetchGoal";
import { cn } from "@/lib/utils";

import {
  GoalFormFields,
  isGoalFormValid,
  trimGoalFormValues,
  type GoalFormValues,
} from "./goalFormFields";
import { GOAL_FORM_DIALOG_WIDTH_CLASS } from "./goalFormLimits";

const EMPTY_FORM: GoalFormValues = {
  description: "",
  order: 0,
};

function valuesFromGoal(row: ProjectGoal): GoalFormValues {
  return {
    description: row.description,
    order: row.order,
  };
}

function suggestedNextOrder(goals: ProjectGoal[]): number {
  if (goals.length === 0) return 0;
  return Math.max(...goals.map((g) => g.order)) + 1;
}

type GoalFormDialogBodyProps = {
  projectId: string;
  goal: ProjectGoal | null;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function GoalFormDialogBody({
  projectId,
  goal,
  onOpenChange,
  onRowInteractBusy,
}: GoalFormDialogBodyProps) {
  const isEdit = goal != null;
  const { data: goals = [] } = useProjectGoals(projectId, {
    enabled: !isEdit,
  });

  const initialOrder = useMemo(() => {
    if (goal != null) return goal.order;
    return suggestedNextOrder(goals);
  }, [goal, goals]);

  const [values, setValues] = useState<GoalFormValues>(() =>
    goal != null
      ? valuesFromGoal(goal)
      : { ...EMPTY_FORM, order: initialOrder }
  );

  const createMutation = useCreateProjectGoal({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateProjectGoal({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const pending = isEdit ? updateMutation.isPending : createMutation.isPending;
  const canSubmit = isGoalFormValid(values) && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const body = trimGoalFormValues(values);
    if (isEdit && goal) {
      void updateMutation.mutateAsync({
        projectId,
        goalId: goal.id,
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
          {isEdit ? "Chỉnh sửa goal" : "Thêm goal"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Cập nhật mô tả và thứ tự hiển thị của goal."
            : "Mô tả mục tiêu kinh doanh hoặc tiêu chí thành công."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid w-full min-w-0 gap-5 py-4">
        <GoalFormFields
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
          {pending ? "Đang lưu…" : isEdit ? "Lưu" : "Tạo goal"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type GoalFormDialogProps = {
  projectId: string | null;
  goal?: ProjectGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onRowInteractBusy?: (busy: boolean) => void;
};

export function GoalFormDialog({
  projectId,
  goal = null,
  open,
  onOpenChange,
  disabled,
  onRowInteractBusy,
}: GoalFormDialogProps) {
  const pid = projectId?.trim() ?? "";
  const canRender = Boolean(pid) && !disabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(GOAL_FORM_DIALOG_WIDTH_CLASS)}
        showCloseButton
      >
        {canRender && open ? (
          <GoalFormDialogBody
            key={goal?.id ?? "create"}
            projectId={pid}
            goal={goal}
            onOpenChange={onOpenChange}
            onRowInteractBusy={onRowInteractBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
