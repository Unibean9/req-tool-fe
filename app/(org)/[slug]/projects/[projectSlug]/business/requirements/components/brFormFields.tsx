"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BR_PRIORITIES } from "@/lib/api/services/fetchBR";
import type { BRPriority } from "@/hooks/useBR";
import { cn } from "@/lib/utils";

export const BR_PRIORITY_FORM_LABELS: Record<BRPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export type BRFormValues = {
  description: string;
  priority: BRPriority;
  is_critical: boolean;
};

export const EMPTY_BR_FORM: BRFormValues = {
  description: "",
  priority: "medium",
  is_critical: false,
};

export function isBRFormValid(values: BRFormValues): boolean {
  return values.description.trim().length > 0;
}

export function trimBRFormValues(values: BRFormValues): BRFormValues {
  return {
    description: values.description.trim(),
    priority: values.priority,
    is_critical: values.is_critical,
  };
}

type BRFormFieldsProps = {
  values: BRFormValues;
  disabled?: boolean;
  descriptionId?: string;
  priorityId?: string;
  onChange: (patch: Partial<BRFormValues>) => void;
};

export function BRFormFields({
  values,
  disabled,
  descriptionId = "br-description",
  priorityId = "br-priority",
  onChange,
}: BRFormFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={descriptionId}>Description</Label>
        <Textarea
          id={descriptionId}
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={disabled}
          placeholder="e.g. The system must allow users to register with their email..."
          className="min-h-28"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={priorityId}>Priority</Label>
          <Select
            value={values.priority}
            onValueChange={(priority) =>
              onChange({ priority: priority as BRPriority })
            }
            disabled={disabled}
          >
            <SelectTrigger id={priorityId}>
              <SelectValue>
                {BR_PRIORITY_FORM_LABELS[values.priority]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {BR_PRIORITIES.map((p) => (
                <SelectItem
                  key={p}
                  value={p}
                  label={BR_PRIORITY_FORM_LABELS[p]}
                >
                  {BR_PRIORITY_FORM_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Critical requirement</Label>
          <div className="flex h-9 gap-0 overflow-hidden rounded-md border border-border/80">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ is_critical: true })}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                values.is_critical
                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-200"
                  : "text-muted-foreground hover:bg-muted/50",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              <span
                className={cn(
                  "size-3.5 rounded-full border-2",
                  values.is_critical
                    ? "border-rose-600 bg-rose-600 dark:border-rose-300 dark:bg-rose-300"
                    : "border-muted-foreground"
                )}
              />
              Yes
            </button>
            <div className="w-px bg-border/80" />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ is_critical: false })}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                !values.is_critical
                  ? "bg-muted/50 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              <span
                className={cn(
                  "size-3.5 rounded-full border-2",
                  !values.is_critical
                    ? "border-foreground bg-foreground"
                    : "border-muted-foreground"
                )}
              />
              No
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
