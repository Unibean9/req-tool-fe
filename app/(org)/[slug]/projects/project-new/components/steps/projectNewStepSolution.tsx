"use client";

import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";

import { PROJECT_MIN_TEXT_CHARS } from "../projectFormLimits";
import { ProjectBudgetVndInput } from "../projectBudgetVndInput";
import type { ProjectNewFormErrors } from "../projectNewFormSchema";
import { ProjectNewStringListField } from "../projectNewStringListField";

export function ProjectNewStepSolution({
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
  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Đề xuất giải pháp
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ngân sách và ít nhất một đề xuất — mỗi mục tối thiểu {PROJECT_MIN_TEXT_CHARS}{" "}
          ký tự.
        </p>
      </div>

      <ProjectBudgetVndInput
        value={form.budget ?? 0}
        onChange={(budget) => onPatch({ budget })}
        disabled={disabled}
        required
        showError={showSubmitErrors}
        error={errors?.budget}
      />

      <ProjectNewStringListField
        id="pn-solution"
        fieldKey="proposedSolutions"
        label="Đề xuất giải pháp"
        required
        hint={`Một hoặc nhiều hướng xử lý — tối thiểu ${PROJECT_MIN_TEXT_CHARS} ký tự/mục`}
        placeholder="Ví dụ: Tích hợp cổng thanh toán mới…"
        items={form.proposedSolutions}
        onChange={(proposedSolutions) => onPatch({ proposedSolutions })}
        disabled={disabled}
        addLabel="Thêm đề xuất"
        addButtonInHeader
        showSubmitErrors={showSubmitErrors}
        errors={errors}
      />
    </div>
  );
}
