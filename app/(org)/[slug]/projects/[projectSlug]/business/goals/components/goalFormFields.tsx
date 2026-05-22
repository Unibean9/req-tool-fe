"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IsoDatePicker } from "@/components/ui/isoDatePicker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProjectGoalPriority,
  ProjectGoalWriteRequest,
} from "@/lib/api/services/fetchGoal";

import {
  GOAL_DESCRIPTION_MAX_CHARS,
  GOAL_ORDER_MAX,
  GOAL_ORDER_MIN,
} from "./goalFormLimits";

export type GoalFormValues = {
  description: string;
  order: number;
  priority: ProjectGoalPriority;
  successMetric: string;
  targetDate: string;
  objectives: string[];
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

export function trimGoalFormValues(
  values: GoalFormValues
): ProjectGoalWriteRequest {
  return {
    description: values.description.trim().slice(0, GOAL_DESCRIPTION_MAX_CHARS),
    order: clampGoalOrder(values.order),
    priority: values.priority,
    successMetric: values.successMetric.trim(),
    targetDate: values.targetDate,
    objectives: values.objectives.filter((o) => o.trim().length > 0),
  };
}

const PRIORITY_OPTIONS: { value: ProjectGoalPriority; label: string }[] = [
  { value: "high", label: "Cao" },
  { value: "medium", label: "Trung bình" },
  { value: "low", label: "Thấp" },
];

const SUCCESS_METRIC_MAX_CHARS = 300;
const OBJECTIVE_MAX_CHARS = 200;

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
  function updateObjective(index: number, text: string) {
    const next = [...values.objectives];
    next[index] = text.slice(0, OBJECTIVE_MAX_CHARS);
    onChange({ objectives: next });
  }

  function removeObjective(index: number) {
    onChange({ objectives: values.objectives.filter((_, i) => i !== index) });
  }

  function addObjective() {
    onChange({ objectives: [...values.objectives, ""] });
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      {/* ── Left column ── */}
      <div className="flex flex-col gap-4">
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
            className="min-h-24 text-sm"
            onChange={(e) =>
              onChange({
                description: e.target.value.slice(0, GOAL_DESCRIPTION_MAX_CHARS),
              })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="goal-priority">Mức ưu tiên</Label>
          <Select
            value={values.priority}
            onValueChange={(v) =>
              onChange({ priority: v as ProjectGoalPriority })
            }
            disabled={disabled}
          >
            <SelectTrigger id="goal-priority" className="text-sm">
              <SelectValue placeholder="Chọn mức ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="goal-success-metric">Tiêu chí thành công</Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {values.successMetric.length} / {SUCCESS_METRIC_MAX_CHARS}
            </span>
          </div>
          <Textarea
            id="goal-success-metric"
            value={values.successMetric}
            maxLength={SUCCESS_METRIC_MAX_CHARS}
            disabled={disabled}
            placeholder="Làm thế nào để biết goal này đạt được?…"
            rows={3}
            className="min-h-20 text-sm"
            onChange={(e) =>
              onChange({
                successMetric: e.target.value.slice(0, SUCCESS_METRIC_MAX_CHARS),
              })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="goal-target-date">Ngày mục tiêu</Label>
          <IsoDatePicker
            id="goal-target-date"
            value={values.targetDate}
            disabled={disabled}
            placeholder="Chọn ngày mục tiêu"
            onChange={(iso) => onChange({ targetDate: iso })}
          />
        </div>
      </div>

      {/* ── Right column — Mục tiêu ── */}
      <div className="flex flex-col gap-2">
        <Label>Mục tiêu</Label>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {values.objectives.length === 0 && (
            <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted-foreground">
              Chưa có mục tiêu nào.
            </p>
          )}

          {values.objectives.map((obj, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Input
                value={obj}
                maxLength={OBJECTIVE_MAX_CHARS}
                disabled={disabled}
                placeholder={`Mục tiêu ${i + 1}…`}
                className="h-8 text-sm"
                onChange={(e) => updateObjective(i, e.target.value)}
              />
              <button
                type="button"
                disabled={disabled}
                aria-label="Xóa mục tiêu"
                onClick={() => removeObjective(i)}
                className="mt-1 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="mt-1 w-full gap-1.5 text-xs"
          onClick={addObjective}
        >
          <Plus className="size-3.5" aria-hidden />
          Thêm mục tiêu
        </Button>
      </div>
    </div>
  );
}
