"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectRuleWriteRequest } from "@/lib/api/services/fetchRule";

import {
  RULE_DESCRIPTION_MAX_CHARS,
  RULE_LINKED_FEATURE_ID_MAX_CHARS,
} from "./ruleFormLimits";
import { RuleLinkedFeatureSelect } from "./ruleLinkedFeatureSelect";

export type RuleFormValues = {
  description: string;
  linkedFeatureId: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeLinkedFeatureIdInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, RULE_LINKED_FEATURE_ID_MAX_CHARS);
}

export function isLinkedFeatureIdValid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return UUID_RE.test(trimmed);
}

export function isRuleFormValid(values: RuleFormValues): boolean {
  return (
    values.description.trim().length > 0 &&
    isLinkedFeatureIdValid(values.linkedFeatureId)
  );
}

export function trimRuleFormValues(values: RuleFormValues): ProjectRuleWriteRequest {
  return {
    description: values.description.trim().slice(0, RULE_DESCRIPTION_MAX_CHARS),
    linkedFeatureId: normalizeLinkedFeatureIdInput(values.linkedFeatureId),
  };
}

type RuleFormFieldsProps = {
  projectId: string;
  values: RuleFormValues;
  onChange: (patch: Partial<RuleFormValues>) => void;
  disabled?: boolean;
};

export function RuleFormFields({
  projectId,
  values,
  onChange,
  disabled,
}: RuleFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="rule-description">Mô tả rule</Label>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {values.description.length} / {RULE_DESCRIPTION_MAX_CHARS}
          </span>
        </div>
        <Textarea
          id="rule-description"
          value={values.description}
          maxLength={RULE_DESCRIPTION_MAX_CHARS}
          disabled={disabled}
          placeholder="Quy tắc nghiệp vụ hoặc ràng buộc…"
          rows={4}
          className="min-h-[6rem] resize-y text-sm"
          onChange={(e) =>
            onChange({
              description: e.target.value.slice(0, RULE_DESCRIPTION_MAX_CHARS),
            })
          }
        />
      </div>

      <RuleLinkedFeatureSelect
        projectId={projectId}
        value={values.linkedFeatureId}
        disabled={disabled}
        onChange={(linkedFeatureId) => onChange({ linkedFeatureId })}
      />
    </div>
  );
}
