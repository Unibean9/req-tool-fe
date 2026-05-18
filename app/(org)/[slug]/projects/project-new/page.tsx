"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";
import { useCreateOrgProject } from "@/hooks/useProject";

import { useOrgWorkspace } from "../../orgWorkspaceContext";
import { ProjectNewFooter } from "./components/projectNewFooter";
import { ProjectNewPageToolbar } from "./components/projectNewPageToolbar";
import { ProjectNewPreviewDialog } from "./components/projectNewPreviewDialog";
import { ProjectNewSidebar } from "./components/projectNewSidebar";
import { PROJECT_NEW_TOTAL_STEPS } from "./components/projectNewSteps";
import {
  isProjectNewFormValid,
  isProjectNewStepValid,
  validateProjectNewStep,
} from "./components/projectNewFormSchema";
import { ProjectNewStepBasics } from "./components/steps/projectNewStepBasics";
import { ProjectNewStepContext } from "./components/steps/projectNewStepContext";
import { ProjectNewStepSolution } from "./components/steps/projectNewStepSolution";

function emptyCreateProjectForm(): CreateOrgProjectRequest {
  return {
    name: "",
    description: "",
    context: "",
    problems: [],
    proposedSolutions: [],
  };
}

export default function OrgProjectNewPage() {
  const router = useRouter();
  const { orgId, slug } = useOrgWorkspace();
  const encSlug = encodeURIComponent(slug);
  const projectsBase = `/${encSlug}/projects`;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateOrgProjectRequest>(emptyCreateProjectForm);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showSubmitErrors, setShowSubmitErrors] = useState(false);

  const stepErrors = useMemo(
    () => validateProjectNewStep(step, form).errors,
    [step, form]
  );

  const createProject = useCreateOrgProject({
    onSuccess: (res) => {
      router.push(
        `${projectsBase}/${encodeURIComponent(res.data.slug)}/dashboard`
      );
    },
  });

  const patchForm = useCallback((patch: Partial<CreateOrgProjectRequest>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const exitWizard = useCallback(() => {
    router.replace(projectsBase);
  }, [router, projectsBase]);

  const isFillHeightStep = step === 0 || step === 1;
  const isLast = step === PROJECT_NEW_TOTAL_STEPS - 1;
  const stepValid = isProjectNewStepValid(step, form);
  const formValid = isProjectNewFormValid(form);
  const nextDisabled = isLast
    ? !formValid || createProject.isPending
    : !stepValid || createProject.isPending;

  const goToStep = useCallback((next: number) => {
    setShowSubmitErrors(false);
    setStep(next);
  }, []);

  const handleNext = () => {
    const validation = validateProjectNewStep(step, form);
    if (!validation.success) {
      setShowSubmitErrors(true);
      return;
    }
    if (isLast) {
      if (!formValid || createProject.isPending) return;
      createProject.mutate({ orgId, body: form });
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
            form={form}
            onPatch={patchForm}
            disabled={createProject.isPending}
            {...stepValidationProps}
          />
        );
      case 1:
        return (
          <ProjectNewStepContext
            form={form}
            onPatch={patchForm}
            disabled={createProject.isPending}
            {...stepValidationProps}
          />
        );
      case 2:
        return (
          <ProjectNewStepSolution
            form={form}
            onPatch={patchForm}
            disabled={createProject.isPending}
            {...stepValidationProps}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <ProjectNewSidebar
        className="hidden lg:flex"
        projectsHref={projectsBase}
        currentStepIndex={step}
        onStepSelect={goToStep}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ProjectNewPageToolbar
          currentStepIndex={step}
          onPreview={() => setPreviewOpen(true)}
          onExit={exitWizard}
        />

        <div
          className={cn(
            isFillHeightStep
              ? "flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-4 sm:px-8 sm:pb-5 lg:px-10 lg:pb-6"
              : "min-h-0 flex-1 overflow-y-auto px-6 pb-8 sm:px-10 sm:pb-10 lg:px-14 lg:pb-12"
          )}
        >
          <div
            className={cn(
              "w-full max-w-5xl mx-auto",
              isFillHeightStep && "flex min-h-0 flex-1 flex-col"
            )}
          >
            {stepContent}
          </div>
        </div>

        <ProjectNewFooter
          currentStepIndex={step}
          totalSteps={PROJECT_NEW_TOTAL_STEPS}
          canGoBack={step > 0}
          onBack={handleBack}
          isLastStep={isLast}
          nextDisabled={nextDisabled}
          nextLoading={createProject.isPending}
          onNext={handleNext}
        />
      </div>

      <ProjectNewPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        form={form}
      />
    </div>
  );
}
