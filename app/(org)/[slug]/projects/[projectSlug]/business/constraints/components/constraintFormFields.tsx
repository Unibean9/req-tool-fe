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
import {
  CONSTRAINT_SEVERITIES,
  CONSTRAINT_TYPES,
} from "@/lib/api/services/fetchConstraint";
import type {
  ConstraintSeverity,
  ConstraintType,
} from "@/lib/api/services/fetchConstraint";

export const CONSTRAINT_TYPE_LABELS: Record<ConstraintType, string> = {
  budget: "Budget",
  timeline: "Timeline",
  technical: "Technical",
  resource: "Resource",
  regulatory: "Regulatory",
  risk: "Risk",
};

export const CONSTRAINT_SEVERITY_LABELS: Record<ConstraintSeverity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export type ConstraintFormValues = {
  type: ConstraintType;
  description: string;
  severity: ConstraintSeverity;
};

export const EMPTY_CONSTRAINT_FORM: ConstraintFormValues = {
  type: "budget",
  description: "",
  severity: "medium",
};

export function isConstraintFormValid(values: ConstraintFormValues): boolean {
  return values.description.trim().length > 0;
}

export function trimConstraintFormValues(
  values: ConstraintFormValues
): ConstraintFormValues {
  return {
    type: values.type,
    description: values.description.trim(),
    severity: values.severity,
  };
}

type ConstraintFormFieldsProps = {
  values: ConstraintFormValues;
  disabled?: boolean;
  descriptionId?: string;
  typeId?: string;
  severityId?: string;
  onChange: (patch: Partial<ConstraintFormValues>) => void;
};

export function ConstraintFormFields({
  values,
  disabled,
  descriptionId = "constraint-description",
  typeId = "constraint-type",
  severityId = "constraint-severity",
  onChange,
}: ConstraintFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={typeId}>Type</Label>
          <Select
            value={values.type}
            onValueChange={(type) => onChange({ type: type as ConstraintType })}
            disabled={disabled}
          >
            <SelectTrigger id={typeId}>
              <SelectValue>{CONSTRAINT_TYPE_LABELS[values.type]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CONSTRAINT_TYPES.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  label={CONSTRAINT_TYPE_LABELS[type]}
                >
                  {CONSTRAINT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={severityId}>Severity</Label>
          <Select
            value={values.severity}
            onValueChange={(severity) =>
              onChange({ severity: severity as ConstraintSeverity })
            }
            disabled={disabled}
          >
            <SelectTrigger id={severityId}>
              <SelectValue>
                {CONSTRAINT_SEVERITY_LABELS[values.severity]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CONSTRAINT_SEVERITIES.map((severity) => (
                <SelectItem
                  key={severity}
                  value={severity}
                  label={CONSTRAINT_SEVERITY_LABELS[severity]}
                >
                  {CONSTRAINT_SEVERITY_LABELS[severity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={descriptionId}>Description</Label>
        <Textarea
          id={descriptionId}
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={disabled}
          placeholder="e.g. Deployment budget must not exceed $200,000..."
          className="min-h-28"
        />
      </div>
    </>
  );
}
