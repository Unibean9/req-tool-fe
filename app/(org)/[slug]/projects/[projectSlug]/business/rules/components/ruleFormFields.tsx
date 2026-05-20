"use client";

import { Input } from "@/components/ui/input";
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
  PROJECT_RULE_TYPES,
  type ProjectRuleType,
  type ProjectRuleWriteRequest,
} from "@/lib/api/services/fetchRule";

import {
  RULE_DEF_MAX_CHARS,
  RULE_SOURCE_MAX_CHARS,
} from "./ruleFormLimits";

export type RuleFormValues = {
  ruleDef: string;
  type: ProjectRuleType;
  isDynamic: boolean;
  source: string;
};

const RULE_TYPE_LABELS: Record<ProjectRuleType, string> = {
  constraint: "Constraint",
  calculation: "Calculation",
  validation: "Validation",
  process: "Process",
  policy: "Policy",
  regulation: "Regulation",
};

export function isRuleFormValid(values: RuleFormValues): boolean {
  return values.ruleDef.trim().length > 0;
}

export function trimRuleFormValues(values: RuleFormValues): ProjectRuleWriteRequest {
  return {
    ruleDef: values.ruleDef.trim().slice(0, RULE_DEF_MAX_CHARS),
    type: values.type,
    isDynamic: values.isDynamic,
    source: values.source.trim().slice(0, RULE_SOURCE_MAX_CHARS),
  };
}

type RuleFormFieldsProps = {
  values: RuleFormValues;
  onChange: (patch: Partial<RuleFormValues>) => void;
  disabled?: boolean;
};

export function RuleFormFields({
  values,
  onChange,
  disabled,
}: RuleFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="rule-def">Rule definition</Label>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {values.ruleDef.length} / {RULE_DEF_MAX_CHARS}
          </span>
        </div>
        <Textarea
          id="rule-def"
          value={values.ruleDef}
          maxLength={RULE_DEF_MAX_CHARS}
          disabled={disabled}
          placeholder="VD: Không cho phép tạo yêu cầu nếu thiếu actor chính…"
          rows={4}
          className="min-h-24 resize-y text-sm"
          onChange={(e) =>
            onChange({
              ruleDef: e.target.value.slice(0, RULE_DEF_MAX_CHARS),
            })
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="rule-type">Type</Label>
          <Select
            value={values.type}
            disabled={disabled}
            onValueChange={(type) => onChange({ type: type as ProjectRuleType })}
          >
            <SelectTrigger id="rule-type" className="w-full">
              <SelectValue placeholder="Chọn loại rule" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_RULE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {RULE_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="rule-dynamic">Dynamic</Label>
          <Select
            value={values.isDynamic ? "true" : "false"}
            disabled={disabled}
            onValueChange={(value) => onChange({ isDynamic: value === "true" })}
          >
            <SelectTrigger id="rule-dynamic" className="w-full">
              <SelectValue placeholder="Chọn dynamic">
                {values.isDynamic ? "Dynamic" : "Static"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false" label="Static">
                Static
              </SelectItem>
              <SelectItem value="true" label="Dynamic">
                Dynamic
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="rule-source">Source</Label>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {values.source.length} / {RULE_SOURCE_MAX_CHARS}
          </span>
        </div>
        <Input
          id="rule-source"
          value={values.source}
          maxLength={RULE_SOURCE_MAX_CHARS}
          disabled={disabled}
          placeholder="VD: Product owner, compliance, stakeholder…"
          className="text-sm"
          onChange={(e) =>
            onChange({
              source: e.target.value.slice(0, RULE_SOURCE_MAX_CHARS),
            })
          }
        />
      </div>
    </div>
  );
}
