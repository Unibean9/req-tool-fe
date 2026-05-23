"use client";

import { FileText, FolderKanban } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";

import { ProjectNewFieldError } from "../projectNewFieldError";
import {
  PROJECT_DESCRIPTION_MAX_CHARS,
  PROJECT_MIN_TEXT_CHARS,
  PROJECT_NAME_MAX_CHARS,
  PROJECT_SHORT_SUMMARY_MAX_CHARS,
} from "../projectFormLimits";
import { resolveProjectNewTextFieldError } from "../projectNewFieldValidation";
import type { ProjectNewFormErrors } from "../projectNewFormSchema";

export function ProjectNewStepBasics({
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
  const nameLen = form.name.length;
  const shortLen = (form.executiveSummary ?? "").length;
  const descriptionLen = form.description.length;
  const nameError = resolveProjectNewTextFieldError(
    form.name,
    errors?.name,
    showSubmitErrors
  );
  const executiveError = resolveProjectNewTextFieldError(
    form.executiveSummary ?? "",
    errors?.executiveSummary,
    showSubmitErrors
  );
  const descriptionError = resolveProjectNewTextFieldError(
    form.description,
    errors?.description,
    showSubmitErrors
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Thông tin dự án
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tất cả trường bắt buộc — mỗi mô tả tối thiểu {PROJECT_MIN_TEXT_CHARS}{" "}
          ký tự.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="pn-name" className="text-sm font-semibold">
              Tên dự án <span className="text-destructive">*</span>
            </Label>
            <span
              className="text-xs tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {nameLen} / {PROJECT_NAME_MAX_CHARS}
            </span>
          </div>
          <div className="relative">
            <FolderKanban className="text-foreground/40 pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2" />
            <Input
              id="pn-name"
              autoComplete="off"
              aria-invalid={Boolean(nameError)}
              placeholder="Nhập tên dự án…"
              value={form.name}
              onChange={(e) =>
                onPatch({
                  name: e.target.value.slice(0, PROJECT_NAME_MAX_CHARS),
                })
              }
              disabled={disabled}
              maxLength={PROJECT_NAME_MAX_CHARS}
              className={cn(
                "h-11 border-2 border-border/90 pl-11 dark:border-zinc-600",
                nameError && "border-destructive"
              )}
            />
          </div>
          <ProjectNewFieldError message={nameError} />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="pn-executive" className="text-sm font-semibold">
              Tóm tắt <span className="text-destructive">*</span>
            </Label>
            <span
              className="text-xs tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {shortLen} / {PROJECT_SHORT_SUMMARY_MAX_CHARS}
            </span>
          </div>
          <div className="relative">
            <FileText
              className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
              aria-hidden
            />
            <Textarea
              id="pn-executive"
              aria-invalid={Boolean(executiveError)}
              placeholder="Tóm tắt ngắn cho stakeholder / ban lãnh đạo…"
              value={form.executiveSummary ?? ""}
              onChange={(e) =>
                onPatch({
                  executiveSummary: e.target.value.slice(
                    0,
                    PROJECT_SHORT_SUMMARY_MAX_CHARS
                  ),
                })
              }
              disabled={disabled}
              maxLength={PROJECT_SHORT_SUMMARY_MAX_CHARS}
              className={cn(
                "min-h-28 border-2 border-border/90 pl-10 dark:border-zinc-600",
                executiveError && "border-destructive"
              )}
            />
          </div>
          <ProjectNewFieldError message={executiveError} />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="pn-desc" className="text-sm font-semibold">
              Mô tả chi tiết <span className="text-destructive">*</span>
            </Label>
            <span
              className="text-xs tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {descriptionLen} / {PROJECT_DESCRIPTION_MAX_CHARS}
            </span>
          </div>
          <div className="relative">
            <Textarea
              id="pn-desc"
              aria-invalid={Boolean(descriptionError)}
              placeholder="Mô tả mục đích, phạm vi và đối tượng sử dụng của dự án…"
              value={form.description}
              onChange={(e) =>
                onPatch({
                  description: e.target.value.slice(
                    0,
                    PROJECT_DESCRIPTION_MAX_CHARS
                  ),
                })
              }
              disabled={disabled}
              maxLength={PROJECT_DESCRIPTION_MAX_CHARS}
              className={cn(
                "min-h-48 border-2 border-border/90 sm:min-h-52 dark:border-zinc-600",
                descriptionError && "border-destructive"
              )}
            />
          </div>
          <ProjectNewFieldError message={descriptionError} />
        </div>
      </div>
    </div>
  );
}
