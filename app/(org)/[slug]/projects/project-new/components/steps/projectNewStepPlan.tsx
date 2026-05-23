"use client";

import { TrendingUp } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  isProjectEndIsoInvalid,
  minProjectEndIsoDate,
} from "@/lib/project/projectDisplay";
import { cn } from "@/lib/utils";
import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";

import { ProjectNewFieldError } from "../projectNewFieldError";
import {
  PROJECT_BUSINESS_VALUE_LABEL,
  PROJECT_MIN_TEXT_CHARS,
  PROJECT_ROI_NOTES_MAX_CHARS,
} from "../projectFormLimits";
import type { ProjectNewFormErrors } from "../projectNewFormSchema";
import {
  ProjectPlanDateField,
} from "../projectPlanDateField";

export function ProjectNewStepPlan({
  form,
  onPatch,
  disabled,
  showSubmitErrors = false,
  errors,
}: {
  form: CreateOrgProjectRequest;
  onPatch: (patch: Partial<CreateOrgProjectRequest>) => void;
  disabled?: boolean;
  showSubmitErrors?: boolean;
  errors?: ProjectNewFormErrors;
}) {
  const roiLen = (form.roiNotes ?? "").length;
  const roiError = showSubmitErrors ? errors?.roiNotes : undefined;

  const handleStartChange = (startDate: string) => {
    const patch: Partial<CreateOrgProjectRequest> = { startDate };
    const endDate = (form.endDate ?? "").trim();
    if (endDate && isProjectEndIsoInvalid(startDate, endDate)) {
      patch.endDate = minProjectEndIsoDate(startDate);
    }
    onPatch(patch);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Kế hoạch & {PROJECT_BUSINESS_VALUE_LABEL}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ngày bắt đầu và kết thúc phải từ hôm nay trở đi; ngày kết thúc phải sau
          ngày bắt đầu. {PROJECT_BUSINESS_VALUE_LABEL} tuỳ chọn (nếu nhập thì tối
          thiểu {PROJECT_MIN_TEXT_CHARS} ký tự).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProjectPlanDateField
          id="pn-start"
          label="Ngày bắt đầu"
          value={form.startDate ?? ""}
          onChange={handleStartChange}
          disabled={disabled}
          error={errors?.startDate}
          showError={showSubmitErrors}
        />

        <ProjectPlanDateField
          id="pn-end"
          label="Ngày kết thúc"
          value={form.endDate ?? ""}
          onChange={(endDate) => onPatch({ endDate })}
          minIso={
            form.startDate?.trim()
              ? minProjectEndIsoDate(form.startDate)
              : undefined
          }
          disabled={disabled}
          error={errors?.endDate}
          showError={showSubmitErrors}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="pn-business-value" className="text-sm font-semibold">
            {PROJECT_BUSINESS_VALUE_LABEL}
          </Label>
          <span
            className="text-xs tabular-nums text-muted-foreground"
            aria-live="polite"
          >
            {roiLen} / {PROJECT_ROI_NOTES_MAX_CHARS}
          </span>
        </div>
        <div className="relative">
          <TrendingUp
            className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
            aria-hidden
          />
          <Textarea
            id="pn-business-value"
            aria-invalid={Boolean(roiError)}
            placeholder="Lợi ích kỳ vọng, tác động kinh doanh, rủi ro…"
            value={form.roiNotes ?? ""}
            onChange={(e) =>
              onPatch({
                roiNotes: e.target.value.slice(0, PROJECT_ROI_NOTES_MAX_CHARS),
              })
            }
            disabled={disabled}
            maxLength={PROJECT_ROI_NOTES_MAX_CHARS}
            className={cn(
              "min-h-[calc(100dvh-26rem)] border-2 border-border/90 pl-10 dark:border-zinc-600",
              roiError && "border-destructive"
            )}
          />
        </div>
        <ProjectNewFieldError message={roiError} />
      </div>
    </div>
  );
}
