"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  FLOW_CODE_MAX_CHARS,
  FLOW_DESCRIPTION_MAX_CHARS,
  FLOW_MAX_STEPS,
  FLOW_STEP_MAX_CHARS,
  FLOW_STEPS_SCROLL_HEIGHT_CLASS,
  FLOW_TITLE_MAX_CHARS,
} from "./flowFormLimits";
import {
  parseFlowSteps,
  serializeFlowSteps,
} from "../utils/flowSteps";

export type FlowFormValues = {
  code: string;
  name: string;
  steps: string[];
};

export function trimFlowFormValues(values: FlowFormValues) {
  return {
    code: values.code.trim().slice(0, FLOW_CODE_MAX_CHARS),
    name: values.name.trim().slice(0, FLOW_TITLE_MAX_CHARS),
    description: serializeFlowSteps(values.steps).slice(
      0,
      FLOW_DESCRIPTION_MAX_CHARS
    ),
  };
}

export function isFlowFormValid(values: FlowFormValues): boolean {
  const code = values.code.trim();
  const name = values.name.trim();
  const steps = values.steps.map((s) => s.trim()).filter(Boolean);
  const description = serializeFlowSteps(values.steps);
  if (!code || code.length > FLOW_CODE_MAX_CHARS) return false;
  if (!name || name.length > FLOW_TITLE_MAX_CHARS) return false;
  if (steps.length === 0) return false;
  if (description.length > FLOW_DESCRIPTION_MAX_CHARS) return false;
  if (steps.some((s) => s.length > FLOW_STEP_MAX_CHARS)) return false;
  return true;
}

type FlowFormFieldsProps = {
  values: FlowFormValues;
  onChange: (patch: Partial<FlowFormValues>) => void;
  disabled?: boolean;
  idPrefix: string;
};

export function FlowFormFields({
  values,
  onChange,
  disabled = false,
  idPrefix,
}: FlowFormFieldsProps) {
  const canAddStep = values.steps.length < FLOW_MAX_STEPS && !disabled;
  const stepsScrollRef = useRef<HTMLDivElement>(null);
  const prevStepCountRef = useRef(values.steps.length);

  function updateStep(index: number, text: string) {
    const next = [...values.steps];
    next[index] = text;
    onChange({ steps: next });
  }

  function removeStep(index: number) {
    if (values.steps.length <= 1) {
      onChange({ steps: [""] });
      return;
    }
    onChange({ steps: values.steps.filter((_, i) => i !== index) });
  }

  function addStep() {
    if (!canAddStep) return;
    onChange({ steps: [...values.steps, ""] });
  }

  useEffect(() => {
    const prev = prevStepCountRef.current;
    prevStepCountRef.current = values.steps.length;
    if (values.steps.length <= prev) return;
    const el = stepsScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [values.steps.length]);

  return (
    <div className="grid w-full min-w-0 gap-5 py-4">
      <div className="grid min-w-0 gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={`${idPrefix}-code`} className="text-sm font-semibold">
            Mã flow (code)
          </Label>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {values.code.length} / {FLOW_CODE_MAX_CHARS}
          </span>
        </div>
        <Input
          id={`${idPrefix}-code`}
          value={values.code}
          onChange={(e) => onChange({ code: e.target.value })}
          disabled={disabled}
          maxLength={FLOW_CODE_MAX_CHARS}
          placeholder="E.g.: REQ-VAL, ONBOARD-01…"
          autoComplete="off"
          className="h-10 min-w-0 border-border/80 bg-muted/30 font-mono text-sm"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={`${idPrefix}-name`} className="text-sm font-semibold">
            Name
          </Label>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {values.name.length} / {FLOW_TITLE_MAX_CHARS}
          </span>
        </div>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={disabled}
          maxLength={FLOW_TITLE_MAX_CHARS}
          placeholder="E.g.: User checkout, Onboarding…"
          className="h-10 min-w-0 border-border/80 bg-muted/30"
        />
      </div>

      <fieldset className="grid w-full min-w-0 gap-3 rounded-xl border border-border/70 bg-muted/15 p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">
          Steps
        </legend>
        <div
          ref={stepsScrollRef}
          className={cn(
            "w-full min-w-0 overflow-y-auto overscroll-y-contain",
            "[-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden",
            FLOW_STEPS_SCROLL_HEIGHT_CLASS
          )}
        >
          <ol className="list-none space-y-0">
            {values.steps.map((step, index) => (
              <li key={index}>
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex size-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground tabular-nums"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <Input
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      disabled={disabled}
                      maxLength={FLOW_STEP_MAX_CHARS}
                      placeholder="Step name…"
                      aria-label={`Step ${index + 1}`}
                      className="h-10 min-w-0 flex-1 border-border/80 bg-background/70 text-sm shadow-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-10 shrink-0 text-muted-foreground"
                      disabled={disabled || values.steps.length <= 1}
                      aria-label={`Remove step ${index + 1}`}
                      onClick={() => removeStep(index)}
                    >
                      <X className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                {index < values.steps.length - 1 ? (
                  <div className="flex py-1" aria-hidden>
                    <div className="flex w-7 shrink-0 justify-center">
                      <div className="flex flex-col items-center text-muted-foreground/70">
                        <span className="h-1.5 w-0 border-l border-dashed border-border" />
                        <ChevronDown className="size-4 shrink-0" />
                        <span className="h-1.5 w-0 border-l border-dashed border-border" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full gap-1.5 border-dashed"
          disabled={!canAddStep}
          onClick={addStep}
        >
          <Plus className="size-4" aria-hidden />
          Add step
        </Button>
      </fieldset>
    </div>
  );
}

export function FlowStepsPreview({
  description,
  className,
  compact = false,
}: {
  description: string;
  className?: string;
  compact?: boolean;
}) {
  const steps = parseFlowSteps(description).filter(Boolean);
  if (steps.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        compact && "gap-1",
        className
      )}
    >
      {steps.map((step, index) => (
        <span key={`${step}-${index}`} className="inline-flex items-center gap-1.5">
          {index > 0 ? (
            <span
              className={cn(
                "shrink-0 font-medium text-muted-foreground",
                compact ? "text-xs" : "text-sm"
              )}
              aria-hidden
            >
              →
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex max-w-full rounded-md border border-border/80 bg-muted/50 text-foreground/90",
              compact ? "px-1.5 py-0.5 text-[11px] leading-snug" : "px-2 py-1 text-xs leading-snug"
            )}
          >
            {step}
          </span>
        </span>
      ))}
    </div>
  );
}
