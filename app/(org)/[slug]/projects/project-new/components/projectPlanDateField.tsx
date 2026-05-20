"use client";

import { useMemo } from "react";

import { Label } from "@/components/ui/label";
import { IsoDatePicker } from "@/components/ui/isoDatePicker";
import { parseProjectIsoDate, startOfTodayLocal } from "@/lib/project/projectDisplay";
import { cn } from "@/lib/utils";

import { ProjectNewFieldError } from "./projectNewFieldError";

type ProjectPlanDateFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  minIso?: string;
  disabled?: boolean;
  error?: string;
  showError?: boolean;
};

export function ProjectPlanDateField({
  id,
  label,
  value,
  onChange,
  minIso,
  disabled,
  error,
  showError = false,
}: ProjectPlanDateFieldProps) {
  const minDate = useMemo(() => {
    if (minIso?.trim()) {
      return parseProjectIsoDate(minIso) ?? startOfTodayLocal();
    }
    return startOfTodayLocal();
  }, [minIso]);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label} <span className="text-destructive">*</span>
      </Label>
      <IsoDatePicker
        id={id}
        value={value}
        onChange={onChange}
        minDate={minDate}
        disabled={disabled}
        placeholder="Chọn ngày"
        aria-invalid={Boolean(showError && error)}
        className={cn(showError && error && "border-destructive")}
      />
      <ProjectNewFieldError message={showError ? error : undefined} />
    </div>
  );
}
