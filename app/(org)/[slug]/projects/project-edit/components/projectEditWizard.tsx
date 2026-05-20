"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { CreateOrgProjectRequest, OrgProject } from "@/lib/api/services/fetchProject";
import { useUpdateOrgProject } from "@/hooks/useProject";
import {
  orgProjectFormValuesToUpdateBody,
  orgProjectToFormValues,
  type OrgProjectFormValues,
} from "@/lib/project/orgProjectForm";

import {
  isProjectNewFormValid,
  isProjectNewStepValid,
  validateProjectNewStep,
} from "../../project-new/components/projectNewFormSchema";
import { ProjectNewPreviewDialog } from "../../project-new/components/projectNewPreviewDialog";
import { PROJECT_NEW_TOTAL_STEPS } from "../../project-new/components/projectNewSteps";
import { ProjectNewStepBasics } from "../../project-new/components/steps/projectNewStepBasics";
import { ProjectNewStepContext } from "../../project-new/components/steps/projectNewStepContext";
import { ProjectNewStepPlan } from "../../project-new/components/steps/projectNewStepPlan";
import { ProjectNewStepSolution } from "../../project-new/components/steps/projectNewStepSolution";
import { ProjectEditFooter } from "./projectEditFooter";
import { ProjectEditSidebar } from "./projectEditSidebar";
import { ProjectEditToolbar } from "./projectEditToolbar";

export type ProjectEditWizardProps = {
  orgId: string;
  project: OrgProject;
  dashboardHref: string;
};

export function ProjectEditWizard({
  orgId,
  project,
  dashboardHref,
}: ProjectEditWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OrgProjectFormValues>(() =>
    orgProjectToFormValues(project)
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showSubmitErrors, setShowSubmitErrors] = useState(false);

  const wizardForm = form as CreateOrgProjectRequest;

  const updateMutation = useUpdateOrgProject({
    onSuccess: () => {
      router.push(dashboardHref);
    },
  });

  const patchForm = useCallback((patch: Partial<OrgProjectFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const stepErrors = useMemo(
    () => validateProjectNewStep(step, wizardForm).errors,
    [step, wizardForm]
  );

  const isLast = step === PROJECT_NEW_TOTAL_STEPS - 1;
  const pending = updateMutation.isPending;
  const stepValid = isProjectNewStepValid(step, wizardForm);
  const formValid = isProjectNewFormValid(wizardForm);
  const nextDisabled = isLast ? !formValid || pending : !stepValid || pending;

  const goToStep = useCallback((next: number) => {
    setShowSubmitErrors(false);
    setStep(next);
  }, []);

  const exitWizard = useCallback(() => {
    router.replace(dashboardHref);
  }, [router, dashboardHref]);

  const handleNext = () => {
    const validation = validateProjectNewStep(step, wizardForm);
    if (!validation.success) {
      setShowSubmitErrors(true);
      return;
    }
    if (isLast) {
      if (!formValid || pending) return;
      updateMutation.mutate({
        orgId,
        projectId: project.id,
        body: orgProjectFormValuesToUpdateBody(form),
      });
      return;
    }
    setShowSubmitErrors(false);
    setStep((s) => Math.min(PROJECT_NEW_TOTAL_STEPS - 1, s + 1));
  };

  const handleBack = () => {
    setShowSubmitErrors(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const stepValidationProps = {
    showSubmitErrors,
    errors: stepErrors,
  };

  const stepContent = (() => {
    switch (step) {
      case 0:
        return (
          <ProjectNewStepBasics
            form={wizardForm}
            onPatch={patchForm}
            disabled={pending}
            {...stepValidationProps}
          />
        );
      case 1:
        return (
          <ProjectNewStepContext
            form={wizardForm}
            onPatch={patchForm}
            disabled={pending}
            {...stepValidationProps}
          />
        );
      case 2:
        return (
          <ProjectNewStepSolution
            form={wizardForm}
            onPatch={patchForm}
            disabled={pending}
            {...stepValidationProps}
          />
        );
      case 3:
        return (
          <ProjectNewStepPlan
            form={wizardForm}
            onPatch={patchForm}
            disabled={pending}
            {...stepValidationProps}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <ProjectEditSidebar
        className="hidden lg:flex"
        dashboardHref={dashboardHref}
        currentStepIndex={step}
        onStepSelect={goToStep}
        freeNavigation
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ProjectEditToolbar
          currentStepIndex={step}
          onPreview={() => setPreviewOpen(true)}
          onExit={exitWizard}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 sm:px-8 sm:pb-5 lg:px-10 lg:pb-6">
          <div className="mx-auto w-full max-w-5xl py-1">{stepContent}</div>
        </div>

        <ProjectEditFooter
          currentStepIndex={step}
          totalSteps={PROJECT_NEW_TOTAL_STEPS}
          canGoBack={step > 0}
          onBack={handleBack}
          onCancel={exitWizard}
          isLastStep={isLast}
          nextDisabled={nextDisabled}
          nextLoading={pending}
          onNext={handleNext}
        />
      </div>

      <ProjectNewPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        form={wizardForm}
        description="Tóm tắt thông tin trước khi lưu — bố cục giống trang tổng quan dự án."
      />
    </div>
  );
}
