"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectGoalWriteRequest } from "@/lib/api/services/fetchGoal";

import {
  GOAL_DESCRIPTION_MAX_CHARS,
  GOAL_ORDER_MAX,
  GOAL_ORDER_MIN,
} from "./goalFormLimits";

export type GoalFormValues = {
  description: string;
  order: number;
};

export function clampGoalOrder(value: number): number {
  if (!Number.isFinite(value)) return GOAL_ORDER_MIN;
  return Math.min(
    GOAL_ORDER_MAX,
    Math.max(GOAL_ORDER_MIN, Math.round(value))
  );
}

export function isGoalFormValid(values: GoalFormValues): boolean {
  return values.description.trim().length > 0;
}

export function trimGoalFormValues(values: GoalFormValues): ProjectGoalWriteRequest {
  return {
    description: values.description.trim().slice(0, GOAL_DESCRIPTION_MAX_CHARS),
    order: clampGoalOrder(values.order),
  };
}

type GoalFormFieldsProps = {
  values: GoalFormValues;
  onChange: (patch: Partial<GoalFormValues>) => void;
  disabled?: boolean;
};

export function GoalFormFields({
  values,
  onChange,
  disabled,
}: GoalFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="goal-description">Mô tả</Label>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {values.description.length} / {GOAL_DESCRIPTION_MAX_CHARS}
          </span>
        </div>
        <Textarea
          id="goal-description"
          value={values.description}
          maxLength={GOAL_DESCRIPTION_MAX_CHARS}
          disabled={disabled}
          placeholder="Mục tiêu kinh doanh hoặc tiêu chí thành công…"
          rows={4}
          className="min-h-[6rem] text-sm"
          onChange={(e) =>
            onChange({
              description: e.target.value.slice(0, GOAL_DESCRIPTION_MAX_CHARS),
            })
          }
        />
      </div>
    </div>
  );
}
