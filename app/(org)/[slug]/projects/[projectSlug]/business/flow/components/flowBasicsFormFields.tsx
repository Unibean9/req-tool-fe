"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  FLOW_CODE_MAX_CHARS,
  FLOW_DESCRIPTION_MAX_CHARS,
  FLOW_TITLE_MAX_CHARS,
} from "./flowFormLimits";

export type FlowBasicsFormValues = {
  code: string;
  name: string;
  description: string;
};

export const EMPTY_FLOW_BASICS: FlowBasicsFormValues = {
  code: "",
  name: "",
  description: "",
};

export function isFlowBasicsFormValid(values: FlowBasicsFormValues): boolean {
  const code = values.code.trim();
  const name = values.name.trim();
  const description = values.description.trim();
  if (!code || code.length > FLOW_CODE_MAX_CHARS) return false;
  if (!name || name.length > FLOW_TITLE_MAX_CHARS) return false;
  if (!description || description.length > FLOW_DESCRIPTION_MAX_CHARS)
    return false;
  return true;
}

export function trimFlowBasicsFormValues(values: FlowBasicsFormValues) {
  return {
    code: values.code.trim().slice(0, FLOW_CODE_MAX_CHARS),
    name: values.name.trim().slice(0, FLOW_TITLE_MAX_CHARS),
    description: values.description
      .trim()
      .slice(0, FLOW_DESCRIPTION_MAX_CHARS),
  };
}

type FlowBasicsFormFieldsProps = {
  values: FlowBasicsFormValues;
  onChange: (patch: Partial<FlowBasicsFormValues>) => void;
  disabled?: boolean;
  idPrefix: string;
};

export function FlowBasicsFormFields({
  values,
  onChange,
  disabled = false,
  idPrefix,
}: FlowBasicsFormFieldsProps) {
  return (
    <div className="grid w-full min-w-0 gap-5 py-4">
      <div className="grid min-w-0 gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label
            htmlFor={`${idPrefix}-code`}
            className="text-sm font-semibold"
          >
            Mã flow (code)
          </Label>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {values.code.length} / {FLOW_CODE_MAX_CHARS}
          </span>
        </div>
        <Input
          id={`${idPrefix}-code`}
          value={values.code}
          onChange={(e) =>
            onChange({
              code: e.target.value.slice(0, FLOW_CODE_MAX_CHARS),
            })
          }
          disabled={disabled}
          maxLength={FLOW_CODE_MAX_CHARS}
          placeholder="VD: REQ-VAL, ONBOARD-01…"
          autoComplete="off"
          className="h-10 min-w-0 border-border/80 bg-muted/30 font-mono text-sm"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label
            htmlFor={`${idPrefix}-name`}
            className="text-sm font-semibold"
          >
            Tên flow (name)
          </Label>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {values.name.length} / {FLOW_TITLE_MAX_CHARS}
          </span>
        </div>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(e) =>
            onChange({
              name: e.target.value.slice(0, FLOW_TITLE_MAX_CHARS),
            })
          }
          disabled={disabled}
          maxLength={FLOW_TITLE_MAX_CHARS}
          placeholder="VD: User checkout, Onboarding…"
          className="h-10 min-w-0 border-border/80 bg-muted/30"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label
            htmlFor={`${idPrefix}-description`}
            className="text-sm font-semibold"
          >
            Mô tả (description)
          </Label>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {values.description.length} / {FLOW_DESCRIPTION_MAX_CHARS}
          </span>
        </div>
        <Textarea
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(e) =>
            onChange({
              description: e.target.value.slice(0, FLOW_DESCRIPTION_MAX_CHARS),
            })
          }
          disabled={disabled}
          placeholder="Mô tả ngắn gọn luồng nghiệp vụ…"
          rows={5}
          className="min-h-30 min-w-0 resize-y border-border/80 bg-muted/30 text-sm"
        />
      </div>
    </div>
  );
}
