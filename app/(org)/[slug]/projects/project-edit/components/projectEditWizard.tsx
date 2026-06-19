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
import { PROJECT_NEW_TOTAL_STEPS } from "../../project-new/components/projectNewSteps";
import { ProjectNewStepBasics } from "../../project-new/components/steps/projectNewStepBasics";
import { ProjectEditFooter } from "./projectEditFooter";
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

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ProjectEditToolbar
          currentStepIndex={step}
          onExit={exitWizard}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 sm:px-8 sm:pb-5 lg:px-10 lg:pb-6">
          <div className="mx-auto w-full max-w-2xl py-6">
            <ProjectNewStepBasics
              form={wizardForm}
              onPatch={patchForm}
              disabled={pending}
              showSubmitErrors={showSubmitErrors}
              errors={stepErrors}
            />
          </div>
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
    </div>
  );
}
